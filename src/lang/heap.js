var im = require("immutable");

function create() {
  return im.List();
};

function add(heap, value) {
  var newHeap = heap.push(value);
  return { heap: newHeap, pointer: new Pointer(newHeap.size - 1) };
};

function get(heap, pointer) {
  return heap.get(pointer.id);
};

function Pointer(id) {
  this.id = id;
};

module.exports = {
  create: create,
  add: add,
  get: get
};
