var parseUrl = require("url-parse");
var _ = require("underscore");

var KEY_VALUE_SEPARATOR = "_";
var ENTRY_SEPARATOR = ".";

// make loadHelpPage onclick responder publically available
pub.loadHelpPage = loadHelpPage;

function urlToPage(url) {
  return urlHashObj(url).page;
};

function hashObjToString(data) {
  return "#" + Object.keys(data)
    .map(k => [k, KEY_VALUE_SEPARATOR, data[k]].join(""))
    .join(ENTRY_SEPARATOR);
};

function urlHashObj(url) {
  var keyValuePairs = (url.split("#")[1] || "")
      .split(ENTRY_SEPARATOR)
      .filter(s => s.length > 0)
      .map(keyValuePair => keyValuePair.split(KEY_VALUE_SEPARATOR));
  return _.object(keyValuePairs);
};

function setDatum(url, k, v) {
  var urlObj = parseUrl(url, true);
  var hashObj = urlHashObj(urlObj.hash);
  hashObj[k] = v;
  urlObj.set("hash", hashObjToString(hashObj));
  return urlObj.toString();
};

function route(page) {
  if (page === undefined) {
    return localStorage["page"] || "home";
  } else {
    return page;
  }
};

function goToHelpPage(page) {
  window.location.href = setDatum(window.location.href, "page", page);
};

function loadHelpPage(event, page) {
  goToHelpPage(page);
  event.preventDefault();
};

module.exports = {
  urlToPage: urlToPage,
  setDatum: setDatum,
  goToHelpPage: goToHelpPage,
  route: route
}
