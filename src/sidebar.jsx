var React = require('react');
var $ = require("jquery");

var url = require("./url");
var sourceSaver = require("./source-saver");

var pageContent = require("../pages/all-pages");

require("./lib/jquery.jscrollpane.min.js"); // for sidebar
require("./lib/jquery.mousewheel.js"); // enable sidebar mousewheel scrolling

var Sidebar = React.createClass({
  getInitialState: function() {
    var page = url.route(url.urlToPage(url.getUrl()));
    url.replaceUrl({ page: page },
                   url.setDatum(url.getUrl(), "page", page));
    return { page: page, wasBackOrForwards: false };
  },

  load: function(page) {
    // only update if page changed otherwise lose scroll pos on program change
    if (page === this.state.page) { return; }

    page = url.route(page);
    this.state.wasBackOrForwards = history.state !== null;
    if (!this.state.wasBackOrForwards) {
      url.replaceUrl({ page: page },
                     url.setDatum(url.getUrl(), "page", page));
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

  runDynamicPageContent: function() {
    if (this.state.page === "share-program") {
      sourceSaver.updateShareLink();
    }
  },

  componentDidUpdate: function() {
    this.runDynamicPageContent();
    var scrollY = this.state.wasBackOrForwards === true ? history.state.scroll : 0;
    this.scrollApi.reinitialise(); // calc scrollbars for height of new content
    this.scrollApi.scrollToY(scrollY);
  },

  componentDidMount: function() {
    this.runDynamicPageContent();

    this.scrollApi = $('#sidebar').jScrollPane().data('jsp');

    var self = this;
    $(window).on('hashchange', function(e) {
      self.load(url.urlToPage(e.originalEvent.newURL));
    });

    $("#sidebar").scroll(function() {
      if (history.state !== null) {
        var page = history.state.page;
        url.replaceUrl({ page: page, scroll: self.scrollApi.getContentPositionY() },
                       url.setDatum(url.getUrl(), "page", page));
      }
    });

    $(window).resize(() => self.scrollApi.reinitialise());
  }
});

module.exports = Sidebar;
