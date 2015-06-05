function Stack() {
  this.frames = [];
};

Stack.prototype = {
  pushFrame: function(args) {
    this.frames.push({
      args: args
    });
  },

  popFrame: function() {
    return this.frames.pop();
  }
}

function interpret() {

};
