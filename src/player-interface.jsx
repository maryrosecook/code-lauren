var $ = require('jquery');
var React = require('react');
var compiler = require("./lang/compiler");
var vm = require("./lang/vm");
var setupPlayer = require("./program-player");
var env = require("./env");
var vm = require("./lang/vm");
var parser = require("./lang/parser");
var compile = require("./lang/compiler");

function annotateCurrentInstruction(ps, annotator) {
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
    this.stepBackwardsClickHandler = onClickOrHoldDown(this.stepBackwards);
    this.stepForwardsClickHandler = onClickOrHoldDown(this.stepForwards);

    var player = setupPlayer(this.props.annotator);

    var self = this;
    this.props.editor.on("change", function() {
      player.setProgramState(initProgramState(self.props.editor.getValue(),
                                              self.props.annotator,
                                              self.props.canvasLib));

      self.setState(self.state);
    });

    return { player: player };
  },

  onRewindClick: function() {
    this.state.player.setProgramState(initProgramState(this.props.editor.getValue(),
                                                       this.props.annotator,
                                                       this.props.canvasLib));
    this.state.player.pause();
    this.stepForwards();
  },

  onPlayPauseClick: function() {
    this.state.player.togglePause();

    if (this.state.player.isPaused()) {
      annotateCurrentInstruction(this.state.player.getProgramState(), this.props.annotator);
    } else {
      this.props.annotator.clear();
    }

    this.setState(this.state);
  },

  stepForwards: function() {
    this.state.player.pause();
    this.state.player.stepForwards();
    this.setState(this.state);

    annotateCurrentInstruction(this.state.player.getProgramState(), this.props.annotator);
  },

  stepBackwards: function() {
    this.state.player.pause();
    this.state.player.stepBackwards();
    this.setState(this.state);

    annotateCurrentInstruction(this.state.player.getProgramState(), this.props.annotator);
  },

  render: function() {
    var playPauseClassName = "player-button " +
        (this.state.player.isPaused() ? "play-button" : "pause-button");

    return (
        <div className="program-player">
          <button onClick={this.onRewindClick}
                  className="player-button rewind-button" />

          <button onMouseDown={this.stepBackwardsClickHandler}
                  onMouseUp={this.stepBackwardsClickHandler}
                  className="player-button step-backwards-button" />

          <button onClick={this.onPlayPauseClick} className={playPauseClassName} />

          <button onMouseDown={this.stepForwardsClickHandler}
                  onMouseUp={this.stepForwardsClickHandler}
                  className="player-button step-forwards-button" />
        </div>
    );
  }
});

module.exports = ProgramPlayer;
