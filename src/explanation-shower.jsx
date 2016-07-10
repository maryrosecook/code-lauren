var React = require('react');
var $ = require("jquery");

var annotations = {
  a: "hello",
};

var code = "ball[a]: circle(350 350 20)\n\
\n\
set(ball \"x-speed\" 0)\n\
set(ball \"y-speed\" 0)\n\
\n\
gravity: -0.5\n\
\n\
forever {\n\
  bat: rectangle(mouse-x mouse-y 100 10)\n\
\n\
  if are-overlapping(bat ball) {\n\
    bat-ball-difference: subtract(get(ball \"x\") get(bat \"x\"))\n\
    set(ball \"x-speed\" divide(bat-ball-difference 10))\n\
    set(ball \"y-speed\" opposite(get(ball \"y-speed\")))\n\
  } else {\n\
    set(ball \"y-speed\" add(gravity get(ball \"y-speed\")))\n\
  }\n\
\n\
  set(ball \"x\" add(get(ball \"x\") get(ball \"x-speed\")))\n\
  set(ball \"y\" add(get(ball \"y\") get(ball \"y-speed\")))\n\
\n\
  clear-screen()\n\
  draw(ball)\n\
  draw(bat)\n\
}";

var ExplanationShower = React.createClass({
  getInitialState: function (props, state) {
    window.addEventListener('mousemove', this.onMouseMove);
    return null;
  },

  onMouseMove: function(e) {
    var cm = this.props.editor;
    var mousePosition = getAbsoluteMousePosition(e);
    var codeLocation = cm.coordsChar({ left: mousePosition.x, top: mousePosition.y });
    var index = cm.indexFromPos(codeLocation);
  },

  render: function() {
    return (
      <div className="explanation-shower">
        Hello Hello Hello Hello Hello Hello Hello Hello Hello Hello
      Hello Hello Hello Hello Hello Hello Hello Hello Hello Hello Hello Hello Hello
      Hello Hello Hello Hello Hello Hello Hello Hello Hello
      </div>
    );
  }
});

function rmMarkupFromCode(code) {
  return code.replace(/\[[^\]]+\]/, "");
};

function findAnnotation(code, index) {
  for (var i = index; i < code.length; i++) {

  }
};

function getAbsoluteMousePosition(e) {
	if (e.pageX !== undefined) 	{
    return { x: e.pageX, y: e.pageY };
	} else if (e.clientX !== undefined) {
    return { x: e.clientX, y: e.clientY };
  }
};

module.exports = ExplanationShower;
