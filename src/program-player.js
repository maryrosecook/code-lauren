var _ = require("underscore");
var vm = require("../src/lang/vm");
var copyProgramState = require("../src/copy-program-state");
var compiler = require("./lang/compiler");

var player;
var pses;
var ps;
var paused;

var STEP_TO_SAVE = 5000;

function setupPlayer(annotator) {
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
      if (paused === true) {
        player.unpause();
      } else if (paused === false) {
        player.pause();
      } else {
        throw new Error("Tried to toggle player pause but it's neither paused nor unpaused");
      }
    },

    pause: function() {
      paused = true;
      ps.canvasLib.pause();
    },

    unpause: function() {
      paused = false;
    },

    getProgramState: function() {
      return ps;
    },

    stepForwards: function() {
      if (vm.isCrashed(ps) || vm.isComplete(ps)) { return; }

      var originalPs = ps;
      var newPses = [];
      while (true) {
        try {
          newPses.push(copyProgramState(ps));
          vm.step(ps);
        } catch (e) {
          if (e instanceof vm.RuntimeError) {
            annotator.codeHighlight(ps.code, e.s, e.e, "error");
            annotator.lineMessage(ps.code, e.s, "error", e.message);
          }
        }

        if (vm.isComplete(ps)) {
          newPses = [];
          ps = originalPs;
          break;
        } else if (vm.isCrashed(ps) ||
                   (ps.currentInstruction !== undefined &&
                    ps.currentInstruction.annotate === compiler.ANNOTATE)) {
          break;
        }
      }

      for (var i = 0; i < newPses.length; i++) {
        if (pses.length > STEP_TO_SAVE) {
          pses.shift();
          ps.canvasLib.deleteOld(STEP_TO_SAVE);
        }

        newPses[i].canvasLib.stepForwards();
        pses.push(newPses[i]);
      }
    },

    stepBackwards: function() {
      var originalPs = ps;
      var i = pses.length - 1;
      while (true) {
        if (i === -1) { // couldn't find annotatable previous ps - don't step back
          ps = originalPs;
          break;
        } else if (pses[i].currentInstruction !== undefined &&
                   pses[i].currentInstruction.annotate === compiler.ANNOTATE) {
          for (var j = i; j < pses.length; j++) {
            ps = pses.pop();
            ps.canvasLib.stepBackwards();
          }

          break;
        }

        i--;
      }
    },

    setProgramState: function(newPs) {
      ps = newPs;
      paused = false;
      pses = [];
    }
  };

  return player;
};

function isTimeToYieldToEventLoop(lastYield) {
  return new Date().getTime() - lastYield > 8;
};

setupPlayer.setupPlayer = setupPlayer;
module.exports = setupPlayer;
