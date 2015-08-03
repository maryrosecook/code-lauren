## Naming things


Earlier, I suggested you make a line of ovals. You might have noticed that you were repeating numbers. For another example, type in this code:

```
draw-oval(200 200 30 40 "filled" "blue")
draw-oval(250 200 30 40 "filled" "red")
```

`200`, the description of how far down to draw an oval, appears twice.  `30`, the width of the ovals, appears twice. The height appears twice, too.

### Name the distance from the top

You can name the distance of the ovals from the top like this:

```
top-dist: 200
```

You can then use the name in place of the distance.  Notice how the code below sets `top-dist` to `200` and replaces the `200`s with `top-dist` in the `draw-oval` actions.

```
top-dist: 200

draw-oval(200 top-dist 30 40 "filled" "blue")
draw-oval(250 top-dist 30 40 "filled" "red")
```

### Change the distance from the top

Change the number that `top-dist` describes. For example, you could change it to `300`.

```
top-dist: 300

draw-oval(200 top-dist 30 40 "filled" "blue")
draw-oval(250 top-dist 30 40 "filled" "red")
```

### Naming something makes it easy to change

Notice how easy it was to move both ovals at once.  You needed to change just one number.

### Naming something describes it

Notice how easy it was to figure out which number to change. Names describe the meaning of the numbers they represent.

### Name the width

Add a name for the width and use it in your `draw-oval` descriptions.

### [← Previous](#draw-a-rectangle) <div class="next">[Write text →](#write-text)</div>
