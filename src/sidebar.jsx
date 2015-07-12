var React = require('react');
var pages = require("../pages/all-pages");

var Sidebar = React.createClass({
  getInitialState: function() {
    return { page: "home" };
  },

  render: function() {
    return (
      <div className="sidebar"
           dangerouslySetInnerHTML={{ __html: pages[this.state.page] }}>
      </div>
    );
  }
});

module.exports = Sidebar;
