var React = require('react');

function annotateCurrentInstruction(p, annotator) {
  annotator.clear();
  annotator.codeHighlight(p.code,
                          p.currentInstruction.ast.s,
                          p.currentInstruction.ast.e,
                          "currently-executing");
};

var ProgramPlayer = React.createClass({
  getInitialState: function() {
    return { player: this.props.player };
  },

  onPlayPauseClick: function() {
    this.state.player.togglePause();
    this.setState(this.state);

    if (this.state.player.isPaused()) {
      annotateCurrentInstruction(this.state.player.getProgram(), this.props.annotator);
    } else {
      this.props.annotator.clear();
    }
  },

  onStepForwardsClick: function() {
    this.state.player.pause();
    this.state.player.stepForwards(1);
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
