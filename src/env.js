var $ = require('jquery');
var addScope = require("./lang/scope");
var inputterSetup = require("./inputter");

function fillWindowWithScreen(screen) {
  var imageData = screen.getImageData(0, 0, screen.canvas.width, screen.canvas.height);
  screen.canvas.width = $(document).width();
  screen.canvas.height = $(document).height();
  screen.putImageData(imageData, 0, 0);
};

module.exports = {
  setupCanvasLib: function(screen) {
    fillWindowWithScreen(screen);
    $(window).resize(function() {
      window.scrollTo(0, 0); // maybe scrolled down if changing mobile to desktop view
      fillWindowWithScreen(screen);
    });

    return require("./canvas-library")(screen);
  },

  setupInputter: function(window, screen) {
    return inputterSetup(window, screen);
  }
};
