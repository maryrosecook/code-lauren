## Moving two shapes together

Did you write some code that moves a rectangle across the screen? Maybe your code looks something like this:

```
left-dist: 1

forever {
  left-dist: add(left-dist 1)

  clear-screen()
  draw-rectangle(left-dist
                 300
                 150
                 30
                 "filled"
                 "blue")
}
```

### The blue rectangle

If your rectangle is not blue, set the color of your rectangle to `"blue"`.

### The red rectangle

Add another line of code that draws a rectangle that has its center `100` from the left of the screen and `200` from the top.  Make it `10` wide, `300` tall and colored `"red"`.

### Move the two rectangles

Make the red rectangle move along with blue rectangle.

If you're not sure how to do this, look at the line of code for the blue rectangle.  It uses a label called `left-dist` (or something like that) to describe how far from the left of the screen to draw the rectangle.  There is also a line of code that increases `left-dist` (or whatever it's called in your program).  Because this line is inside the `forever`, it's called over and over, so `left-dist` keeps on increasing.  This means that, each time the line of code that draws the blue rectangle is called, the rectangle is drawn in a new place.  You can use the same approach to move the red rectangle.

If you're still unsure, use the player controls at the top of the page to run your program step by step.

[Learn more about how to use the player controls to figure out what your program is doing and how to make it do what you want](#fixing-code-using-the-player-controls).
