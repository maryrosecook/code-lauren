var React = require('react');
var $ = require("jquery");
var ProgramPlayer = require("./player-interface.jsx");
var Search = require("./search.jsx");
var env = require("./env");

var canvasLib = env.setupCanvasLib($("#screen")[0].getContext("2d"));

var Topbar = React.createClass({
  render: function() {
    function load(page) {
      return function (event) { pub.loadHelpPage(event, page); };
    };

    return (
      <div className="topbar">
        <h1><a href="#" onClick={load("home")}>code lauren</a></h1>

        <ProgramPlayer editor={this.props.editor}
                       annotator={this.props.annotator}
                       canvasLib={canvasLib} />

        <Search />

        <div className="navigation">
          <a href="#" onClick={load("suggestions-for-improvement")}>Feedback</a>
        </div>
      </div>
    );
  }
});

module.exports = Topbar;
