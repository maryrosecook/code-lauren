## Moving an oval

In the previous lesson, you did your first animation. But animating a shape is even more fun. Let's do that!  Type in this code:

```
left-dist: 1

forever {
  left-dist: add(left-dist 0.1)

  clear-screen()
  draw-oval(left-dist 300 30 30 "filled" "blue")
}
```

This code is extremely similar to the code in the previous lesson.  The main difference is that the number that gets changed is used to describe the distance of an oval from the left of the screen.

Again, if you're not sure how this code works, use the play controls at the top of the screen. Walk through the code step by step to see the sequence of events.

### Next

That's the end of this tutorial. You've covered a lot. I'll publish more tutorials very soon. Please send feedback on things that could be better about Code Lauren to [mary@maryrosecook.com](mailto:mary@maryrosecook.com)

### [← Previous](#doing-an-action-a-lot-of-times) <div class="next">[Home](#home)</div>
