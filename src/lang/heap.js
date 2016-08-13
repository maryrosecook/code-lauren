var im = require("immutable");

function create() {
  return im.List();
};

function add(heap, value) {
  if (!isImmutable(value)) {
    throw new Error("Cannot add immutable value to heap");
  }

  var newHeap = heap.push(value);
  return { heap: newHeap, pointer: new Pointer(newHeap.size - 1) };
};

function get(heap, pointer) {
  return heap.get(pointer.id);
};

function update(heap, pointer, value) {
  return heap.set(pointer.id, value);
};

function Pointer(id) {
  this.id = id;
};

function isImmutable(possiblyImmutableObject) {
  return possiblyImmutableObject instanceof im.Map;
};

module.exports = {
  create: create,
  add: add,
  get: get,
  update: update
};
