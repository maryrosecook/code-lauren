var React = require('react');
var $ = require("jquery");
var ProgramPlayer = require("./player-interface.jsx");
var Search = require("./search.jsx");
var env = require("./env");

var canvasLib = env.setupCanvasLib($("#screen")[0].getContext("2d"));

var Topbar = React.createClass({
  render: function() {
    return (
      <div className="topbar">
        <h1><a href="/#home">code lauren</a></h1>
        <ProgramPlayer editor={this.props.editor}
                       annotator={this.props.annotator}
                       canvasLib={canvasLib} />
        <Search />

        <div className="navigation">
          <a href="/#suggestions">Suggestions?</a>
        </div>
      </div>
    );
  }
});

module.exports = Topbar;
