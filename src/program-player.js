var _ = require("underscore");
var vm = require("../src/lang/vm");
var copyProgramState = require("../src/copy-program-state");
var compiler = require("./lang/compiler");

var player;
var pses = [];
var ps;
var paused = false;

var STEP_TO_SAVE = 5000;

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

    stepForwardsUntilReachAnnotableInstruction: function() {
      var currentInstruction = ps.currentInstruction;
      while (currentInstruction.annotate === compiler.DO_NOT_ANNOTATE) {
        this.stepForwards();
        currentInstruction = ps.currentInstruction;
      }
    },

    stepBackwardsUntilReachAnnotableInstruction: function() {
      var currentInstruction = ps.currentInstruction;
      while (currentInstruction.annotate === compiler.DO_NOT_ANNOTATE) {
        this.stepBackwards();
        currentInstruction = ps.currentInstruction;
      }
    },

    stepForwards: function() {
      try {
        if (!vm.isComplete(ps)) {
          pses.push(copyProgramState(ps));
          if (pses.length > STEP_TO_SAVE) {
            pses.shift();
            ps.canvasLib.deleteOld(STEP_TO_SAVE);
          }

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
      if (searchBackwardsForAnnotatableProgramState(pses.slice(0, -1)) !== undefined) {
        ps = pses.pop();
        ps.canvasLib.stepBackwards();
      }
    },

    setProgramState: function(newPs) {
      ps = newPs;
    }
  };

  return player;
};

function searchBackwardsForAnnotatableProgramState(pses) {
  for (var i = pses.length - 1; i >= 0; i--) {
    if (pses[i].currentInstruction.annotate === compiler.ANNOTATE) {
      return pses[i];
    }
  }
};

function isTimeToYieldToEventLoop(lastYield) {
  return new Date().getTime() - lastYield > 8;
};

setupPlayer.setupPlayer = setupPlayer;
module.exports = setupPlayer;
