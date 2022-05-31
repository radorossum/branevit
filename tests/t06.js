//const { project } = require("paper/dist/paper-core");

//const { Path } = require("paper/dist/paper-core");
var circle;

// function onResize(event) {
//     project.clear();
//     // Whenever the window is resized, recenter the path:
   
//    // circle.position = view.center;
//     console.log(view.size)
// }

globals.redraw = function () {
    circle.center = view.center;
    circle.radisus = view.size.width / 4;

}

globals.sketch1 = sketch1 = function(){
   
    circle = new Path.Circle(view.center, view.size.width / 4);
    circle.strokeColor = 'green';
}



