var React = require('react');
var ProgramPlayer = require("./player-interface.jsx");
var Search = require("./search.jsx");

var Topbar = React.createClass({
  render: function() {
    return (
      <div className="topbar">
        <h1><a href="/#home">code lauren</a></h1>
        <ProgramPlayer editor={this.props.editor} annotator={this.props.annotator} />
        <Search />
      </div>
    );
  }
});

module.exports = Topbar;
