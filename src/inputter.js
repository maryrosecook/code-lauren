var im = require("immutable");

var setup = module.exports = function(window, screen) {
  var mousePosition = { x: 0, y: 0 };
  var mouseDown = false;

  window.addEventListener('mousemove', function(e) {
    mousePosition = userMousePosition(getAbsoluteMousePosition(e), screen.canvas);
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
      return im.Map({ mouse: createMouse(mousePosition, mouseDown) });
    }
  };
};

function createMouse(mousePosition, mouseDown) {
  return im.Map({
    x: mousePosition.x,
    y: mousePosition.y,
    "button-is-down": mouseDown,
    "button-is-up": !mouseDown
  });
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

function userMousePosition(absoluteMousePosition, canvas) {
  var env = require("./env");
  var elementPosition = getElementPosition(canvas);
  return {
    x: absoluteMousePosition.x - elementPosition.x,
    y: env.yInvert(absoluteMousePosition.y - elementPosition.y)
  };
};

function getAbsoluteMousePosition(e) {
	if (e.pageX !== undefined) 	{
    return { x: e.pageX, y: e.pageY };
	} else if (e.clientX !== undefined) {
    return { x: e.clientX, y: e.clientY };
  }
};
