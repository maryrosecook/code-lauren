{
  function node(tag, content, line, column, syntax, raw) {
    var node = addLineColumn({ t: tag, c: content}, line, column);
    if(syntax !== undefined) {
      node.syntax = syntax;
    }

    return node;
  };

  function flatten(arr) {
    return arr.reduce(function(a, e) {
      return a.concat(e instanceof Array ? flatten(e) : e);
    }, []);
  };

  function addLineColumn(node, line, column) {
    node.l = line;
    node.i = column;
    return node;
  }

  function bundleApplications(f, applications) {
    if (applications.length > 0) {
      return bundleApplications({ t: "invocation", c: [f].concat(applications[0]) },
                                applications.slice(1));
    } else {
      return f;
    }
  }
}

start
  = all:top { return node("top", all, line, column); }

top
  = do

do
  = __* first:expression _* rest:do_continue* __*
    { return node("do", [first].concat(rest), line, column); }
  / __*
    { return node("do", [], line, column); }

do_continue
  = _* nl __* all:expression _*
    { return all }

expression
  = conditional
  / parenthetical
  / assignment
  / atom

parenthetical
  = invocation
  / lambda

invocation
  = f:function applications:application+ _*
    { return addLineColumn(bundleApplications(f, applications),
                           line,
                           column); }

function
  = all: lambda
  / all: label

application
  = '(' arguments:argument* ')'
    { return arguments; }

argument
  = __* expression:expression __*
    { return expression }

lambda
  = '{' __? parameters:parameter* __? body:do '}'
    { return node("lambda", [parameters, body], line, column); }

assignment
  = label:label ':' _* expression:expression
    { return node("assignment", [label, expression], line, column); }

conditional
  = 'if' _* condition:expression _* lambda:lambda _* rest:(elseif / else)?
    { return node("conditional", [condition, lambda].concat(rest ? rest : []), line, column); }

elseif
  = 'elseif' _* condition:expression _* lambda:lambda _* rest:(elseif / else)?
    { return [condition, lambda].concat(rest ? rest : []); }

else
  = 'else' _* lambda:lambda
    { return [{ t: "boolean", c: true }, lambda]; }

atom
  = number
  / string
  / boolean
  / label

parameter
  = '?' label:label _*
    { return node("parameter", label.c, line, column); }

number
  = a:[0-9]+ b:[.] c:[0-9]+
    { return node("number", parseFloat(a.join("") + b + c.join(""), 10), line, column); }
  / all:[0-9]+
    { return node("number", parseInt(all.join(""), 10), line, column); }

string
  = '"' all:[A-Za-z0-9.,# ]* '"'
    { return node('string', all.join(""), line, column); }

boolean
  = 'true'  { return node("boolean", true, line, column); }
  / 'false' { return node("boolean", false, line, column); }

label
  = !keyword all: label_char+
    { return node("label", all.join(""), line, column); }

label_char
  = [a-zA-Z0-9_\-]

nl
  = all:[\n]+
    { return node('nl', all, line, column); }

_
  = [ \t\r]+

__
  = [ \t\r\n]+

keyword
  = 'if' !label_char
  / 'elseif' !label_char
  / 'else' !label_char
