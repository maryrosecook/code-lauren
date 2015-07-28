## Naming things

Earlier, I suggested you make a line of ovals. You might have noticed that you were repeating numbers. Look, for example, at this code.

```
draw-oval(200 200 30 30 "filled" "blue")
draw-oval(250 200 30 30 "filled" "red")
draw-oval(300 200 30 30 "filled" "yellow")
```

`100`, the description of how far down to draw an oval, appears three times.  `30`, the width of the ovals, appears three times. The height appears three times, too.

### Name the distance from the top

You can name the distance of the ovals from the top like this:

```
top-dist: 200
```

You can then use the name in place of the distance:

```
top-dist: 200

draw-oval(200 top-dist 30 30 "filled" "blue")
draw-oval(250 top-dist 30 30 "filled" "red")
draw-oval(300 top-dist 30 30 "filled" "yellow")
```

### Change the distance from the top

Change the number that `top-dist` describes. For example, you could change it to `300`.

```
top-dist: 300

draw-oval(200 top-dist 30 30 "filled" "blue")
draw-oval(250 top-dist 30 30 "filled" "red")
draw-oval(300 top-dist 30 30 "filled" "yellow")
```

### Naming something makes it easy to change

Notice how easy it was to move all the ovals at once.  You needed to change just one number.

### Naming something describes it

Notice how easy it was to figure out which number to change. Labels describe the meaning of the numbers they represent.

### Name the width

Add a name for the width and use it in your `draw-oval` descriptions.
