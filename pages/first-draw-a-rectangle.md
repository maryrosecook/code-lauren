## Draw a rectangle

Delete all the code on the left.  Then type in the code below to draw a rectangle.

When I say "type in the code", I really mean it. There is a world of difference between typing in the code and either copying and pasting it or just taking my word for what the code does.  Learning to program is about experimenting.  Play around.  Try things I haven't suggested. Guess what some code will do, then see if you're right.

Go ahead and type this in:

```
draw-rectangle(100 200 50 150 "filled" "gray")
```

### Ordering the items in the description of a shape

In the line of code you wrote to describe the rectangle, swap the places of `100` and `"gray"`.  The line of code should now look like this:

```
draw-rectangle("gray" 200 50 150 "filled" 100)
```

What happened?

Yep, the rectangle is gone. The order you write things in matters. `draw-rectangle` expected the first item it its description to be a number that says how far from the left the rectangle is.  Instead, it got a color. Without understanding all the pieces of the description, it couldn't do its job.
