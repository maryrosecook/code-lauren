# Draw a rectangle

Type in the code below to draw a rectangle:

```
draw-rectangle(100 200 50 150 "filled" "gray")
```

## Ordering the items in the description of a shape

In the line of code you wrote to describe the rectangle, swap the places of `100` and `"gray"`.  The line of code should now look like this:

```
draw-rectangle("gray" 200 50 150 "filled" 100)
```

What happened?

Yep, the rectangle is gone. Ordering matters. `draw-rectangle` expected the first item it its description to be a number that says how far from the left the rectangle is.  Instead, it got a color. Without understanding all the pieces of the description, it couldn't do its job.
