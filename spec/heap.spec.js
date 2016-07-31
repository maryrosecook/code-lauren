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
});
