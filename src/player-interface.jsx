var $ = require('jquery');
var React = require('react');
var _ = require("underscore");

var env = require("./env");
var vm = require("./lang/vm");
var parser = require("./lang/parser");
var compile = require("./lang/compiler");
var langUtil = require("../src/lang/lang-util");
var copyProgramState = require("../src/copy-program-state");

var STEP_TO_SAVE = 5000;

function isTimeToYieldToEventLoop(lastYield) {
  return new Date().getTime() - lastYield > 8;
};

function annotateCurrentInstruction(ps, annotator) {
  if (ps.currentInstruction === undefined) { return; }

  annotator.clear();
  annotator.codeHighlight(ps.code,
                          ps.currentInstruction.ast.s,
                          ps.currentInstruction.ast.e,
                          "currently-executing");
};

function onClickOrHoldDown(onClick) {
  var firstClickTime;
  var timerId;

  return function(e) {
    if (e.type === "mousedown" && firstClickTime === undefined) {
      firstClickTime = new Date().getTime();
      onClick();

      timerId = setTimeout(function() {
        timerId = setInterval(function() {
          onClick();
        }, 0);
      }, 300);
    } else if (e.type === "mouseup") {
      clearInterval(timerId);
      timerId = undefined;
      firstClickTime = undefined;
    }
  };
};

function initProgramState(code, annotator, canvasLib) {
  canvasLib.programFns.reset();
  var ast = parse(code, annotator);
  if (ast !== undefined) {
    var programEnv = env.createEnv(env.mergeLibraries(require("./lang/standard-library")(),
                                                      canvasLib.userFns));
    var ps = vm.initProgramState(code, compile(ast), programEnv);
    ps.canvasLib = canvasLib.programFns;
    return ps;
  }
};

function parse(code, annotator) {
  annotator.clear();

  try {
    parser.balanceParentheses(code);
    return parser.parse(code);
  } catch(e) {
    if (e instanceof parser.ParseError) {
      annotator.codeHighlight(code, e.s, e.e, "error");
      annotator.lineMessage(code, e.s, "error", e.message);
    } else if (e instanceof parser.ParenthesisError) {
      annotator.codeHighlight(code, e.s, e.e, "error");
      displayRainbowParentheses(code, annotator);

      annotator.lineMessage(code, e.s, "error", e.message);
    }
  }
};

function displayRainbowParentheses(code, annotator) {
  parser.rainbowParentheses(code)
    .forEach(function(p, i) {
      p.map(function(offset) {
        annotator.codeHighlight(code, offset, offset + 1, "rainbow-" + i % 4);  });
    });
};

var ProgramPlayer = React.createClass({
  getInitialState: function() {
    var self = this;
    var hitClearScreen = false;

    (function tick(lastEventLoopYield) {
      while(true) {
        if (self.state !== null && self.state.ps !== undefined && !self.state.paused) {
          if (hitClearScreen) {
            self.state.ps.canvasLib.clearScreen();
          }

          if (vm.isComplete(self.state.ps)) {
            self.state.ps.canvasLib.flush();
          } else {
            self.stepForwards();

            hitClearScreen = self.state.ps.canvasLib.hitClearScreen();
            if (hitClearScreen === true) {
              self.state.ps.canvasLib.flush();
            }
          }
        }

        if (hitClearScreen || isTimeToYieldToEventLoop(lastEventLoopYield)) {
          requestAnimationFrame(() => tick(new Date().getTime()))
          break;
        }
      }
    })(new Date().getTime());

    this.stepBackwardsClickHandler = onClickOrHoldDown(this.stepBackwardsByHand);
    this.stepForwardsClickHandler = onClickOrHoldDown(this.stepForwardsByHand);

    this.props.editor.on("change", function() {
      self.state.ps = initProgramState(self.props.editor.getValue(),
                                       self.props.annotator,
                                       self.props.canvasLib);
      self.state.paused = false;
      self.state.pses = [];
      self.setState(self.state);
    });

    return { ps: undefined, paused: false, pses: [] };
  },

  onRewindClick: function() {
    this.state.ps = initProgramState(this.props.editor.getValue(),
                                     this.props.annotator,
                                     this.props.canvasLib);
    this.state.pses = [];
    this.stepForwardsByHand();
  },

  onPlayPauseClick: function() {
    if (this.state.paused === true) {
      this.unpause();
    } else if (this.state.paused === false) {
      this.pause();
    } else {
      throw new Error("Tried to toggle player pause but it's neither paused nor unpaused");
    }
  },

  pause: function() {
    this.state.paused = true;
    this.state.ps.canvasLib.pause();
    this.setState(this.state);
    annotateCurrentInstruction(this.state.ps, this.props.annotator);
  },

  unpause: function() {
    this.state.paused = false;
    this.props.annotator.clear();
    this.setState(this.state);
  },

  stepForwardsByHand: function() {
    this.stepForwards();
    this.pause();
  },

  stepForwards: function() {
    // Assumes all side effecting (bascially drawing) functions are annotatable.
    // Without this assumption, the case where we don't make it to an annotatable
    // instruction would leave side effects done.

    if (vm.isCrashed(this.state.ps) || vm.isComplete(this.state.ps)) {
      this.setState(this.state); // update buttons
      return;
    }

    var originalPs = this.state.ps;
    var newPses = [];
    while (true) {
      try {
        newPses.push(copyProgramState(this.state.ps));
        vm.step(this.state.ps);
      } catch (e) {
        if (e instanceof langUtil.RuntimeError) {
          this.props.annotator.codeHighlight(this.state.ps.code, e.s, e.e, "error");
          this.props.annotator.lineMessage(this.state.ps.code, e.s, "error", e.message);
        }
      }

      if (vm.isCrashed(this.state.ps) || // assume want to annotate crashed instruction
          (this.state.ps.currentInstruction !== undefined &&
           this.state.ps.currentInstruction.annotate === compile.ANNOTATE)) {
        break;
      } else if (vm.isComplete(this.state.ps)) {
        newPses = [];
        this.state.ps = originalPs;
        break;
      }
    }

    for (var i = 0; i < newPses.length; i++) {
      if (this.state.pses.length > STEP_TO_SAVE) {
        this.state.pses.shift();
        this.state.ps.canvasLib.deleteOld(STEP_TO_SAVE);
      }

      newPses[i].canvasLib.stepForwards();
      this.state.pses.push(newPses[i]);
    }
  },

  stepBackwards: function() {
    var originalPs = this.state.ps;
    var i = this.state.pses.length - 1;
    while (true) {
      if (i === -1) { // couldn't find annotatable previous ps - don't step back
        this.state.ps = originalPs;
        break;
      } else if (this.state.pses[i].currentInstruction !== undefined &&
                 this.state.pses[i].currentInstruction.annotate === compile.ANNOTATE) {
        for (var j = this.state.pses.length - 1; j >= i; j--) {
          this.state.ps = this.state.pses.pop();
          this.state.ps.canvasLib.stepBackwards();
        }

        break;
      }

      i--;
    }
  },

  stepBackwardsByHand: function() {
    if (this.state.paused === false) {
      this.pause();
    } else {
      this.stepBackwards();
    }

    this.setState(this.state);
    annotateCurrentInstruction(this.state.ps, this.props.annotator);
  },

  canStepForwards: function() {
    if (this.state.ps === undefined) { return false; }

    var testPs = copyProgramState(this.state.ps);
    while(true) {
      try {
        vm.step(testPs, langUtil.NO_SIDE_EFFECTS);
      } catch(e) {} // swallow any errors - program will get marked as crashed

      if (testPs.currentInstruction !== undefined &&
          testPs.currentInstruction.annotate === compile.ANNOTATE) {
        return true;
      } else if (vm.isCrashed(testPs) || vm.isComplete(testPs)) {
        return false;
      }
    }
  },

  canStepBackwards: function() {
    return this.state.pses !== undefined && this.state.pses.length > 1;
  },

  render: function() {
    var playPauseClassName = "player-button " +
        (this.state.paused ? "play-button" : "pause-button");

    var stepBackwardsEnabledClassName = !this.state.paused || this.canStepBackwards() ?
        "" : " disabled ";
    var stepForwardsEnabledClassName = !this.state.paused || this.canStepForwards() ?
        "" : " disabled ";

    return (
        <div className="program-player">
          <button onClick={this.onRewindClick}
                  className={"player-button rewind-button" + stepBackwardsEnabledClassName} />

          <button onMouseDown={this.stepBackwardsClickHandler}
                  onMouseUp={this.stepBackwardsClickHandler}
                  className={"player-button step-backwards-button" +
                             stepBackwardsEnabledClassName} />

          <button onClick={this.onPlayPauseClick} className={playPauseClassName} />

          <button onMouseDown={this.stepForwardsClickHandler}
                  onMouseUp={this.stepForwardsClickHandler}
                  className={"player-button step-forwards-button" + stepForwardsEnabledClassName} />
        </div>
    );
  }
});

module.exports = ProgramPlayer;
