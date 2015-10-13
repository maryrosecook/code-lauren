## Offsetting many moving shapes

On the previous page, you got the body of the car looking like a car and moving along.  Your code might look something like this:

```
left-dist: 1

forever {
  left-dist: add(left-dist 1)

  clear-screen()

  draw-rectangle(left-dist
                 240
                 150
                 30
                 "filled"
                 "blue")

  draw-rectangle(add(left-dist 40)
                 200
                 70
                 40
                 "filled"
                 "red")
}
```

### Adding some wheels

Add some code to your program that draws some yellow wheels on the car.  Use the techniques on the previous page to position the wheels on opposite ends of the bottom of the car.

### [← Previous](#offsetting-two-moving-shapes) <div class="next">[Final code for the car →](#car-final-code)</div>
