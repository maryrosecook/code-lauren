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
  = top

top
  = all:s_expression_list_item*
    { return node("top", all, line, column); }

s_expression
  = parenthetical
  / atom

parenthetical
  = invocation
  / lambda

invocation
  = '(' elements:s_expression_list_item* ')'
    { return node("invocation", elements, line, column); }

lambda
  = '{' _* parameters:parameter* _* body:s_expression_list_item* '}'
    { return node("lambda", { parameters: parameters, body: body }, line, column); }

parameter
  = '?' label:label _*
    { return node("parameter", label.c, line, column); }

s_expression_list_item
  = s_expression:s_expression _*
    { return s_expression; }

mapping
  = label ':'

atom
  = number
  / string
  / label

number
  = all: [0-9]+[.]*[0-9]*
    { return node("number", parseInt(all.join(""), 10), line, column); }

string
  = '"' all:[A-Za-z0-9., ]* '"'
    { return node('string', all.join(""), line, column); }

label
  = all: [a-zA-Z-_]+
    { return node("label", all.join(""), line, column); }

nl
  = all:[\n]+
    { return node('nl', all, line, column); }

_
  = [ \t\r\n]+
