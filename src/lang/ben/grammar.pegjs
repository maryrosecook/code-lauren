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
  = invocation

s_expression
  = parenthetical
  / atom

parenthetical
  = let
  / if
  / invocation
  / lambda

let
  = '(' _* 'let' _* binding_list:binding_list _* body:do ')'
    { return node("let", [binding_list, body], line, column); }

if
  = '(' _* 'if' _+ test:s_expression _+ then_branch:s_expression _+ else_branch:s_expression ')'
    { return node("if", [test, then_branch, else_branch], line, column); }

binding_list
  = '[' bindings:binding* ']'
    { return node("bindings", bindings, line, column); }

binding
  = _* label:label _+ s_expression:s_expression _*
    { return node("binding", [label, s_expression], line, column); }

invocation
  = '(' elements:do_item* ')'
    { return node("invocation", elements, line, column); }

lambda
  = '{' _* parameters:parameter* _* body:do '}'
    { return node("lambda", [parameters, body], line, column); }

do
  = all: do_item*
    { return node("do", all, line, column); }

do_item
  = s_expression:s_expression _*
    { return s_expression; }

parameter
  = '?' label:label _*
    { return node("parameter", label.c, line, column); }

mapping
  = label ':'

atom
  = number
  / string
  / boolean
  / label

number
  = all: [0-9]+[.]*[0-9]*
    { return node("number", parseInt(all.join(""), 10), line, column); }

string
  = '"' all:[A-Za-z0-9., ]* '"'
    { return node('string', all.join(""), line, column); }

boolean
  = 'true'  { return node("boolean", true, line, column); }
  / 'false' { return node("boolean", false, line, column); }

label
  = all: [a-zA-Z-_]+
    { return node("label", all.join(""), line, column); }

nl
  = all:[\n]+
    { return node('nl', all, line, column); }

_
  = [ \t\r\n]+
