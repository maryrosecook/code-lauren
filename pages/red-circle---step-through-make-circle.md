## Step through make-circle

All code explaining and stepping is getting annoying, I know.  But it's worth it.  First, after some initial explanation of vocabulary and grammar, you'll know enough to write programs on your own.  Second, stepping is a great tool for understanding your programs.  I promise: this page and one more easy one and you'll understand the whole program.

Click <img src="/resources/images/step-forwards-bow.png" width="10" /> and `make-circle(200 300 100)` is highlighted.  This instruction says "do the `make-circle` action with `200`, `300` and `100`".  How does it say that? Let's dissect it to find out:

<img src="/resources/images/help/anatomy-of-running-an-action.png" width="434px" height="169px" />

All action runs have the same form: the action, and two parentheses that tell the action to run and also collect the information to give to the action.

`make-circle` makes a circle.  It assumes the first number it is given is the x-coordinate of the circle.  It assumes the second number is the y-coordinate of the circle.  It assumes the third number is the radius of the circle.

Click <img src="/resources/images/step-forwards-bow.png" width="10" /> and `black-circle: make-circle(200 300 100)` is highlighted.  This means, "take the circle that `make-circle(200 300 100)` made and name it `black-circle`".

A piece of code that names something always has this structure: a name, a colon and something to be named.

<img src="/resources/images/help/anatomy-of-an-assignment.png" width="434px" height="94px" />
