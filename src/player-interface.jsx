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

function stepUntilReachAnnotatableInstruction(player) {
  var currentInstruction = player.getProgramState().currentInstruction;
  while (currentInstruction.annotate === compiler.DO_NOT_ANNOTATE) {
    player.stepForwards();
    currentInstruction = player.getProgramState().currentInstruction;
  }
};

var ProgramPlayer = React.createClass({
  getInitialState: function() {
    return { player: this.props.player };
  },

  onPlayPauseClick: function() {
    this.state.player.togglePause();

    if (this.state.player.isPaused() && !vm.isComplete(this.state.player.getProgramState())) {
      stepUntilReachAnnotatableInstruction(this.state.player);
      annotateCurrentInstruction(this.state.player.getProgramState(), this.props.annotator);
    } else {
      this.props.annotator.clear();
    }

    this.setState(this.state);
  },

  onStepForwardsClick: function() {
    this.state.player.pause();
    this.state.player.stepForwards();
    stepUntilReachAnnotatableInstruction(this.state.player);
    this.setState(this.state);

    annotateCurrentInstruction(this.state.player.getProgramState(), this.props.annotator);
  },

  onStepBackwardsClick: function() {
    this.state.player.pause();
    this.state.player.stepBackwards();
    this.setState(this.state);
  },

  render: function() {
    var playPauseClassName = "playerButton " +
        (this.state.player.isPaused() ? "playButton" : "pauseButton");
    return (
      <div className="programPlayer">
        <button onClick={this.onPlayPauseClick} className={playPauseClassName} />
        <button onClick={this.onStepForwardsClick} className="playerButton stepForwardsButton" />
      </div>
    );
  }
});

module.exports = ProgramPlayer;
