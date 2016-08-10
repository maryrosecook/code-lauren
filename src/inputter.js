var im = require("immutable");

var setup = module.exports = function(window, screen) {
  var mousePosition = { x: 0, y: 0 };
  var mouseDown = false;
  var screen;

  var env = require("./env");

  window.addEventListener('mousemove', function(e) {
    var absoluteMousePosition = getAbsoluteMousePosition(e);
    var elementPosition = getElementPosition(screen.canvas);
    mousePosition = {
      x: absoluteMousePosition.x - elementPosition.x,
      y: env.yInvert(absoluteMousePosition.y - elementPosition.y)
    };
  }, false);

  window.addEventListener('mousedown', function(e) {
    if (mousePosition.y > 0) { // only set if mouse not over title bar
      mouseDown = true;
    }
  }, false);

  window.addEventListener('mouseup', function(e) {
    mouseDown = false;
  }, false);

  return {
    getMouseBindings: function() {
      return im.Map({
        mouse: im.Map({
          "x": mousePosition.x,
          "y": mousePosition.y,
          "button-is-down": mouseDown,
          "button-is-up": !mouseDown
        })
      });
    }
  };
};

function getElementPosition(element) {
  var rect = element.getBoundingClientRect();
  var document = element.ownerDocument;
  var body = document.body;
  return {
    x: rect.left + (window.pageXOffset || body.scrollLeft) - (body.clientLeft || 0),
    y: rect.top + (window.pageYOffset || body.scrollTop) - (body.clientTop || 0)
  };
};

function getAbsoluteMousePosition(e) {
	if (e.pageX !== undefined) 	{
    return { x: e.pageX, y: e.pageY };
	} else if (e.clientX !== undefined) {
    return { x: e.clientX, y: e.clientY };
  }
};
