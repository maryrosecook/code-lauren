## Moving a rectangle

Write some code that makes a blue rectangle move across the screen. If you've done the first tutorial and aren't sure how to proceed, refresh your memory by looking at the [moving an oval](#moving-an-oval) section of the end of the first tutorial.

Have you written some code?

If you got stuck, email [mary@maryrosecook.com](mailto:mary@maryrosecook.com) and tell me what you got stuck on, or look at the code below.

```
left-dist: 1

forever {
  left-dist: add(left-dist 1)

  clear-screen()
  draw-rectangle(left-dist
                 300
                 100
                 30
                 "filled"
                 "blue")
}
```
