## Reusing a name

### Doing repeated additions

Type in this code:

```
first-number: 1
write(first-number 600 200 "black")

second-number: add(first-number 2)
write(second-number 600 230 "black")
```

You created `second-number` by giving `first-number` and `2` to the `add` action.  That is, you gave a new name to a number you created using an old name.

### Reusing a name

But why bother making a new name? Why not just reuse the old one? Type in this code:

```
number: 1
write(number 600 200 "black")

number: add(number 2)
write(number 600 230 "black")
```

Do you see how `number` was reused as the name of the result of adding `number` and `2`? Why is that useful? Let's find out...

### [< Previous](#naming-the-result-of-an-action) <div class="next">[Doing an action a lot of times >](#doing-an-action-a-lot-of-times)</div>
