{
  function node(tag, content, offset, syntax, raw) {
    var node = { t: tag, c: content, i: offset };
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
  = all:top { return node("top", all, offset); }

top
  = do

do
  = __* first:expression _* rest:do_continue* __*
    { return node("do", [first].concat(rest), offset); }
  / __*
    { return node("do", [], offset); }

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
    { var n = bundleApplications(f, applications); n.i = offset; return n; }

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
    { return node("lambda", [parameters, body], offset); }

assignment
  = label:label ':' _* expression:expression
    { return node("assignment", [label, expression], offset); }

conditional
  = 'if' _* condition:expression _* lambda:lambda _* rest:(elseif / else)?
    { return node("conditional", [condition, lambda].concat(rest ? rest : []), offset); }

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
    { return node("parameter", label.c, offset); }

number
  = a:[0-9]+ b:[.] c:[0-9]+
    { return node("number", parseFloat(a.join("") + b + c.join(""), 10), offset); }
  / all:[0-9]+
    { return node("number", parseInt(all.join(""), 10), offset); }

string
  = '"' all:[A-Za-z0-9.,# ]* '"'
    { return node('string', all.join(""), offset); }

boolean
  = 'true'  { return node("boolean", true, offset); }
  / 'false' { return node("boolean", false, offset); }

label
  = !keyword all: label_char+
    { return node("label", all.join(""), offset); }

label_char
  = [a-zA-Z0-9_\-]

nl "new line"
  = all:[\n]+
    { return node('nl', all, offset); }

_ "space"
  = [ \t\r]+

__ ""
  = [ \t\r\n]+

keyword
  = 'if' !label_char
  / 'elseif' !label_char
  / 'else' !label_char
