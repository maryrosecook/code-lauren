var React = require('react');
var compiler = require("./lang/compiler");
var vm = require("./lang/vm");

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
      }, 200);
    } else if (e.type === "mouseup") {
      clearInterval(timerId);
      timerId = undefined;
      firstClickTime = undefined;
    }
  };
};

var ProgramPlayer = React.createClass({
  getInitialState: function() {
    this.stepBackwardsClickHandler = onClickOrHoldDown(this.stepBackwards);
    this.stepForwardsClickHandler = onClickOrHoldDown(this.stepForwards);

    return { player: this.props.player };
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

  setProgramState: function(ps) {
    this.state.player.setProgramState(ps);
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
