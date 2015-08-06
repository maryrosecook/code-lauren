var React = require('react');
var summarizeMarkdown = require("summarize-markdown");
var stripHtml = require("strip");
var pageContent = cleanData(require("../pages/all-pages"));

var DEFAULT_SEARCH_TEXT = "How do I...?";

var Search = React.createClass({
  getInitialState: function() {
    return { searchText: DEFAULT_SEARCH_TEXT, results: [] };
  },

  restoreDefaultTextIfEmpty: function() {
    if (this.state.searchText === "") {
      this.state.searchText = DEFAULT_SEARCH_TEXT;
      this.setState(this.state);
    }
  },

  clearDefaultSearchPrompt: function() {
    if (this.state.searchText === DEFAULT_SEARCH_TEXT) {
      this.state.searchText = "";
      this.setState(this.state);
    }
  },

  onChange: function(event) {
    this.state.searchText = event.target.value;
    if (this.state.searchText.length > 1) {
      this.state.results =
        find(this.state.searchText)
        .map(rawPageToResult.bind(this, this.state.searchText));
    } else {
      this.state.results = [];
    }

    this.setState(this.state);
  },

  blurOnEscape: function(e) {
    if (e.keyCode === 27) { // escape
      top.pub.editor.focus();
    }
  },

  resultPicked: function(slug) {
    this.state.results = [];
    this.setState(this.state);
    window.location.href = "/#" + slug;
  },

  resultSelected: function(slug, isSelected) {
    var selectedResult = this.state.results.filter(function(r) { return r.slug === slug; })[0];
    if (selectedResult !== undefined) {
      selectedResult.selected = isSelected;
    }

    this.setState(this.state);
  },

  buildResults: function() {
    var self = this;
    if (this.state.results.length > 0) {
      return <div className="resultsHolder">
        <div className="results">
          {
            this.state.results.map(function(data) {
              var className = "result " + (data.selected === true ? "selected" : "");
              var resultPicked = self.resultPicked.bind(self, data.slug);
              var resultSelected = self.resultSelected.bind(self, data.slug, true);
              var resultDeselected = self.resultSelected.bind(self, data.slug, false);

              return <li className={className} key={data.slug} onClick={resultPicked}
                         onMouseOver={resultSelected} onMouseOut={resultDeselected}>
                  <div className="title">{data.title}</div>
                  <div className="excerpt"
                       dangerouslySetInnerHTML={{ __html: data.excerpt }}></div>
                </li>
            })
          }
        </div>
      </div>
    }
  },

  render: function() {
    var textIsDefaultClass = this.state.searchText === DEFAULT_SEARCH_TEXT ?
        "default" : "not-default";

    return (
      <div className="search">
        <input id="searchbox" type="text" value={this.state.searchText}
               onFocus={this.clearDefaultSearchPrompt} onBlur={this.restoreDefaultTextIfEmpty}
               onChange={this.onChange}
               onKeyDown={this.blurOnEscape}
               className={textIsDefaultClass} />

        {this.buildResults()}
    </div>);
  }
});

function getSearchRegex(str) {
  return new RegExp(str.trim(), "i");
};

var EXCLUDED_PAGES = ["404", "home"];
function find(str) {
  var regex = getSearchRegex(str);
  return Object.keys(pageContent)
    .filter(function(slug) { return EXCLUDED_PAGES.indexOf(slug) === -1; })
    .map(function(slug) { return pageContent[slug]; })
    .filter(function(p) { return p.string.match(regex); })
    .slice(0, 5);
};

function stripNav(pageString) {
  return pageString.replace(/### (.*)/g, "");
};

function getPageTitleBody(pageString) {
  var pieces = pageString.match(/([^:]+): ((.|\n)+)/);

  return { title: pieces[1], body: pieces[2] };
};

function getWords(str, wordCount) {
  var words = str.split(" ");
  return words.slice(0, wordCount).join(" ") +
    (wordCount < words.length ? "..." : "");
};

var SENTENCE_TERMINALS = [".", "?", "!"];
function includeSentenceStart(string, i) {
  for (; i > 0; i--) {
    if (SENTENCE_TERMINALS.indexOf(string[i]) !== -1) {
      i++;
      break;
    }
  }

  return string.slice(i);
};

function getExcerpt(pageString, searchString) {
  var pageTitleBody = getPageTitleBody(pageString);

  if (pageTitleBody.title.length >
      pageString.match(getSearchRegex(searchString)).index) { // match in title
    return pageTitleBody.body; // return main content start
  } else {
    var matchStart = pageTitleBody.body.match(getSearchRegex(searchString)).index;
    return includeSentenceStart(pageTitleBody.body, matchStart);
  }
};

function rawPageToResult(str, rawPage) {

  return {
    slug: rawPage.slug,
    title: getPageTitleBody(rawPage.string).title,
    excerpt: getWords(getExcerpt(rawPage.string, str), 20)
  };
};

function cleanData(rawPages) {
  var pages = {};

  Object.keys(rawPages).forEach(function(k) {
    pages[k] = {
      slug: rawPages[k].slug,
      string: summarizeMarkdown(stripHtml(stripNav(rawPages[k].string)))
    };
  });

  return pages;
};

module.exports = Search;
