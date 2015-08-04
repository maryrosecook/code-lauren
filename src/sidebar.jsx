var React = require('react');
var $ = require("jquery");

var pageContent = require("../pages/all-pages");

require("./lib/jquery.jscrollpane.min.js"); // for sidebar
require("./lib/jquery.mousewheel.js"); // enable sidebar mousewheel scrolling

var Sidebar = React.createClass({
  getInitialState: function() {
    var page = route(urlToPage(window.location.href));
    history.replaceState({ page: page, scroll: 0 },
                         page[0].toUpperCase() + page.slice(1),
                         "/#" + page);
    return {
      page: page,
      scrollPositions: {}, // records last scroll pos for each page
      pageJustClicked: undefined // records fact that page link
                                  // clicked. Used to decide whether to restore scroll position
    };
  },

  load: function(page) {
    page = route(page);
    if (page !== this.state.page) {
      this.state.scrollPositions[this.state.page] = this.scrollApi.getContentPositionY();

      this.state.page = page;
      this.setState(this.state);
    }

    localStorage["page"] = page;
  },

  linkClick: function(page) {
    this.state.pageJustClicked = page;
  },

  render: function() {
    return (
      <div className="sidebar"
           dangerouslySetInnerHTML={{ __html: pageContent[this.state.page] || pageContent["404"] }}>
      </div>
    );
  },

  componentDidUpdate: function() {
    this.scrollApi.reinitialise(); // calc scrollbars for height of new content

    if (this.state.pageJustClicked !== this.state.page) { // back/forw button press just happened
      this.scrollApi.scrollToY(this.state.scrollPositions[this.state.page]);
    } else {
      this.scrollApi.scrollToY(0);
    }
  },

  componentDidMount: function() {
    this.scrollApi = $('#sidebar').jScrollPane().data('jsp');

    var self = this;
    $(window).on('hashchange', function(e) {
      self.load(urlToPage(e.originalEvent.newURL));
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

function route(page) {
  if (page === undefined) {
    return localStorage["page"] || "home";
  } else {
    return page;
  }
};

module.exports = Sidebar;
