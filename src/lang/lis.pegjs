{
  function node(tag, content, line, column, syntax, raw) {
    var node = { t: tag, c: content, l: line(), i: column() };
    if(syntax !== undefined) {
      node.syntax = syntax;
    }

    if (raw !== undefined) {
      node.raw = raw;
    }

    return node;
  };
}

start
  = exp

exp
  = assignment
  / atom

assignment
  = label:label ':' nl '  ' value:exp
    { return node("assignment", [label, value], line, column); }

atom
  = all: number
  / all: label

nl
  = all:[\n]+ { return node('nl', all, line, column); }

number
  = all: [0-9]+[.]*[0-9]* { return node("number", parseInt(all.join(""), 10), line, column); }

label
  = all: [a-zA-Z-_]+ { return node("label", all.join(""), line, column); }
