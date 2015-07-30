## Draw a rectangle

Type in the code below to draw a rectangle.  When I say "type in the code", I really mean it. There is the world of difference between copying and pasting the code, or just taking my word for what the code does.  Learning to program is about experimenting.  Type in the code.  Play around with it.  Try things I haven't suggested. Guess what some code will do, then type it in to see if you're right.

```
draw-rectangle(100 200 50 150 "filled" "gray")
```

### Ordering the items in the description of a shape

In the line of code you wrote to describe the rectangle, swap the places of `100` and `"gray"`.  The line of code should now look like this:

```
draw-rectangle("gray" 200 50 150 "filled" 100)
```

What happened?

Yep, the rectangle is gone. Ordering matters. `draw-rectangle` expected the first item it its description to be a number that says how far from the left the rectangle is.  Instead, it got a color. Without understanding all the pieces of the description, it couldn't do its job.

### Next: [Naming things](#naming-things)
