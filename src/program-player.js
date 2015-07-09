var _ = require("underscore");
var vm = require("../src/lang/vm");
var copyProgramState = require("../src/copy-program-state");

var player;
var pses = [];
var ps;
var paused = false;

function setupPlayer() {
  if (player !== undefined) { return; }

  (function tick(lastEventLoopYield) {
    while(true) {
      if (ps !== undefined && !paused) {
        if (vm.isComplete(ps)) {
          ps.canvasLib.flush();
        } else {
          player.stepForwards();
        }
      }

      if (isTimeToYieldToEventLoop(lastEventLoopYield)) {
        requestAnimationFrame(() => tick(new Date().getTime()));
        break;
      }
    }
  })(new Date().getTime());

  player = {
    isPaused: function() {
      return paused;
    },

    togglePause: function() {
      paused = !paused;
    },

    pause: function() {
      paused = true;
    },

    unpause: function() {
      paused = false;
    },

    getProgramState: function() {
      return ps;
    },

    stepForwards: function() {
      try {
        if (!vm.isComplete(ps)) {
          pses.push(copyProgramState(ps));
          ps = vm.step(ps);
          ps.canvasLib.stepForwards();
        }
      } catch (e) {
        if (e instanceof vm.RuntimeError) {
          console.log(e.message, e.stack);
        } else {
          console.log(e.stack);
        }
      }
    },

    stepBackwards: function() {
      ps = pses.pop();
      ps.canvasLib.stepBackwards();
    },

    setProgramState: function(newPs) {
      ps = newPs;
    }
  };

  return player;
};

function isTimeToYieldToEventLoop(lastYield) {
  return new Date().getTime() - lastYield > 8;
};

setupPlayer.setupPlayer = setupPlayer;
module.exports = setupPlayer;
