## Offsetting two moving shapes

On the previous page, you wrote a program that moved two rectangles along together.  Your code might look something like this:

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

  draw-rectangle(left-dist
                 200
                 10
                 300
                 "filled"
                 "red")
}
```

Does your code use one name for the distance of both rectangles from the left (as the code above does with `left-dist`)? Or does your code use a different name for each rectangle (eg `left-dist-one` and `left-dist-two`)?

If your code uses two different names, change it so it only uses one.  This makes your code shorter and, therefore, easier to understand.

### Making the blue and red rectangle look like a car

On this page, you will turn the blue rectangle into the bottom of the car and the red rectangle into the top:

<img alt="Red box on top of blue box to represent a car"
     src="/resources/images/help/offsetting-two-moving-shapes-car.png"
     width="434" height="100" />

#### Rectangles of the right sizes

Change the width and height of the rectangles so the red one is smaller than the blue one.

#### Rectangles nearly in the right places

Get the red rectangle perched on top of the blue rectangle.  To do this, change the numbers that describe the distance that each rectangle is from the top of the screen.

#### Rectangles really in the right places

The rectangles are in the right place vertically.  Now they need to be in the right place horizontally.

This is a little trickier.  You were able to get the top rectangle on top of the bottom rectangle because you could directly change the numbers that describe the distance of each rectangle from the top of the screen.  To get the red rectangle centered over the blue rectangle, you need to put the two rectangles at different distances from the left.  But both rectangles use the same name to describe their distance from the left, so they always have the same distance from the left!

Try using `add` to modify the distance of one of the rectangles from the left.  For example, look at the code below.  It draws a green oval on the left and a yellow oval on the right.

`start` describes the green oval's distance from the left of the screen.  But `add(start 200)` is used to describe the yellow oval's distance from the left.  This means that `200` is added to `start` to get the yellow oval's distance from the left.  Which means that the yellow oval is drawn on the right of the green oval.

```
start: 100

draw-oval(start 100 100 100 "filled" "green")
draw-oval(add(start 200)
          100
          100
          100
          "filled"
          "yellow")
```

Use the technique in the code above to get the red top rectangle of your car centered over the blue bottom rectangle.

### [← Previous](#moving-two-shapes-together) <div class="next">[Offsetting many moving shapes →](#offsetting-many-moving-shapes)</div>
