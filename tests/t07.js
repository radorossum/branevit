
//import *  as p from "paper";

//const { project } = require("paper/dist/paper-core");


///////////////////////////////////
// UI
///////////////////////////////////

var gui = new dat.GUI();

var paramActions = {
    clear: function () { project.activeLayer.removeChildren() },
    selectAll: function () { project.activeLayer.selected = true },
    clearSelection: function () { },
}
var guiActions = gui.addFolder('Actions');

guiActions.add(paramActions, 'clear');
guiActions.add(paramActions, 'selectAll');

//gui.add(clearButton= { clear:function(){ project.activeLayer.removeChildren() }},'clear');

var guiGenerate = gui.addFolder('Generate');
var paramRndBlobs = {

    paths: 5,
    minPoints: 3,
    maxPoints: 5,
    minRadius: .1,
    maxRadius: .5,
    create: createRandomBlobs,
};
var guiGenRndBlobs = guiGenerate.addFolder('Random Blobs');
guiGenRndBlobs.add(paramRndBlobs, 'paths', 1, 100).step(1);
guiGenRndBlobs.add(paramRndBlobs, 'minPoints', 1, 100).step(1);
guiGenRndBlobs.add(paramRndBlobs, 'maxPoints', 1, 100).step(1);
guiGenRndBlobs.add(paramRndBlobs, 'minRadius', 0., 1.).step(0.01);
guiGenRndBlobs.add(paramRndBlobs, 'maxRadius', 0., 1).step(0.01);
guiGenRndBlobs.add(paramRndBlobs, 'create');

guiGenerate.open();
guiGenRndBlobs.open();

// Palette
///////////////////////////////////
var paramPalette = {
    ncolors: 5,
    color0: '#000000',
    prob0: .5,
    color1: '#ff0000',
    prob1: .5,
    color2: '#00ff00',
    prob2: 0.,
    color3: '#0000ff',
    prob3: 0.,
    color4: '#ffff00',
    prob4: 0.,
    color5: '#00ffff',
    prob5: 0.,
    palette: [],
    colors: [],
    colorWeights: [],
    build: function () {
        this.colors = [this.color0, this.color1, this.color2, this.color3, this.color4, this.color5];
        this.colorWeights = [this.prob0, this.prob1, this.prob2, this.prob3, this.prob4, this.prob5];
        //normalize colorweights using reduce
        var sum = this.colorWeights.reduce(function (a, b) { return a + b; });
        this.colorWeights = this.colorWeights.map(function (x) { return x / sum; });
        //this.colorWeights = this.colorWeights.map(x =>{return x/this.colorWeights.reduce((a,b)=>{return a+b;},0)},this);
        this.palette = [];
        for (var i = 0; i < this.colors.length; i++) {
            for (var j = 0; j < this.colorWeights[i] * this.ncolors; j++) {
                this.palette.push(this.colors[i]);
                if (this.palette.length >= this.ncolors) break;
            }
        }

        console.log(this.colorWeights);
        console.log(this.palette);
    },
    sorthue: function () { },
    sortlightness: function () { },
    randomize: function () { },

};

var guiPalette = gui.addFolder('Palette');
guiPalette.add(paramPalette, 'ncolors', 1, 10).step(1);
guiPalette.add(paramPalette, 'prob0', 0, 1).step(0.01);
guiPalette.add(paramPalette, 'prob1', 0, 1).step(0.01);
guiPalette.add(paramPalette, 'prob2', 0, 1).step(0.01);
guiPalette.add(paramPalette, 'prob3', 0, 1).step(0.01);
guiPalette.add(paramPalette, 'prob4', 0, 1).step(0.01);
guiPalette.add(paramPalette, 'prob5', 0, 1).step(0.01);
guiPalette.addColor(paramPalette, 'color0');
guiPalette.addColor(paramPalette, 'color1');
guiPalette.addColor(paramPalette, 'color2');
guiPalette.addColor(paramPalette, 'color3');
guiPalette.addColor(paramPalette, 'color4');
guiPalette.addColor(paramPalette, 'color5');
guiPalette.add(paramPalette, 'build');

// Generators
///////////////////////////////////////////////

//// random blobs
///////////////////////////////////////////

function createRandomBlobs() {
    var radiusDelta = paramRndBlobs.maxRadius - paramRndBlobs.minRadius;
    var pointsDelta = paramRndBlobs.maxPoints - paramRndBlobs.minPoints;
    for (var i = 0; i < paramRndBlobs.paths; i++) {
        var radius = view.viewSize.width * (paramRndBlobs.minRadius + Math.random() * radiusDelta);
        var points = paramRndBlobs.minPoints + Math.floor(Math.random() * pointsDelta);
        var path = createBlob(view.size * Point.random(), radius, points);
        var lightness = (Math.random() - 0.5) * 0.4 + 0.4;
        var hue = Math.random() * 360;
        path.fillColor = { hue: hue, saturation: 1, lightness: lightness };
        path.strokeColor = 'black';
    };
}

function createBlob(center, maxRadius, points) {
    var path = new Path();
    path.closed = true;
    for (var i = 0; i < points; i++) {
        var delta = new Point({
            length: (maxRadius * 0.5) + (Math.random() * maxRadius * 0.5),
            angle: (360 / points) * i
        });
        path.add(center + delta);
    }
    path.smooth();
    return path;
}

// Tools
///////////////////////////////////////////////

var hitOptions = {
    segments: true,
    stroke: true,
    fill: true,
    tolerance: 5
};

var selectedSegment, selectedPath;
var movePath = false;

function onMouseDown(event) {
    selectedSegment = selectedPath = null;

    var hitResult = project.hitTest(event.point, hitOptions);
    if (!hitResult && !event.modifiers) {
        project.activeLayer.selected = false;
        return;
    }

    if (!event.modifiers.shift) {
        project.activeLayer.selected = false;
    }
    if (event.modifiers.alt) {
        if (hitResult.type == 'segment') {
            hitResult.segment.remove();
        };
        return;
    }

    if (hitResult) {
        //hitResult.selected = true;

        console.log(hitResult.item);
        if (event.item) {
            // event.item.selected = true;
            hitResult.item.selected = true;
            // event.item.selected = !event.item.selected;
        }

        selectedPath = hitResult.item;
        if (hitResult.type == 'segment') {
            selectedSegment = hitResult.segment;
        } else if (hitResult.type == 'stroke') {
            var location = hitResult.location;
            selectedSegment = selectedPath.insert(location.index + 1, event.point);
            selectedPath.smooth();
        }
    }
    //  movePath = hitResult.type == 'fill';
    if (hitResult && hitResult.type == 'fill') {
        project.activeLayer.addChild(hitResult.item);
    }
}

function onMouseMove(event) {
    //project.activeLayer.selected = false;
    //if (event.item) event.item.selected = true;
}

function onMouseDrag(event) {
    if (selectedSegment) {
        selectedSegment.point += event.delta;
        selectedPath.smooth();
    } else if (selectedPath) {
        //selectedPath.position += event.delta;
    }

    //console.log(project.selectedItems);
    if (Key.isDown('t')) {
        project.selectedItems.forEach(
            function (item) {
                item.position += event.delta;
            }
        );
    }
    if (Key.isDown('r')) {
        project.selectedItems.forEach(
            function (item) {
                //item.rotation += event.delta.angle * 0.1;
                item.rotate(event.delta.angle * 0.1, event.point);
                //item.position += event.delta;
            }
        );
    }

    //if 's' is down scale the selected items
    if (Key.isDown('s')) {
        project.selectedItems.forEach(
            function (item) {
                item.scale(1 + (event.delta.x - event.delta.y) * 0.01);

            }
        );
    }

}

function onMouseUp(event) {
    // if (!event.modifiers.shift) {
    //     project.activeLayer.selected = false;

    // }
}

// global events
///////////////////////////////////////////////
function onResize() {

    view.viewSize = new Size(window.innerWidth, window.innerHeight);
    console.log("resized to " + view.viewSize.width + "," + view.viewSize.height)
}