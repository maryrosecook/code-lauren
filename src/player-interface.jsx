var React = require('react');

var instructionsToNotAnnotate = ["pop", "return", "jump", "if_not_true_jump"];

function annotateCurrentInstruction(p, annotator) {
  annotator.clear();
  annotator.codeHighlight(p.code,
                          p.currentInstruction.ast.s,
                          p.currentInstruction.ast.e,
                          "currently-executing");
};

function isAnnotatableInstruction(ins) {
  console.log(ins);
  return instructionsToNotAnnotate.indexOf(ins[0]) === -1;
};

function stepUntilReachAnnotatableInstruction(player) {
  var currentInstruction = player.getProgram().currentInstruction;
  while (!isAnnotatableInstruction(currentInstruction)) {
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
