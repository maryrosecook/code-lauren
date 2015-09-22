var lz = require("lz-string");
var parseUrl = require("url-parse");
var url = require("./url");

module.exports = {
  save: function(code) {
    var compressedCode = lz.compressToBase64(code);
    url.setUrl(url.setDatum(url.getUrl(), "code", compressedCode));

    localStorage.code = code;
  },

  get: function() {
    var urlCode = url.getDatum(url.getUrl(), "code");
    return urlCode !== undefined ? lz.decompressFromBase64(urlCode) : localStorage.code;
  }
};
