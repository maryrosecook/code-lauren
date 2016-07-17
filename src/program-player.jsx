var $ = require('jquery');
var React = require('react');
var _ = require("underscore");

var programState = require("./lang/program-state");
var vm = require("./lang/vm");
var parser = require("./lang/parser");
var compile = require("./lang/compiler");
var langUtil = require("../src/lang/lang-util");
var url = require("./url");

var STEP_TO_SAVE = 40000;

function annotateCurrentInstruction(ps, annotator) {
  if (ps.get("currentInstruction") === undefined) { return; }

  annotator.clear();

  var e = ps.get("exception");
  if (programState.isCrashed(ps) && e instanceof langUtil.RuntimeError) {
    annotator.codeHighlight(ps.get("code"), e.s, e.e, "error");
    annotator.lineMessage(ps.get("code"), e.s, "error", e.message);
  } else if (!programState.isCrashed(ps)) {
    annotator.codeHighlight(ps.get("code"),
                            ps.get("currentInstruction").ast.s,
                            ps.get("currentInstruction").ast.e,
                            "exec");
  }
};

function hasAnnotatablePs(pses) {
  for (var i = 0; i < pses.length; i++) {
    var currentInstruction = pses[i].get("currentInstruction");
    if (currentInstruction !== undefined && currentInstruction.annotate === true) {
      return true;
    }
  }

  return false;
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

function initProgramState(code, annotator, canvasLib, inputter) {
  canvasLib.program.reset();
  var ast = parse(code, annotator);
  if (ast !== undefined) {
    var programBindings = require("./lang/standard-library")()
        .merge(canvasLib.user);
    var ps = programState
        .init(code, compile(ast), programBindings)
        .set("canvasLib", canvasLib.program);
    ps = programState.mergeTopLevelBindings(ps, inputter.getMouseBindings());
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
      annotator.lineMessage(code, e.s, "error", e.message);
    }
  }
};

var ProgramPlayer = React.createClass({
  getInitialState: function() {
    this.stepBackwardsClickHandler = onClickOrHoldDown(this.stepBackwardsByHand);
    this.stepForwardsClickHandler = onClickOrHoldDown(this.stepForwardsByHand);

    this.setupProgramReevaluation();

    var self = this;

    (function tick(lastEventLoopYield) {
      while(true) {
        if (!self.state ||
            !self.state.ps) {
          setTimeout(() => requestAnimationFrame(() => tick(Date.now())), 200);
          break;
        } else if (programState.isComplete(self.state.ps) ||
                   programState.isCrashed(self.state.ps)) {
          self.state.ps.get("canvasLib").flush();

          // Check not paused to avoid rerendering error messages
          // every 200ms when crashed. Temp hack until I rewrite the
          // annotator in React.
          if (!self.state.paused) {
            self.pause();
          }

          setTimeout(() => requestAnimationFrame(() => tick(Date.now())), 200);
          break;
        } else if (self.state.paused) {
          setTimeout(() => requestAnimationFrame(() => tick(Date.now())), 200);
          break;
        } else {
          self.stepForwards();

          if (self.state.ps.get("canvasLib").hitClearScreen() === true) {
            self.state.ps.get("canvasLib").clearScreen();
            self.state.ps.get("canvasLib").flush();
            requestAnimationFrame(() => tick(Date.now()))
            break;
          } else if (Date.now() - lastEventLoopYield > 33) {
            self.state.ps.get("canvasLib").runDrawOperationsSinceLastRepaint();
            requestAnimationFrame(() => tick(Date.now()))
            break;
          } else if (self.state.ps.get("currentInstruction").isForever) {
            // By recurring, we rate limit non-clear-screening programs
            // to roughly the same rate as a clear-screening program
            // which makes stepping a non-clear-screening program better
            // because fewer iterations happen in a given period of running time
            requestAnimationFrame(() => tick(lastEventLoopYield))
            break;
          }
        }
      }
    })(new Date().getTime());

    return { ps: undefined, paused: false, pses: [] };
  },

  setupProgramReevaluation: function() {
    var self = this;
    function reevaluateProgram() {
      self.state.ps = initProgramState(self.props.editor.getValue(),
                                       self.props.annotator,
                                       self.props.canvasLib,
                                       self.props.inputter);
      self.state.paused = false;
      self.state.pses = [];
      self.setState(self.state);
    };

    var rerunProgramTimer;
    this.props.editor.on("change", function() {
      self.props.annotator.clear();
      clearTimeout(rerunProgramTimer);
      rerunProgramTimer = setTimeout(reevaluateProgram, 400);
    });
  },

  onRewindClick: function() {
    this.state.ps = initProgramState(this.props.editor.getValue(),
                                     this.props.annotator,
                                     this.props.canvasLib,
                                     this.props.inputter);
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
    this.state.ps.get("canvasLib").pause();
    this.setState(this.state);
    annotateCurrentInstruction(this.state.ps, this.props.annotator);
  },

  unpause: function() {
    this.state.paused = false;
    this.props.annotator.clear();
    this.state.ps.get("canvasLib").play();
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

    if (programState.isCrashed(this.state.ps) || programState.isComplete(this.state.ps)) {
      return;
    }

    if (!this.state.paused) {
      this.state.ps = programState.mergeTopLevelBindings(this.state.ps,
                                                         this.props.inputter.getMouseBindings());
    }

    var loopCount = 0;
    var ps = this.state.ps;
    var newPses = [];
    while (true) {
      newPses.push(ps);
      ps = vm.step(ps);

      var currentInstruction = ps.get("currentInstruction");
      if (programState.isCrashed(ps) || // assume want to annotate crashed instruction
          (currentInstruction !== undefined &&
           currentInstruction.annotate === compile.ANNOTATE)) {
        if (programState.isCrashed(ps) && ps.get("exception") instanceof langUtil.RuntimeError) {
          var e = ps.get("exception");
          this.props.annotator.codeHighlight(ps.get("code"), e.s, e.e, "error");
          this.props.annotator.lineMessage(ps.get("code"), e.s, "error", e.message);
          annotateCurrentInstruction(ps, this.props.annotator);
        }

        for (var i = 0; i < newPses.length; i++) {
          if (this.state.pses.length > STEP_TO_SAVE) {
            this.state.pses.shift();
          }

          newPses[i].get("canvasLib").stepForwards();
          this.state.pses.push(newPses[i]);
        }

        this.state.ps = ps;
        return;
      } else if (programState.isComplete(ps) || programState.isCrashed(ps)) {
        this.state.ps = ps;
        this.pause();
        return;
      } else if (loopCount > 100) {
        throw new Error("Trapped in infinite loop trying to step");
      }

      loopCount++;
    }
  },

  stepBackwards: function() {
    var originalPs = this.state.ps;
    var i = this.state.pses.length - 1;
    while (true) {
      if (i === -1) { // couldn't find annotatable previous ps - don't step back
        this.state.ps = originalPs;
        break;
      } else if (this.state.pses[i].get("currentInstruction") !== undefined &&
                 this.state.pses[i].get("currentInstruction").annotate === compile.ANNOTATE) {
        for (var j = this.state.pses.length - 1; j >= i; j--) {
          this.state.ps = this.state.pses.pop();
          this.state.ps.get("canvasLib").stepBackwards();
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

    var testPs = this.state.ps;
    while(true) {
      testPs = vm.step(testPs, langUtil.NO_OUTPUTTING);
      if (testPs.get("currentInstruction") !== undefined &&
          testPs.get("currentInstruction").annotate === compile.ANNOTATE) {
        return true;
      } else if (programState.isCrashed(testPs) || programState.isComplete(testPs)) {
        return false;
      }
    }
  },

  canStepBackwards: function() {
    return this.state.pses !== undefined && hasAnnotatablePs(this.state.pses);
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

          <button onMouseDown={this.stepForwardsClickHandler}
                  onMouseUp={this.stepForwardsClickHandler}
                  className={"player-button step-forwards-button" + stepForwardsEnabledClassName} />

          <button onClick={this.onPlayPauseClick} className={playPauseClassName} />
        </div>
    );
  }
});

module.exports = ProgramPlayer;
