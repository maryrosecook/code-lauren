var vm = require("../src/lang/vm");

var p;
var paused = false;
(function tick(lastEventLoopYield) {
  while(true) {
    if (p !== undefined && !paused && !vm.isComplete(p)) {
      player.stepForwards(1);
    }

    if (isTimeToYieldToEventLoop(lastEventLoopYield)) {
      requestAnimationFrame(() => tick(new Date().getTime()));
      break;
    }
  }
})(new Date().getTime());

var player = {
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

  stepForwards: function(stepCount) {
    stepCount = stepCount || 1;
    for (var i = 0; i < stepCount; i++) {
      p = stepForwards(p);
    }
  },

  stepBackwards: function() {
    console.log("nothing yet");
  },

  setProgram: function(newP) {
    p = newP;
  }
};

function getPlayer() {
  return player;
};

function isTimeToYieldToEventLoop(lastYield) {
  return new Date().getTime() - lastYield > 8;
};

function stepForwards(p) {
  try {
    return vm.step(p);
  } catch (e) {
    if (e instanceof vm.RuntimeError) {
      console.log(e.stack);
    } else {
      console.log(e.stack);
    }
  }
};

getPlayer.getPlayer = getPlayer;
module.exports = getPlayer;
