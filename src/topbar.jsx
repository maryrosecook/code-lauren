var React = require('react');
var ProgramPlayer = require("./player-interface.jsx");

var Topbar = React.createClass({
  render: function() {
    return (
      <div className="topbar">
        <h1>code lauren</h1>
        <ProgramPlayer editor={this.props.editor} annotator={this.props.annotator} />
      </div>
    );
  }
});

module.exports = Topbar;
