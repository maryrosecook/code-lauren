var $ = require('jquery');
var createScope = require("./lang/scope");

function fillWindowWithScreen(screen) {
  screen.canvas.width = $(document).width();
  screen.canvas.height = $(document).height();
};

function mergeLibraries(library, libraryToAdd) {
  for (var i in libraryToAdd) {
    if (i in library) {
      throw "Name clash in merged libraries. Aborting.";
    } else {
      library[i] = libraryToAdd[i];
    }
  }

  return library;
};

function setupCanvasLib(screen) {
  fillWindowWithScreen(screen);
  $(window).resize(function() { fillWindowWithScreen(screen); });
  return require("./lang/canvas-library")(screen);
};

function createEnv(builtinBindings) {
  return createScope({}, createScope(builtinBindings)); // firewall builtins
};

module.exports = {
  setupCanvasLib: setupCanvasLib,
  mergeLibraries: mergeLibraries,
  createEnv: createEnv
};
