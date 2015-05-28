var peg = require("pegjs");
var fs = require("fs");
var _ = require("underscore");

var examples = JSON.parse(fs.readFileSync(__dirname + "/examples.json", "utf8")).examples;

var pegParse = peg.buildParser(fs.readFileSync(__dirname + "/grammar.pegjs", "utf8"),
                               { cache: true, trace: true }).parse

function parserStateError(code) {
  var realCodeStack = codeToFailedParseStack(code);
  for (var i = 0; i < examples.length; i++) {
    if (isParseStacksEqual(examples[i].stack, realCodeStack)) {
      return examples[i].message;
    }
  }
};

// function recordParseFail(code) {
// };

function isParseStacksEqual(exampleStack, codeStack) {
  if (exampleStack.length > codeStack.length) {
    return false;
  } else {
    return _.isEqual(exampleStack, _.last(codeStack, exampleStack.length));
  }
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
    pegParse(code, { tracer: eventGatherer });
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

module.exports = parserStateError;
