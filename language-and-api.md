# A quick overview of all the syntax and APIs implemented in Code Lauren

## Syntax

### Forever

Infinite loop.

```
forever {

}
```

### Conditionals

```
if true {

} elseif false {

} else {

}
```

### Assignment

```
num: 1
```

```
return-two: {
  2
}
```

### Functions

```
sum: { ?a ?b
  add(a b)
}

sum(1 2)
```

## Builtins

### Drawing

#### Clear screen

```
clear-screen()
```

#### Drawing

##### Draw oval

Fifth arg can be `"filled"` or `"unfilled"`

```
draw-oval(10 20 30 40 "filled" "black")
```

##### Draw rectangle

Fifth arg can be `"filled"` or `"unfilled"`

```
draw-rectangle(10 20 30 40 "filled" "black")
```

##### Draw text

```
write("hello" 10 20 "black")
```

##### Random color

```
random-color()
```

##### Overlapping rectangles test

Returns `true` or `false`.

```
rectangle-overlapping-rectangle(x1 y1 w1 h1 x2 y2 w2 h2)
```

##### Mouse

These variables are available: `mouse-button-is-down`, `mouse-distance-from-left` and `mouse-distance-from-top`.

### Standard library

```
add(number-a number-b)
```

```
subtract(number-a number-b)
```

```
multiply(number-a number-b)
```

```
divide(number-a number-b)
```

```
positive(negative-number)
```

```
distance(x1 y1 x2 y2)
```

```
square-root(number)
```

```
modulus(number)
```

```
sine(angle-degrees)
```

```
cosine(angle-degrees)
```

```
tangent(angle-degrees)
```

```
radians(angle-degrees)
```

```
degrees(angle-radians)
```

```
more-than(number-a number-b)
```

```
less-than(number-a number-b)
```

```
equal(string-number-or-boolean-a string-number-or-boolean-b)
```

```
opposite(boolean-or-number)
```

```
random-number(low-bound high-bound)
```

```
print(printable-thing)
```
