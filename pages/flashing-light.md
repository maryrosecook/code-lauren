## Flashing light

Code that a light flash from red to blue:

```
color: "red"

forever {
  if counted(40) {
    if equal(color "red") {
      color: "blue"
    } else {
      color: "red"
    }
  }

  clear-screen()
  draw-oval(300 20 150 150 "filled" color)
}
```
