//paperscript
// Create a Paper.js Path to draw a line into it:

//import paper from 'paper';

//import 'paper';

var path = new Path();

function drawSomething() {
    console.log("drawing");

    // Give the stroke a color
    path.strokeColor = 'green';
    var start = new Point(100, 100);
    // Move to start and draw a line from there
    path.moveTo(start);
    // Note the plus operator on Point objects.
    // PaperScript does that for us, and much more!
    path.lineTo(start + [100, 250]);

    path = new Path.Circle({
        center: view.center,
        radius: 130,
        strokeColor: 'red'
    });
    
}


function onResize(event) {
    // Whenever the window is resized, recenter the path:
    path.position = view.center;
}

globals.draw = function () {
    console.log("loaded");
    drawSomething();
    
}

