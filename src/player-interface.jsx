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
      }, 1000);
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

    if (this.state.player.isPaused() && !vm.isComplete(this.state.player.getProgramState())) {
      this.state.player.stepForwardsUntilReachAnnotableInstruction();
      annotateCurrentInstruction(this.state.player.getProgramState(), this.props.annotator);
    } else {
      this.props.annotator.clear();
    }

    this.setState(this.state);
  },

  stepForwards: function() {
    this.state.player.pause();
    this.state.player.stepForwards();
    this.state.player.stepForwardsUntilReachAnnotableInstruction();
    this.setState(this.state);

    annotateCurrentInstruction(this.state.player.getProgramState(), this.props.annotator);
  },

  stepBackwards: function() {
    this.state.player.pause();
    this.state.player.stepBackwards();
    this.state.player.stepBackwardsUntilReachAnnotableInstruction();
    this.setState(this.state);

    annotateCurrentInstruction(this.state.player.getProgramState(), this.props.annotator);
  },

  render: function() {
    var playPauseClassName = "playerButton " +
        (this.state.player.isPaused() ? "playButton" : "pauseButton");

    return (
      <div className="programPlayer">
        <button onMouseDown={this.stepBackwardsClickHandler}
                onMouseUp={this.stepBackwardsClickHandler}
                className="playerButton stepBackwardsButton" />

        <button onClick={this.onPlayPauseClick} className={playPauseClassName} />

        <button onMouseDown={this.stepForwardsClickHandler}
                onMouseUp={this.stepForwardsClickHandler}
                className="playerButton stepForwardsButton" />
      </div>
    );
  }
});

module.exports = ProgramPlayer;
