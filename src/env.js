var createEnv = module.exports = function(screen) {
  function mergeLibrary(library, libraryToAdd) {
    for (var i in libraryToAdd) {
      if (i in library) {
        throw "Name clash in merged libraries. Aborting.";
      } else {
        library[i] = libraryToAdd[i];
      }
    }

    return library;
  };

  return mergeLibrary(mergeLibrary({ actions: {}},
                                   require("./lang/ben/standard-library")),
                      require("./lang/ben/canvas-library")(screen));
};
