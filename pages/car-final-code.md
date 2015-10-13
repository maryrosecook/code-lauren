## Final code for the car

On the previous page, you attached some wheels that moved along with the body of the car.  Your code might look something like this:

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

  draw-oval(add(left-dist 15)
            260
            30
            30
            "filled"
            "yellow")

  draw-oval(add(left-dist 110)
            260
            30
            30
            "filled"
            "yellow")
}
```

### Wrap-up

If you got the car working with all the parts - great job!

If you didn't get the car working - no worries.  Try using the player controls at the top of the page to figure out what your program is doing and how to make it do what you want.  Or type in the code above and use the player controls to figure out how it works.

[Learn more about how to use the player controls](#fixing-code-using-the-player-controls).

If you stay stuck, please email [mary@maryrosecook.com](mailto:mary@maryrosecook.com) and I can help.

### [← Previous](#offsetting-many-moving-shapes) <div class="next">[Home](#home)</div>
