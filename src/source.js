var editor;

function setupSource(inEditor) {
  editor = inEditor;
  return fns;
};

var fns = {
  clear: function() {
    editor.setValue("");
  },

  save: function() {
    localStorage["source"] = editor.getValue();
  },

  get: function() {
    return localStorage["source"];
  }
};

module.exports = setupSource;
