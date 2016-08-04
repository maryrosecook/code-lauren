var ProgressPlugin = require('webpack/lib/ProgressPlugin');

function lessVerboseWebpackProgressPlugin() {
  var previousProgress = 0;

  return new ProgressPlugin(function(latestProgress, message) {
    if (shouldShowProgress(previousProgress, latestProgress)) {
      previousProgress = latestProgress;
      printProgress(latestProgress, message);
    }
  })
};

function shouldShowProgress(previousProgress, latestProgress) {
  return enoughProgressMadeToShowProgress(previousProgress, latestProgress) ||
    latestProgress === 1;
};

function enoughProgressMadeToShowProgress(previousProgress, latestProgress) {
  return latestProgress - previousProgress >= 0.1;
};

function printProgress(latestProgress, message) {
  console.log((latestProgress * 100) + '%', message);
};

module.exports = lessVerboseWebpackProgressPlugin;
