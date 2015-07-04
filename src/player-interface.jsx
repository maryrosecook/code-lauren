var React = require('react');
var compiler = require("./lang/compiler");

function annotateCurrentInstruction(p, annotator) {
  console.log(p.currentInstruction);
  annotator.clear();
  annotator.codeHighlight(p.code,
                          p.currentInstruction.ast.s,
                          p.currentInstruction.ast.e,
                          "currently-executing");
};

function stepUntilReachAnnotatableInstruction(player) {
  var currentInstruction = player.getProgram().currentInstruction;
  while (currentInstruction.annotate === compiler.DO_NOT_ANNOTATE) {
    player.stepForwards(1);
    currentInstruction = player.getProgram().currentInstruction;
  }
};

var ProgramPlayer = React.createClass({
  getInitialState: function() {
    return { player: this.props.player };
  },

  onPlayPauseClick: function() {
    this.state.player.togglePause();

    if (this.state.player.isPaused()) {
      stepUntilReachAnnotatableInstruction(this.state.player);
      annotateCurrentInstruction(this.state.player.getProgram(), this.props.annotator);
    } else {
      this.props.annotator.clear();
    }

    this.setState(this.state);
  },

  onStepForwardsClick: function() {
    this.state.player.pause();
    this.state.player.stepForwards(1);
    stepUntilReachAnnotatableInstruction(this.state.player);
    this.setState(this.state);

    annotateCurrentInstruction(this.state.player.getProgram(), this.props.annotator);
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
