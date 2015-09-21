var React = require('react');
var summarizeMarkdown = require("summarize-markdown");
var stripHtml = require("strip");
var util = require("./util");
var url = require("./url");
var pageContent = cleanData(require("../pages/all-pages"));

var DEFAULT_SEARCH_TEXT = "How do I...?";

var Search = React.createClass({
  getInitialState: function() {
    return { searchText: DEFAULT_SEARCH_TEXT, results: [], showResults: false };
  },

  onInputFocus: function() {
    this.state.showResults = true;
    this.setState(this.state);
  },

  onInputBlur: function() {
    this.state.showResults = false;
    this.setState(this.state);
  },

  onChange: function(event) {
    this.state.searchText = event.target.value;
    this.setResults();
  },

  setResults: function() {
    if (this.state.searchText.length > 1) {
      this.state.results =
        find(this.state.searchText)
        .map(rawPageToResult.bind(this, this.state.searchText));

      if (this.state.results.length > 0) {
        this.state.results[0].selected = true;
      }
    } else {
      this.state.results = [];
    }

    this.setState(this.state);
  },

  onKeyDown: function(e) {
    if (e.keyCode === 27) { // escape
      top.pub.editor.focus();
      this.state.showResults = false;
      this.setState(this.state);
    } else if (e.keyCode === 13) { // return
      var selectedResult = this.state.results.filter(r => r.selected === true)[0];
      if (selectedResult !== undefined) {
        this.resultPicked(selectedResult.slug);
      }
    } else if (e.keyCode === 38) { // up arrow
      var index = util.findIndex(this.state.results, r => r.selected === true);
      if (index !== undefined && index > 0) {
        this.resultSelected(this.state.results[index - 1].slug, true);
      }
    } else if (e.keyCode === 40) { // down arrow
      var index = util.findIndex(this.state.results, r => r.selected === true);
      if (index !== undefined && index < this.state.results.length - 1) {
        this.resultSelected(this.state.results[index + 1].slug, true);
      }
    }
  },

  resultPicked: function(slug) {
    this.state.showResults = false;
    this.setState(this.state);
    url.goToHelpPage(slug);
  },

  resultSelected: function(slug, isSelected) {
    this.state.results.filter(r => r.selected === true).forEach(r => r.selected = false);

    var selectedResult = this.state.results.filter(function(r) { return r.slug === slug; })[0];
    if (selectedResult !== undefined) {
      selectedResult.selected = isSelected;
    }

    this.setState(this.state);
  },

  buildResults: function() {
    var self = this;
    if (this.state.results.length > 0 && this.state.showResults) {
      return <div className="resultsHolder">
        <div className="results">
          {
            this.state.results.map(function(data) {
              var className = "result " + (data.selected === true ? "selected" : "");
              var resultPicked = self.resultPicked.bind(self, data.slug);
              var resultSelected = self.resultSelected.bind(self, data.slug, true);

              return <li className={className} key={data.slug} onMouseDown={resultPicked}
                         onMouseOver={resultSelected}>
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

  getQuery: function() {
    if (!this.state.showResults && this.state.searchText === "") {
      return DEFAULT_SEARCH_TEXT;
    } else if (this.state.showResults && this.state.searchText === DEFAULT_SEARCH_TEXT) {
      return "";
    } else {
      return this.state.searchText;
    }
  },

  render: function() {
    var textIsDefaultClass = this.state.searchText === DEFAULT_SEARCH_TEXT ?
        "default" : "not-default";

    return (
      <div className="search">
        <input id="searchbox" type="text" value={this.getQuery()}
               onFocus={this.onInputFocus} onBlur={this.onInputBlur}
               onChange={this.onChange}
               onKeyDown={this.onKeyDown}
               className={textIsDefaultClass} />

        {this.buildResults()}
    </div>);
  }
});

function getSearchRegex(str) {
  return new RegExp(str.trim(), "gi");
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
  var pieces = pageString.match(/([^:]+):((.|\n)*)/);

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
  var matches = gatherAllMatches(pageString, getSearchRegex(searchString));

  if (pageTitleBody.title.length > matches[0].index) { // match in title
    return pageTitleBody.body; // return main content start
  } else {
    var matches = gatherAllMatches(pageTitleBody.body, getSearchRegex(searchString));
    return includeSentenceStart(pageTitleBody.body, matches[0].index);
  }
};

function gatherAllMatches(str, regex) {
  var match;
  var matches = [];
  while ((match = regex.exec(str)) !== null) {
    matches.push(match);
  }

  return matches;
};

function chunk(str, indices, searchString) {
  if (indices.length === 0) {
    return [str];
  } else {
    var chunks = [];
    var start = 0;
    indices.forEach(function(index) {
      chunks.push(str.slice(start, index));
      chunks.push(str.slice(index, index + searchString.length));
      start = index + searchString.length;
    })

    chunks.push(str.slice(start));
    return chunks;
  }
};

function highlightSearch(str, searchString) {
  var matches = gatherAllMatches(str, getSearchRegex(searchString));
  var chunks = chunk(str, matches.map(m => m.index), searchString);
  return chunks.map(function(chunk, i) {
    return i % 2 === 1 ? '<span class="match">' + chunk + "</span>" : chunk;
  }).join("");
};

function rawPageToResult(searchString, rawPage) {
  return {
    slug: rawPage.slug,
    title: getPageTitleBody(rawPage.string).title,
    excerpt: highlightSearch(getWords(getExcerpt(rawPage.string, searchString), 20), searchString),
    selected: false
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
