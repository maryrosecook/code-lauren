var React = require('react');
var $ = require("jquery");

var pageContent = require("../pages/all-pages");

var Sidebar = React.createClass({
  getInitialState: function() {
    return { page: "home" };
  },

  load: function(page) {
    this.state.page = page;
    this.setState(this.state);
    return false;
  },

  render: function() {
    return (
      <div className="sidebar"
           dangerouslySetInnerHTML={{ __html: pageContent[this.state.page] }}>
      </div>
    );
  }
});

// massive hack to make sidebar instance exportable as global
// so its methods can be called from the JS bound to sidebar page content link onClicks (!)
module.exports = React.render(React.createElement(Sidebar),
                              $("#sidebar")[0]);
