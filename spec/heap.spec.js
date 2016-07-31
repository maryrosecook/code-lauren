var im = require("immutable");
var heapLib = require("../src/lang/heap");

describe("heap", function() {
  it("should be able to create a heap", function() {
    expect(heapLib.create()).toBeDefined();
  });

  it("should be able to add and retrieve value", function() {
    var objToStore = im.Map();
    var heapAndPointer = heapLib.add(heapLib.create(), objToStore);

    expect(heapLib.get(heapAndPointer.heap,
                       heapAndPointer.pointer))
      .toBe(objToStore)
  });

  it("should be able to add value and then swap in new value", function() {
    var objToStore = im.Map();
    var heapAndPointer = heapLib.add(heapLib.create(), objToStore);
    var immutableStoredObj = heapLib
        .get(heapAndPointer.heap, heapAndPointer.pointer)
        .set("key", "value");

    var heap = heapLib.update(heapAndPointer.heap,
                              heapAndPointer.pointer,
                              immutableStoredObj);

    expect(heapLib.get(heap, heapAndPointer.pointer).toObject())
      .toEqual({ key: "value" })
  });
});
