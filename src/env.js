var $ = require('jquery');

function fillWindowWithScreen(screen) {
  screen.canvas.width = $(document).width();
  screen.canvas.height = $(document).height();
};

function mergeLibrary(library, libraryToAdd) {
  for (var i in libraryToAdd) {
    if (i in library) {
      throw "Name clash in merged libraries. Aborting.";
    } else {
      library[i] = libraryToAdd[i];
    }
  }

  return library;
};

function createCanvasEnv(screen) {
  fillWindowWithScreen(screen);
  $(window).resize(function() { fillWindowWithScreen(screen); });
  return require("./lang/canvas-library")(screen);
};

module.exports = {
  createCanvasEnv: createCanvasEnv,
  mergeLibrary: mergeLibrary
};
