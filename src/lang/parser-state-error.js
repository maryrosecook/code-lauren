var peg = require("pegjs");
var fs = require("fs");
var _ = require("underscore");

var examples = require("./examples.json");
var matchers = examples.matchers;

var pegParseTrace = peg.buildParser(fs.readFileSync(__dirname + "/grammar.pegjs", "utf8"),
                                    { cache: true, trace: true }).parse;

var pegParseNoTrace = peg.buildParser(fs.readFileSync(__dirname + "/grammar.pegjs", "utf8"),
                                      { cache: true }).parse;

function parserStateError(code) {
  for (var i = 0; i < matchers.length; i++) {
    if (isMatchingExample(matchers[i], code)) {
      return lookupMessage(matchers[i].message);
    }
  }
};

function lookupMessage(message) {
  if (message[0] === "$") {
    return examples.strings[message.slice(1)];
  } else {
    return message;
  }
};

function isMatchingExample(example, code) {
  if (!isMatchingNextInput(example, code)) {
    return false;
  } else {
    var codeStack = codeToFailedParseStack(code);
    return _.find(example.stacks, function(stack) {
      if (stack.length > codeStack.length) {
        return false;
      } else {
        return _.isEqual(stack, _.last(codeStack, stack.length));
      }
    }) !== undefined;
  }
};

function isMatchingNextInput(example, code) {
  return nextInput(code).match(example.nextInput) !== null;
};

function nextInput(code) {
  try {
    pegParseNoTrace(code);
  } catch (e) {
    return code.slice(e.offset);
  }

  throw "Looking for failed token but code parsed";
};

function createNode(rule, offset, type, parent) {
  return { rule: rule, i: offset, type: type, parent: parent, children: [] };
};

function eventsToTree(evs, node) {
  if (node === undefined) {
    node = createNode("HOLDER", "-", "-");
  }

  for (var i = 0; i < evs.length; i++) {
    var ev = evs[i];
    if (ev.type === "rule.enter") {
      var child = createNode(ev.rule, ev.offset, ev.type, node);
      node.children.push(child);
      node = child;
    } else if (ev.type === "rule.fail" || ev.type === "rule.match") {
      node.parent.children.push(createNode(ev.rule, ev.offset, ev.type, node));
      node = node.parent;
    }
  }

  return node;
};

function codeToFailedParseStack(code) {
  var eventGatherer = createEventGathererTracer();
  try {
    pegParseTrace(code, { tracer: eventGatherer });
  } catch(e) {
    var tree = eventsToTree(eventGatherer.getEvents());
    var match = deepestMatch(tree);

    // start from parent cause match is a rule.match with rule.enter as its parent
    return _.pluck(parentChain(match.parent), "rule");
  }
};

function parentChain(node) {
  if (node === undefined) {
    return [];
  } else {
    return parentChain(node.parent).concat(node);
  }
};

function deepestMatch(node, deepest) {
  for (var i = 0; i < node.children.length; i++) {
    if (node.type === "rule.enter" &&
        (deepest === undefined || node.children[i].i > deepest.i)) {
      deepest = node.children[i];
    }

    deepest = deepestMatch(node.children[i], deepest);
  }

  return deepest;
};

function eventTypeSymbol(ev) {
  if (ev.type === "rule.enter") {
    return ">";
  } else if (ev.type === "rule.fail") {
    return "x";
  } else if (ev.type === "rule.match") {
    return "<";
  } else {
    return "-";
  }
};

function printTree(node, depth) {
  if (depth === undefined) {
    return printTree(node, 1);
  } else {
    console.log(Array(depth).join(" "), eventTypeSymbol(node), node.rule, node.i);
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
