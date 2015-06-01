var peg = require("pegjs");
var fs = require("fs");
var _ = require("underscore");

var examples = JSON.parse(fs.readFileSync(__dirname + "/examples.json", "utf8")).examples;

var pegParseTrace = peg.buildParser(fs.readFileSync(__dirname + "/grammar.pegjs", "utf8"),
                                    { cache: true, trace: true }).parse;

var pegParseNoTrace = peg.buildParser(fs.readFileSync(__dirname + "/grammar.pegjs", "utf8"),
                                      { cache: true }).parse;

function parserStateError(code) {
  for (var i = 0; i < examples.length; i++) {
    if (isMatchingExample(examples[i], code)) {
      return examples[i].message;
    }
  }
};

function isMatchingExample(example, code) {
  if (!isMatchingFailedToken(example, code)) {
    return false;
  } else {
    var codeStack = codeToFailedParseStack(code);
    if (example.stack.length > codeStack.length) {
      return false;
    } else {
      return _.isEqual(example.stack, _.last(codeStack, example.stack.length));
    }
  }
};

function isMatchingFailedToken(example, code) {
  return failedToken(code).match(example.failedToken) !== null;
};

function failedToken(code) {
  try {
    pegParseNoTrace(code);
  } catch (e) {
    return code.slice(e.offset).match(/^[\s]*([^\s]*)/)[1];
  }

  throw "Looking for failed token but code parsed";
};

function eventsToTree(evs, node) {
  function createNode(ev, parent) {
    return { rule: ev.rule, i: ev.offset, parent: parent, children: [] };
  };

  if (evs.length === 0) {
    return node;
  } else if (node === undefined) {
    node = createNode(evs[0]);
    eventsToTree(evs.slice(1), node);
    return node;
  } else if (evs[0].type === "rule.enter") {
    var child = createNode(evs[0], node);
    node.children.push(child);
    return eventsToTree(evs.slice(1), child);
  } else if (evs[0].type === "rule.fail" || evs[0].type === "rule.match") {
    return eventsToTree(evs.slice(1), node.parent);
  } else {
    throw "Unexpected rule type: " + evs[0].type;
  }
};

function codeToFailedParseStack(code) {
  var eventGatherer = createEventGathererTracer();
  try {
    pegParseTrace(code, { tracer: eventGatherer });
  } catch(e) {
    var tree = eventsToTree(eventGatherer.getEvents());
    var stack = deepestFailedStack(treeToStacks(tree));
    return _.pluck(stack, "rule");
  }
};

function deepestFailedStack(stacks) {
  var furthestI = stacks.reduce(function(a, s) { return Math.max(a, _.last(s).i); }, 0);
  var furthest = stacks.filter(function(s) { return _.last(s).i === furthestI; });
  var greatestDepth = furthest.reduce(function(a, s) { return Math.max(a, s.length); }, 0);
  return _.last(furthest.filter(function(s) { return s.length === greatestDepth; }));
};

function treeToStacks(node, stack, allStacks) {
  if (stack === undefined && allStacks === undefined) {
    allStacks = [];
    treeToStacks(node, [], allStacks);
    return allStacks;
  } else {
    stack = stack.concat(node);
    if (node.children.length > 0) {
      node.children.forEach(function(c) {
        treeToStacks(c, stack, allStacks);
      });
    } else {
      allStacks.push(stack);
    }
  }
};

function printTree(node, depth) {
  if (depth === undefined) {
    return printTree(node, 1);
  } else {
    console.log(Array(depth).join(" "), node.rule, node.i);
    for (var i = 0; i < node.children.length; i++) {
      printTree(node.children[i], depth + 1);
    }
  }
};

function createEventGathererTracer() {
  return {
    events: [],

    trace: function(ev) {
      this.events.push(ev);
    },

    getEvents: function() {
      return this.events;
    }
  };
};

parserStateError.codeToFailedParseStack = codeToFailedParseStack;
module.exports = parserStateError;
