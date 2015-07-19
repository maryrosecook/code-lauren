var React = require('react');
var $ = require("jquery");

var pageContent = require("../pages/all-pages");

require("./lib/jquery.jscrollpane.min.js"); // for sidebar
require("./lib/jquery.mousewheel.js"); // enable sidebar mousewheel scrolling

var Sidebar = React.createClass({
  getInitialState: function() {
    var self = this;
    $(window).on('hashchange', function(e) {
      self.load(urlToPage(e.originalEvent.newURL));
    });

    var self = this;
    $(window).resize(function() { self.scrollApi.reinitialise(); });

    var page = route(urlToPage(window.location.href));
    history.replaceState({ page: page }, page[0].toUpperCase() + page.slice(1), "/#" + page);
    return { page: page };
  },

  load: function(page) {
    page = route(page);
    if (page !== this.state.page) {
      this.state.page = page;
      this.setState(this.state);
    }
  },

  render: function() {
    return (
      <div className="sidebar"
           dangerouslySetInnerHTML={{ __html: pageContent[this.state.page] || pageContent["404"] }}>
      </div>
    );
  },

  componentDidMount: function() {
    this.scrollApi = $('#sidebar').jScrollPane().data('jsp');
  }
});

function urlToPage(url) {
  var urlPageMatch = url.match(/#(.+)/);
  if (urlPageMatch) {
    return urlPageMatch[1];
  }
};

function route(page) {
  if (page === undefined) {
    return "home";
  } else {
    return page;
  }
};

module.exports = Sidebar;
