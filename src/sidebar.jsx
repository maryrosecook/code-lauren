var React = require('react');
var $ = require("jquery");

var pageContent = require("../pages/all-pages");

require("./lib/jquery.jscrollpane.min.js"); // for sidebar
require("./lib/jquery.mousewheel.js"); // enable sidebar mousewheel scrolling

var Sidebar = React.createClass({
  getInitialState: function() {
    var page = route(urlToPage(window.location.href));
    history.replaceState({ page: page }, page[0].toUpperCase() + page.slice(1), pageToUrl(page));
    return { page: page, wasBackOrForwards: false };
  },

  load: function(page) {
    page = route(page);
    this.state.wasBackOrForwards = history.state !== null;
    if (!this.state.wasBackOrForwards) {
      history.replaceState({ page: page }, page[0].toUpperCase() + page.slice(1), pageToUrl(page));
    }

    this.state.page = page;
    this.setState(this.state);

    localStorage["page"] = page;
  },

  render: function() {
    var html = pageContent[this.state.page] !== undefined ?
        pageContent[this.state.page].html :
        pageContent["404"].html;

    return (
      <div className="sidebar"
        dangerouslySetInnerHTML={{ __html: html }}>
      </div>
    );
  },

  componentDidUpdate: function() {
    var scrollY = this.state.wasBackOrForwards === true ? history.state.scroll : 0;
    this.scrollApi.reinitialise(); // calc scrollbars for height of new content
    this.scrollApi.scrollToY(scrollY);
  },

  componentDidMount: function() {
    this.scrollApi = $('#sidebar').jScrollPane().data('jsp');

    var self = this;
    $(window).on('hashchange', function(e) {
      self.load(urlToPage(e.originalEvent.newURL));
    });

    $("#sidebar").scroll(function() {
      if (history.state !== null) {
        var page = history.state.page;
        history.replaceState({ page: page, scroll: self.scrollApi.getContentPositionY() },
                             page[0].toUpperCase() + page.slice(1),
                             pageToUrl(page));
      }
    });

    $(window).resize(() => self.scrollApi.reinitialise());
  }
});

function urlToPage(url) {
  var urlPageMatch = url.match(/#(.+)/);
  if (urlPageMatch) {
    return urlPageMatch[1];
  }
};

function pageToUrl(page) {
  if (page === "home") {
    return "/";
  } else {
    return "/#" + page;
  }
};

function route(page) {
  if (page === undefined) {
    return localStorage["page"] || "home";
  } else {
    return page;
  }
};

module.exports = Sidebar;
