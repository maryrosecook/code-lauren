var $ = require('jquery');
var addScope = require("./lang/scope");
var inputterSetup = require("./inputter");

var canvasHeight = 0; // init value stubbed for tests that use yInvert() during drawing

function fillWindowWithScreen(screen) {
  // DOM element is stretched to available width and height by CSS
  // Next two lines set canvas pixel width/height to same as DOM
  // element width and height
  screen.canvas.width = $("#screen").width();
  screen.canvas.height = $("#screen").height();

  // update canvasHeight when window changes size to update y
  // coordinate origin (bottom of screen)
  canvasHeight = $("#screen").height();
};

module.exports = {
  setupCanvasLib: function(screen) {
    var api = require("./canvas-library")(screen);

    fillWindowWithScreen(screen);

    $(window).resize(function() {
      window.scrollTo(0, 0); // maybe scrolled down if changing mobile to desktop view
      fillWindowWithScreen(screen);
      api.program.redraw();
    });

    return api;
  },

  setupInputter: function(window, screen) {
    return inputterSetup(window, screen);
  },

  yInvert: function(y) {
    return canvasHeight - y;
  }
};
