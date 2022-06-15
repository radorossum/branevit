
//import *  as p from "paper";
//const {project, Point,Color, Size, View, Layer, Key, view ,Tool} = require("paper/dist/paper-core");
//const {Path, PathSegment, Point, Color, Size, View, Layer, Key, view, Tool} = require("paper/dist/paper-core");


// parameters 
///////////////////////////////////////////////
var paramActions = {
    clear: function () { project.activeLayer.removeChildren() },
    selectAll: function () {
        //select all children of the active layer
        project.activeLayer.children.forEach(function (item) {
            item.selected = true;
        });
    },
    clearSelection: function () {
        project.activeLayer.selected = false;
        //clear selection from all layers
        project.layers.forEach(
            function (layer) {
                layer.selected = false;
            }
        );
    },
    resize: function () { onResize() },
    palettize: function () {
        project.selectedItems.forEach(
            function (item) {
                item.fillColor = paletteInterface.randomColor();
                item.strokeColor = paletteInterface.randomColor();
            }
        );
    },
    delete: function () {
        project.selectedItems.forEach(
            function (item) { item.remove(); }
        );
    }
}
var paramBackdrop = {
    type: 'color',
    fillColor: '#666',
    strokeColor: '#900',
    opacity: 1.,
    create: function (layer) {
        var tmpLayer = project.activeLayer;
        layer = layer || project.layers[0];
        layer.activate();
        var b = new Path.Rectangle(view.bounds);
        b.fillColor = this.fillColor;
        b.sendToBack();
        // b.strokeColor = this.strokeColor;
        tmpLayer.activate();
    }
}

var paramTools = {
    tools: ['select', 'edit', 'draw', 'erase'],
    activeTool: 'select',
    defaultTool: 'select',
}

var paramProcess = {
    smooth: function () {
        project.selectedItems.forEach(function (v) {
            v.smooth({ type: paramProcess.smoothType, factor: paramProcess.smoothness });

        });
    },
    smoothness: 0.,
    smoothType: 'geometric',
    simplify: function () {
        project.selectedItems.forEach(function (v) {
            v.simplify(
                paramProcess.simplicity
            )
        });
    },
    simplicity: 0.,
    flatten: function () {
        project.selectedItems.forEach(function (v) { v.flatten(paramProcess.flatness) });
    },
    flatness: 0.5
}
var paramColors = {
    apply: function () {
        //apply stroke and fill color to all selected items
        project.selectedItems.forEach(function (item) {
            item.strokeColor = new Color(paramColors.stroke1);
            item.strokeColor.set(item.strokeColor.red, item.strokeColor.green, item.strokeColor.blue, paramColors.strokeOpacity1);
            item.fillColor = new Color(paramColors.fill1);
            item.fillColor.set(item.fillColor.red, item.fillColor.green, item.fillColor.blue, paramColors.fillOpacity1);

        });
    },
    fill1: '#ffffff',
    fillOpacity1: 1.,
    stroke1: '#000000',
    strokeOpacity1: 1.,
    fill2: '#000000',
    fillOpacity2: 1.,
    stroke2: '#ffffff',
    strokeOpacity2: 1.,
    removeStroke: function () {
        project.selectedItems.forEach(function (item) {
            item.strokeColor = 'none';
        });
    },
    removeFill: function () {
        project.selectedItems.forEach(function (item) {
            item.fillColor = 'none';
        });
    },
    applyStroke: function () {
        project.selectedItems.forEach(function (item) {
            item.strokeColor = new Color(paramColors.stroke1);
            item.strokeColor.set(item.strokeColor.red, item.strokeColor.green, item.strokeColor.blue, paramColors.strokeOpacity1);
        });
    },
    applyFill: function () {
        project.selectedItems.forEach(function (item) {
            item.fillColor = new Color(paramColors.fill1);
            item.fillColor.set(item.fillColor.red, item.fillColor.green, item.fillColor.blue, paramColors.fillOpacity1);
        });
    }

}

var paramGrid = {
    grid: true,
    rows: 10,
    cols: 10,
    strokeColor: '#999',
    fillColor: '#ff00aa',
    opacity: 0.5,
    snap: false,
    snapSize: 10,
    path: null,
    build: function (nrows, ncols, bb) {
        if (this.path) {
            this.path.remove();
        }
        nrows = nrows || this.rows;
        ncols = ncols || this.cols;
        bb = bb || view.bounds;
        var w = bb.width / ncols;
        var h = bb.height / nrows;
        this.path = new Path();
        this.path.opacity = paramGrid.opacity;
        for (var i = 0; i < ncols; i++) {
            for (var j = 0; j < nrows; j++) {
                var cell = new Path.Rectangle(bb.left + i * w, bb.top + j * h, w, h);
                cell.strokeColor = this.strokeColor;
                cell.fillColor = new Color(this.fillColor + '03');
                cell.opacity = this.opacity;
                this.path.add(cell);
            }
        }
    }


}

var paramRndBlobs = {

    paths: 5,
    minPoints: 3,
    maxPoints: 5,
    minRadius: .1,
    maxRadius: .3,
    create: createRandomBlobs,
};

// Palette
///////////////////////////////////
var paletteInterface = {
    ncolors: 5,
    color0: '#000000',
    prob0: .5,
    color1: 'rgb(255,255,255)',
    prob1: .5,
    color2: '#333',
    prob2: 0.,
    color3: '#666',
    prob3: 0.,
    color4: '#999',
    prob4: 0.,
    color5: '#bbb',
    prob5: 0.,
    palette: ['#000', '#fff'],
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
    },
    sorthue: function () { },
    sortlightness: function () { },
    randomize: function () { },
    randomColor: function () {
        return this.palette[Math.floor(Math.random() * this.palette.length)];
    },

    draw: function (palette, layer, clearfirst) {
        var palette = palette || paletteInterface.palette;
        var layer = layer || project.layers[0];
        var clearfirst = clearfirst || true;
        var ncolors = palette.length;
        var w = view.size.width / ncolors;
        var h = view.size.height;
        if (clearfirst) layer.removeChildren();
        for (var i = 0; i < ncolors; i++) {
            var color = palette[i];
            var rect = new Path.Rectangle({
                point: [i * w, 0],
                size: [w, h],
                fillColor: color,
                //strokeColor:'white'
            });
        }
    }
};

// Layers
///////////////////////////////////
var paramLayers = {
    layers: project.layers,
    activeLayer: 'layer0',
    layer0: true,
    layer1: true,
    layer2: true,
    layer3: true,
}
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
        path.add(center.add(delta));
    }
    path.smooth();
    return path;
}

// Tools
///////////////////////////////////////////////////////////////////////////

// draw tool
var tool = new Tool();
////////////////////////////////////////////////
function setupDrawTool() {

    tool.minDistance = 10;
    var toolPath;
    var selectionPath;
    var mouseDownPoint, mouseUpPoint;

    tool.onMouseDown = function (event) {
        toolPath = new Path();
        toolPath.strokeColor = paletteInterface.randomColor();
        toolPath.strokeWidth = 1;
        mouseDownPoint = event.point;
        toolPath.add(mouseDownPoint);
    }

    tool.onMouseDrag = function (event) {
        toolPath.add(event.point);
    }

    tool.onMouseUp = function (event) {
        mouseUpPoint = event.point;
        toolPath.add(mouseUpPoint);
        toolPath.smooth();
        toolPath.closed = true;
        toolPath.simplify();
        // toolPath.removeOnDrag();
        toolPath = null;
    }
    tool.remove();
}


// var toolSelect = new Tool();
// function setupSelectTool() {

//     // toolSelect.remove();
//     toolSelect.minDistance = 10;

//     toolSelect.selectionPath = new Path();
//     toolSelect.selectionPath.strokeColor = 'red';
//     toolSelect.selectionPath.strokeWidth = 1;

//     toolSelect.onMouseDown = function (event) {
//         toolSelect.selectionPath.remove();
//         toolSelect.selectionPath = new Path();
//         toolSelect.selectionPath.strokeColor = 'red';
//         toolSelect.selectionPath.strokeWidth = 1;
//         toolSelect.selectionPath.add(event.point);
//         console.log('mouse down' + event.point.x + " " + event.point.y);
//     }

//     toolSelect.onMouseDrag = function (event) {
//         toolSelect.selectionPath.add(event.point);
//     }

//     toolSelect.onMouseUp = function (event) {
//         toolSelect.selectionPath.add(event.point);
//         toolSelect.selectionPath.smooth();
//         toolSelect.selectionPath.closed = true;
//         toolSelect.selectionPath.simplify();
//         //toolSelect.selectionPath = null;
//     }


// }


var hitOptions = {
    segments: true,
    stroke: true,
    fill: true,
    tolerance: 5
};

var selectedSegment, selectedPath;
var movePath = false;
var mouseDownPoint = null;


function onKeyDown(event) {
    if (event.key == 'escape') {
        if (event.modifiers.shift) {
            //project.activeLayer.selected = true;
            //select all children of the active layer
            project.activeLayer.children.forEach(function (v) {
                v.selected = true;
            });
        } else
            if (event.modifiers.control) {
                project.activeLayer.selected = false;
                return;
            } else {
                project.selectedItems.forEach(function (v) {
                    v.selected = false;
                });
            }
    }
    if (event.key == 'delete' || event.key == 'backspace') {
        project.selectedItems.forEach(function (v) {
            v.remove();
        });
    }
}

function onMouseDown(event) {
    selectedSegment = selectedPath = null;
    mouseDownPoint = event.point.clone();

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
            if (Key.isDown('`')) {
                // selectedPath.smooth(
                //     {from: (location.index-1) % selectedPath.segments.length, 
                //         to: (location.index + 2) % selectedPath.segments.length,
                //     type:paramProcess.smoothType,
                //     factor:paramProcess.smoothness});
                selectedSegment.smooth();
            }
        }
    }
    //  movePath = hitResult.type == 'fill';
    if (hitResult && hitResult.type == 'fill') {
        //project.activeLayer.addChild(hitResult.item);
    }
}

function onMouseMove(event) {
    //project.activeLayer.selected = false;
    //if (event.item) event.item.selected = true;
}

function onMouseDrag(event) {
    if (selectedSegment) {
        selectedSegment.point += event.delta;
        if (Key.isDown('`')) {
            // selectedPath.smooth(
            //     {from: (location.index-1) % selectedPath.segments.length, 
            //         to: (location.index + 2) % selectedPath.segments.length,
            //     type:paramProcess.smoothType,
            //     factor:paramProcess.smoothness});
            selectedSegment.smooth();
        }
        //selectedPath.smooth();
    } else if (selectedPath) {
        //selectedPath.position += event.delta;
    }

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
                item.rotate(event.delta.angle * 0.1,
                    Key.isDown('shift') ? mouseDownPoint : item.position);
                //item.position += event.delta;
            }
        );
    }
    //if 's' is down scale the selected items
    if (Key.isDown('s')) {
        project.selectedItems.forEach(
            function (item) {
                item.scale(1 + (event.delta.x - event.delta.y) * 0.01,
                    Key.isDown('shift') ? mouseDownPoint : item.position);
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

// UI
////////////////////////////////////////////////////////////
function setupGUI() {
    gui = new dat.GUI();

    var guiActions = gui.addFolder('Actions');
    guiActions.add(paramActions, 'clear');
    guiActions.add(paramActions, 'selectAll');
    guiActions.add(paramActions, 'clearSelection');
    guiActions.add(paramActions, 'delete');
    guiActions.add(paramActions, 'resize');
    guiActions.add(paramActions, 'palettize');
    //guiActions.add(paramActions, 'drawPalette');
    ////////////////////////////////////////////////////////////
    var guiTools = gui.addFolder('Tools');
    guiTools.add(paramTools, 'activeTool', paramTools.tools)
        .onChange(function (v) {
            console.log(v);
            if (v === 'draw') {
                tool.activate();
                console.log('drawing');
            } //else { toolDraw.remove(); }

            if (v === 'select') {
                toolSelect.activate();
                console.log('selecting');
            }// else { toolSelect.remove(); }
            paramTools.defaultTool = paramTools.activeTool;
        });

    guiTools.add(paramTools, 'defaultTool', paramTools.tools).listen();


    var guiProcess = gui.addFolder('Process');
    guiProcess.add(paramProcess, 'smooth');
    guiProcess.add(paramProcess, 'smoothness', -10., 10., 0.01);
    guiProcess.add(paramProcess, 'smoothType', ['geometric', 'catmull-rom', 'bezier']);
    guiProcess.add(paramProcess, 'flatten');
    guiProcess.add(paramProcess, 'flatness', 0., 100., 0.01);
    guiProcess.add(paramProcess, 'simplify');
    guiProcess.add(paramProcess, 'simplicity', 0., 100., 0.01);
    ////////////////////////////////////////////////////////////
    var guiGenerate = gui.addFolder('Generate');
    var guiGenRndBlobs = guiGenerate.addFolder('Random Blobs');
    guiGenRndBlobs.add(paramRndBlobs, 'paths', 1, 100).step(1);
    guiGenRndBlobs.add(paramRndBlobs, 'minPoints', 1, 100).step(1);
    guiGenRndBlobs.add(paramRndBlobs, 'maxPoints', 1, 100).step(1);
    guiGenRndBlobs.add(paramRndBlobs, 'minRadius', 0., 1.).step(0.01);
    guiGenRndBlobs.add(paramRndBlobs, 'maxRadius', 0., 1).step(0.01);
    guiGenRndBlobs.add(paramRndBlobs, 'create');

    var guiGenGrid = guiGenerate.addFolder('Grid');
    guiGenGrid.add(paramGrid, 'grid');
    guiGenGrid.add(paramGrid, 'rows', 1, 100).step(1);
    guiGenGrid.add(paramGrid, 'cols', 1, 100).step(1);
    guiGenGrid.addColor(paramGrid, 'strokeColor');
    guiGenGrid.addColor(paramGrid, 'fillColor');
    guiGenGrid.add(paramGrid, 'opacity', 0., 1.).step(0.01);
    guiGenGrid.add(paramGrid, 'snap');
    guiGenGrid.add(paramGrid, 'build');

    var guiBackdrop = gui.addFolder('Backdrop');
    guiBackdrop.add(paramBackdrop, 'type', ['none', 'image', 'color', 'gradient']);
    guiBackdrop.addColor(paramBackdrop, 'fillColor');
    guiBackdrop.addColor(paramBackdrop, 'strokeColor');
    guiBackdrop.add(paramBackdrop, 'opacity', 0., 1.).step(0.01);
    guiBackdrop.add(paramBackdrop, 'create');

    //guiGenerate.open();
    //guiGenRndBlobs.open();
    ////////////////////////////////////////////////////////////
    var guiColors = gui.addFolder('Colors');
    guiColors.add(paramColors, 'apply');
    guiColors.addColor(paramColors, 'fill1');
    guiColors.add(paramColors, 'fillOpacity1', 0., 1., 0.01);
    guiColors.addColor(paramColors, 'stroke1');
    guiColors.add(paramColors, 'strokeOpacity1', 0., 1., 0.01);
    guiColors.addColor(paramColors, 'fill2');
    guiColors.add(paramColors, 'fillOpacity2', 0., 1., 0.01);
    guiColors.addColor(paramColors, 'stroke2');
    guiColors.add(paramColors, 'strokeOpacity2', 0., 1., 0.01);
    guiColors.add(paramColors, 'removeStroke');
    guiColors.add(paramColors, 'removeFill');
    guiColors.add(paramColors, 'applyStroke');
    guiColors.add(paramColors, 'applyFill');

    guiColors.open();

    ////////////////////////////////////////////////////////////
    var guiPalette = gui.addFolder('Palette');
    guiPalette.addColor(paletteInterface, 'color0');
    guiPalette.addColor(paletteInterface, 'color1');
    guiPalette.addColor(paletteInterface, 'color2');
    guiPalette.addColor(paletteInterface, 'color3');
    guiPalette.addColor(paletteInterface, 'color4');
    guiPalette.addColor(paletteInterface, 'color5');
    guiPalette.add(paletteInterface, 'prob0', 0, 1).step(0.01);
    guiPalette.add(paletteInterface, 'prob1', 0, 1).step(0.01);
    guiPalette.add(paletteInterface, 'prob2', 0, 1).step(0.01);
    guiPalette.add(paletteInterface, 'prob3', 0, 1).step(0.01);
    guiPalette.add(paletteInterface, 'prob4', 0, 1).step(0.01);
    guiPalette.add(paletteInterface, 'prob5', 0, 1).step(0.01);
    guiPalette.add(paletteInterface, 'ncolors', 1, 256).step(1);
    guiPalette.add(paletteInterface, 'build');
    guiPalette.add(paletteInterface, 'draw');
    ////////////////////////////////////////////////////////////
    var guiLayers = gui.addFolder('Layers');
    guiLayers.add(paramLayers, 'activeLayer', project.layers.map(function (l) { return l.name })).onChange(function (value) {
        project.layers.filter(function (l) { return l.name == value })[0].activate();
    }).listen();
    guiLayers.add(paramLayers, 'layer0')
        .onChange(function (v) { project.layers[0].visible = v }).listen();
    guiLayers.add(paramLayers, 'layer1')
        .onChange(function (v) { project.layers[1].visible = v }).listen();
    guiLayers.add(paramLayers, 'layer2')
        .onChange(function (v) { project.layers[2].visible = v }).listen();
    guiLayers.add(paramLayers, 'layer3')
        .onChange(function (v) { project.layers[3].visible = v }).listen();

    guiLayers.open();
}

// SETUP
//////////////////////////////////////////////////////////////////////////
function setup() {
    console.log('setup');
    // layers
    ///////////////////////////////////////////////
    project.clear();
    layers = project.layers;
    new Layer({ name: 'layer0', locked: true });
    new Layer({ name: 'layer1' });
    new Layer({ name: 'layer2' });
    new Layer({ name: 'layer3' });

    project.layers[project.layers.length - 1].activate();
    setupGUI();
    paramLayers.activeLayer = project.layers[project.layers.length - 1].name;
    paletteInterface.build();
    paramBackdrop.create();
    //paramRndBlobs.create();

    //  paramActions.selectAll();
    //paramActions.palettize();
    // project.layers[0].activate();
    // paramGrid.build();
    //drawPalette();
    project.layers[project.layers.length - 1].activate();
   // setupDrawTool();
  //  setupSelectTool();
}

function draw() {
    console.log('draw');
}

///////////////////////////////////////////////////////////////////

setup();

// document and window events
///////////////////////////////////////////////////////////////////
window.onresize = onResize;

document.addEventListener('keydown', function (e) {
    if ((e.keyCode == 71 && e.altKey)) {
        if (e.shiftKey) { gui.closed ? gui.open() : gui.close(); }
        else {
            gui.domElement.style.display = gui.domElement.style.display == 'none' ? 'block' : 'none';
        }
    }
});

