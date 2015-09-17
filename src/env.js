var $ = require('jquery');
var addScope = require("./lang/scope");

function fillWindowWithScreen(screen) {
  var imageData = screen.getImageData(0, 0, screen.canvas.width, screen.canvas.height);
  screen.canvas.width = $(document).width();
  screen.canvas.height = $(document).height();
  screen.putImageData(imageData, 0, 0);
};

function setupCanvasLib(screen) {
  fillWindowWithScreen(screen);
  $(window).resize(function() {
    window.scrollTo(0, 0); // might have been scrolled down if changing from mobile to desktop view
    fillWindowWithScreen(screen);
  });

  return require("./lang/canvas-library")(screen);
};

module.exports = {
  setupCanvasLib: setupCanvasLib
};
