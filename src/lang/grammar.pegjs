{
  function node(tag, content, s, text, syntax, raw) {
    var node = {
      t: tag,
      c: content,
      s: startOffset(s, text),
      text: text,
      e: endOffset(s, text)
    };

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

  function wrapLastDoExpressionInReturn(expressions) {
    var initial = expressions.slice(0, expressions.length - 1);
    var last = expressions[expressions.length - 1];
    return initial.concat(node("return", last, last.s, last.text));
  }

  function startOffset(s, text) {
    var leadingWhitespaceLength = text.length - text.replace(/^\s+/, "").length;
    return s + leadingWhitespaceLength;
  }

  function endOffset(s, text) {
    return s + text.trim().length;
  }
}

start
  = all:top { return node("top", all, offset(), text()); }

top
  = do

do
  = __* first:expression _* rest:do_continue* __*
    { return node("do", wrapLastDoExpressionInReturn([first].concat(rest)), offset(), text()); }
  / __*
    { return node("do",
                  wrapLastDoExpressionInReturn([node("undefined", undefined, offset(), text())]),
                  offset(),
                  text()); }

do_continue
  = _* nl __* all:expression _*
    { return all; }

expression
  = forever
  / conditional
  / parenthetical
  / assignment
  / atom

parenthetical
  = invocation
  / lambda

invocation
  = f:function applications:application+ _*
    {
      var n = bundleApplications(f, applications);
      n.s = startOffset(offset(), text());
      n.text = text();
      n.e = endOffset(offset(), text());
      return n; // refactor to use node()
    }

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
    { return node("lambda", [parameters, body], offset(), text()); }

assignment
  = label:label ':' _* expression:expression
    { return node("assignment", [label, expression], offset(), text()); }

conditional
  = 'if' _* condition:expression _* lambda:lambda _* rest:(elseif / else)?
    { return node("conditional", [condition,
                                  node("invocation", [lambda], lambda.s, lambda.text)]
                                    .concat(rest ? rest : []), offset(), text()); }

elseif
  = 'elseif' _* condition:expression _* lambda:lambda _* rest:(elseif / else)?
    { return [condition, node("invocation", [lambda], lambda.s, lambda.text)]
               .concat(rest ? rest : []); }

else
  = 'else' _* lambda:lambda
    { return [{ t: "boolean", c: true }, node("invocation", [lambda], lambda.s, lambda.text)]; }

forever
  = 'forever' _* lambda: lambda
    { return node("forever",
                  node("invocation", [lambda], lambda.s, lambda.text), offset(), text()); }

atom
  = number
  / string
  / boolean
  / label

parameter
  = '?' label:label _*
    { return node("parameter", label.c, offset(), text()); }

number
  = a:[0-9]+ b:[.] c:[0-9]+
    { return node("number", parseFloat(a.join("") + b + c.join(""), 10), offset(), text()); }
  / all:[0-9]+
    { return node("number", parseInt(all.join(""), 10), offset(), text()); }

string
  = '"' all:[A-Za-z0-9.,# ]* '"'
    { return node('string', all.join(""), offset(), text()); }

boolean
  = 'true'  { return node("boolean", true, offset(), text()); }
  / 'false' { return node("boolean", false, offset(), text()); }

label
  = !keyword all: label_char+
    { return node("label", all.join(""), offset(), text()); }

label_char
  = [a-zA-Z0-9_\-]

nl
  = all:[\n]+
    { return node('nl', all, offset(), text()); }

_
  = [ \t\r]+

__ ""
  = [ \t\r\n]+

keyword
  = 'if' !label_char
  / 'elseif' !label_char
  / 'else' !label_char
