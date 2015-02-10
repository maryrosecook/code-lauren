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
  = ident:ident ':' nl '  ' value:exp
    { return node("assignment", [ident, value], line, column); }

atom
  = all: num
  / all: ident

nl
  = all:[\n]+ { return node('nl', all, line, column); }

num
  = all: [0-9]+[.]*[0-9]* { return node("num", parseInt(all.join(""), 10), line, column); }

ident
  = all: [a-zA-Z-_]+ { return node("ident", all.join(""), line, column); }
