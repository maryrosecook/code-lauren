var React = require('react');

var ProgramPlayer = React.createClass({
  getInitialState: function() {
    return { player: this.props.player };
  },

  onPlayPauseClick: function() {
    this.state.player.togglePause();
    this.setState(this.state);
  },

  onStepForwardsClick: function() {
    this.state.player.pause();
    this.state.player.stepForwards(10000);
    this.setState(this.state);
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
        <button onClick={this.onStepBackwardsClick} className="playerButton stepBackwardsButton" />
        <button onClick={this.onPlayPauseClick} className={playPauseClassName} />
        <button onClick={this.onStepForwardsClick} className="playerButton stepForwardsButton" />
      </div>
    );
  }
});

module.exports = ProgramPlayer;
