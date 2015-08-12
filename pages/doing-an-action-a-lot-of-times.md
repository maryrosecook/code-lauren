## Doing an action a lot of times

When you reused the `number` name, you could focus on the adding, rather than the naming.  This will come in useful now.  You are going to create your first animation. Delete the code on the left. Type in the code below:

```
number: 1

forever {
  number: add(number 1)

  clear-screen()
  write(number 600 200 "black")
}
```

What is happening here?

`1` is named `number`.  There is something about a `forever`, whatever that is.  `1` is added to `number` and the result, `2`, is named `number`.

The `clear-screen` action clears the screen. (The screen is already clear, so this is pointless, but you'll see why that line is there in a second.)

`number` is written to the screen.

This is where `forever` comes in.  The `forever` jumps the code back up to the line with the `add` action. Again, `1` is added to `number` and the result, `3`, is named `number`.

The screen is cleared. So the old number that was written to the screen is cleared away. `number` is written to the screen again.  The `forever` jumps the code back...and so on.

### Running your code step by step

This progression of events is quite complicated.  You can use the Code Lauren program play controls to see a clearer picture of how your code runs.  Click <button class="example-pause-button"></button> at the top of the page to make your program pause.  Now use <button class="example-step-backwards-button"></button> and <button class="example-step-forwards-button"></button> to see your code run step by step.

### [← Previous](#reusing-a-name) <div class="next">[Moving an oval →](#moving-an-oval)</div>
