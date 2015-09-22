var lz = require("lz-string");
var parseUrl = require("url-parse");
var $ = require("jquery");

var url = require("./url");

function save(code) {
  var compressedCode = lz.compressToBase64(code);
  url.setUrl(url.setDatum(url.getUrl(), "code", compressedCode));

  localStorage.code = code;

  updateShareLink();
};

function updateShareLink() {
  var sharePageProgramLink = $("#program-link");
  if (sharePageProgramLink) {
    sharePageProgramLink.text(url.getUrl());
  }
};

function get() {
  var urlCode = url.getDatum(url.getUrl(), "code");
  return urlCode !== undefined ? lz.decompressFromBase64(urlCode) : localStorage.code;
};

module.exports = {
  save: save,
  updateShareLink: updateShareLink,
  get: get
};
