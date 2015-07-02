var editor = CodeMirror(document.body, {
  value: 'draw: { ?x ?y\n  circle-radius: 20\n\n  clear-screen()\n  draw-filled-circle(add(220 x)\n                     add(200 y)\n                     circle-radius\n                     "blue")\n}\n\nangle: 0\n\nforever {\n  radius-of-circle-orbit: 100\n  circle-angle-change: 0.01\n\n  angle: add(angle circle-angle-change)\n\n  draw(multiply(radius-of-circle-orbit cosine(angle))\n       multiply(radius-of-circle-orbit sine(angle)))\n}',
  mode:  "lauren",
  tabSize: 2,
  indentWithTabs: false,
  undoDepth: 9999999999,
  autofocus: true,
  extraKeys: {
    Tab: function(cm) { cm.execCommand("insertSoftTab"); }
  }
});

var zeroWidthMark = document.createElement("span");
zeroWidthMark.className = "currently-executing zero-width-mark";

editor.setBookmark({ line: 0, ch: 3 }, { widget: zeroWidthMark });

editor.markText({ line: 0, ch: 3 }, { line: 0, ch: 3 }, { className: "currently-executing" });
