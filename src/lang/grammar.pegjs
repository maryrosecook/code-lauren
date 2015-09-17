{
  function node(tag, content, s, text, syntax, raw) {
    var node = {
      t: tag,
      c: content,
      s: s,
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

  function endOffset(s, text) {
    return s + text.length;
  }

  function wrapLastDoExpressionInReturn(expressions) {
    var initial = expressions.slice(0, expressions.length - 1);
    var last = expressions[expressions.length - 1];
    return initial.concat(node("return", last, last.s, last.text));
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
  / parenthetical
  / conditional
  / assignment
  / atom

parenthetical
  = invocation
  / lambda

invocation
  = f:function applications:application+ _*
    {
      var n = bundleApplications(f, applications);
      n.s = offset();
      n.text = text();
      n.e = endOffset(offset(), text());
      return n; // refactor to use node()
    }

function
  = all: lambda
  / all: conditional
  / all: label

application
  = '(' arguments:argument* ')'
    { return arguments; }

argument
  = __* expression:expression __*
    { return expression }

lambda
  = '{' parameters:parameters body:do '}'
    { return node("lambda", [parameters, body], offset(), text()); }

assignment
  = label:label colon _* expression:expression
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
    { return [node("else", undefined, lambda.s - 5, "else"),
              node("invocation", [lambda], lambda.s, lambda.text)]; }

forever
  = 'forever' _* lambda: lambda
    { return node("forever",
                  node("invocation", [lambda], lambda.s, lambda.text), offset(), text()); }

atom
  = number
  / string
  / boolean
  / label

parameters
  = __? parameters:parameter+
    { return parameters }
  / ''
    { return []; /* match empty params w/o gobbling whitespace so do takes whitespace */ }

parameter
  = '?' label:label _*
    { return node("parameter", label.c, offset(), text()); }

number
  = a:'-'? b:[0-9]+ c:[.]? d:[0-9]*
    { return node("number", parseFloat((a || "") +
                                       b.join("") +
                                       c + d.join(""), 10),
                                       offset(),
                                       text()); }

string
  = '"' all:[A-Za-z0-9.,# ]* '"'
    { return node('string', all.join(""), offset(), text()); }

boolean
  = true_keyword  { return node("boolean", true, offset(), text()); }
  / false_keyword { return node("boolean", false, offset(), text()); }

label
  = !keyword first:start_label_char others:label_char*
    { return node("label", [first].concat(others).join(""), offset(), text()); }

start_label_char
  = [a-zA-Z_]

label_char
  = [a-zA-Z0-9_\-]

nl
  = all:[\n]+
    { return node('nl', all, offset(), text()); }

colon
  = ':'
_
  = [ \t\r]+

__ ""
  = [ \t\r\n]+

if_keyword
  = 'if'

elseif_keyword
  = 'elseif'

else_keyword
  = 'else'

forever_keyword
  = 'forever'

true_keyword
  = 'true'

false_keyword
  = 'false'

keyword
  = if_keyword !label_char
  / elseif_keyword !label_char
  / else_keyword !label_char
  / forever_keyword !label_char
  / true_keyword !label_char
  / false_keyword !label_char