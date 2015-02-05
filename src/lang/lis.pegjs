{
  function par() {

  };

  function atom(tag, content, line, column, syntax, raw) {
    var node = { t: tag, c: content, l: line(), i: column() };
    if(syntax !== undefined) {
      node.syntax = syntax;
    }

    if (raw !== undefined) {
      node.raw = raw;
    }

    return node;
  };

  // WHAT IS THE "integer"?
}

start
  = s_expression

s_expression
  = all: atom

atom
  = all: num { return atom("num", all, line, column); }
  / all: var { return atom("var", all, line, column); }

num "num"
  = all: [0-9]+[.]*[0-9]* { return parseInt(all.join(""), 10); }

var
  = all: [a-zA-Z-]+ { return all.join(""); }
