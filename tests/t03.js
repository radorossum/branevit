//const { Key } = require("paper/dist/paper-core");

//const { project } = require("paper/dist/paper-core");

window.onload = _ => {
    p=paper;
    p.install(window);
    p.setup('canvas');
    setupPaper();
    setupGUI();
    setupDrawingTools();
    sketch1();
    window.onresize();
    paperjsLayersPanel.create();
}

var layers = [];
var params = {
    //add gui button to clear the project
    clearCanvas: _ => { },

    activeTool: 'select',
    previousActiveTool: 'select',
    defaultTool: 'select',
    smoothType: 'geometric',
    smooth: 0,
    simplify: _ => { },
    flatten: 0,

    fgcolor1: '#fff',
    bgcolor1: '#aaa',
    opacity1: 0.5,
    fgcolor2: '#ddd',
    bgcolor2: '#baa',
    opacity2: .5,
    clearLayer: _ => { },
    addLayer: _ => { },
    activeLayer: 'layer3',
    visible0: true,
    visible1: true,
    visible2: true,
    visible3: true,
};

setupGUI = _ => {
    //clear gui if it exists
    if (gui) {
        gui.destroy();
    }

    ////create a dat.gui
    var gui = new dat.GUI();
    //actions, mode, tools, layers, etc.

    var actionsFolder = gui.addFolder('Actions');
    var modeFolder = gui.addFolder('Mode');
    var toolFolder = gui.addFolder('Tool');
    var layerFolder = gui.addFolder('Layer');

    // Actions ////////////////////////////////////////////////////////////////
    actionsFolder.add(params, 'clearCanvas').name('Clear Canvas')
        .onChange(setupPaper);
    actionsFolder.add(params, 'smoothType', ['geometric', 'asymmetric', 'continuous', 'catmull-rom'])
        .name('Smooth Type')
    actionsFolder.add(params, 'smooth', -10., 10., 0.01)
        .onChange(_ => {
            p.project.selectedItems.forEach(item => {
                item.smooth({ type: params.smoothType, factor: params.smooth });
            });
        }
        ).listen();
    actionsFolder.add(params, 'simplify').onChange(
        v => {
            p.project.selectedItems.forEach(item => {
                item.simplify();
            });
        }
    );
    actionsFolder.add(params, 'flatten', 0, 100, 0.1).onChange(
        v => {
            p.project.selectedItems.forEach(item => {
                item.flatten(params.flatten);
            });
        }
    ).listen();


    // Mode //////////////////////////////////////////////////////////////////

    // Tool //////////////////////////////////////////////////////////////////


    layerFolder.add(params, 'activeTool',
        ['draw', 'edit', 'select', 'erase']).name('mode')
        .onChange(value => {
            params.defaultTool = value;
            // console.log(params.activeTool + ' ' + params.previousActiveTool);
        }).listen();

    //add color picker for foreground color
    toolFolder.addColor(params, 'fgcolor1').name('fgcolor1');
    toolFolder.addColor(params, 'bgcolor1').name('bgcolor1');
    toolFolder.add(params, 'opacity1', 0., 1.).name('opacity1');
    toolFolder.addColor(params, 'fgcolor2').name('fgcolor2');
    toolFolder.addColor(params, 'bgcolor2').name('bgcolor2');
    toolFolder.add(params, 'opacity2', 0., 1.).name('opacity2');

    layerFolder.add(params, 'clearLayer').name('clear').onChange(_ => {
        p.project.activeLayer.clear();
    });

   // add a button to the gui to add a new layer
    layerFolder.add(params, 'addLayer').name('add layer').onChange(_ => {
        var newLayer = new paper.Layer({
            name: 'layer' + (layers.length),
            visible: true,
            opacity: 1,
            locked: false,
            color: '#ff0000'
        });

        newLayer.activate();
        // console.log(layers.map(l => l.name));
        layerlist.remove();
        layerlist = layerFolder.add(params, 'activeLayer',
            layers.map(l => l.name)).name('layer')
            .onChange(updateActiveLayer).listen();
    });

    //update the dropdown menu choices with the names of the layers
    function updateLayerList(name) {
        p.project.activeLayer = layers.find(l => l.name == name);
        let l = layers.find(l => l.name === value);
        // console.log(value + " " + l.name + " " + paper.project.activeLayer.name);
    }

    function updateActiveLayer(name) {
        let newactivelayer = layers.find(l => l.name === name);
        newactivelayer.activate();
        //(newactivelayer.name + " " + paper.project.activeLayer.name);
    }

    const layerlist = layerFolder.add(params, 'activeLayer',
        p.project.layers.map(l => l.name)).
        name('layer').onChange(updateActiveLayer).listen();

    //add checkbox for layer1 visibility
    layerFolder.add(params, 'visible0').name('layer0').onChange(v => layers[0].visible = v);
    layerFolder.add(params, 'visible1').name('layer1').onChange(v => layers[1].visible = v);
    layerFolder.add(params, 'visible2').name('layer2').onChange(v => layers[2].visible = v);
    layerFolder.add(params, 'visible3').name('layer3').onChange(v => layers[3].visible = v);

    layerFolder.open();

    //gui.domElement.style.display = 'none';
    //setup keybinding for alt+v or shif+esc to toggle dat.gui visibility on/off
    document.addEventListener('keydown', e => {
        if ( /*((e.keyCode == 27 && e.shiftKey)) ||*/ (e.keyCode == 86 && e.altKey)) {
            gui.domElement.style.display = gui.domElement.style.display == 'none' ? 'block' : 'none';
        }
    });
}

//on resize window rebuild the paper project
window.onresize = _ => {
    p.view.viewSize = new p.Size(window.innerWidth, window.innerHeight);
};

function setupPaper() {
    //clear the paper project
    p.project.clear();

    layers = p.project.layers;

    new p.Layer({
        name: 'layer0',
        visible: true,
        opacity: 1,
        locked: true,
        color: 'none'
    });

    new p.Layer({
        name: 'layer1',
        visible: true,
        opacity: 1,
        locked: false,
        color: '#ffff00'
    });
    new p.Layer({
        name: 'layer2',
        visible: true,
        opacity: 1,
        locked: false,
        color: 'none'
    });

    new p.Layer({
        name: 'layer3',
        visible: true,
        opacity: 1,
        locked: false,
        color: '#ffff00'
    });
}

////////////////////////////////////////////////////////////////////////////////
//// draw background grid
function drawBackgroundGrid(n = 20, fgcolor = 'black', bgcolor = 'grey', fgopacity = 1, bgopacity = 1) {
    //draw a square n x n grid with thin black lines on the background layer
    //const n = 20;
    const viewsize = p.view.size;
    const grid = new p.Path.Rectangle({
        rectangle: [0, 0,
            p.view.size.width, p.view.size.height],
        fillColor: bgcolor,
        strokeColor: 'none',
        opacity: bgopacity
    }).sendToBack();
    let aspect = p.view.size.width / p.view.size.height;
    aspect = 1;
    let gridstep = { x: n, y: n };
    let nsteps = Math.max(p.view.size.width, p.view.size.height) /
        Math.min(gridstep.x, gridstep.y);

    for (let i = 0; i < nsteps; i++) {
        let x = i * gridstep.x;
        let y = aspect * i * gridstep.y;
        let line = new p.Path.Line({
            from: [x, 0],
            to: [x, p.view.size.height],
            strokeColor: fgcolor,
            opacity: fgopacity,
            strokeWidth: 1
        });
        // line.sendToFront();
        let line2 = new p.Path.Line({
            from: [0, y],
            to: [p.view.size.width, y],
            strokeColor: fgcolor,
            opacity: fgopacity,
            strokeWidth: 1
        });
        //line2.sendToBack();
    }

}
/////////////////////////////////////////////////////////////////////////////
//// setup drawing tools

var hitOptions = {
    segments: true,
    stroke: true,
    fill: true,
    tolerance: 5
};

function setupDrawingTools() {
    //create a new tool for drawing
    var tool = new p.Tool();
    tool.minDistance = 10;
    var toolPath;
    var mouseDownPoint = null;
    var mouseUpPoint = null;
    var selectionPath;


    //loop over all selected items in the active layer and remove them
    tool.onKeyDown = e => {

        // select is the default tool 
        params.activeTool = [params.defaultTool, 'select', 'draw', 'edit', 'erase'][
            ['q', 'd', 'e', '\\'].indexOf(e.key) + 1
        ];

        if (params.activeTool == 'select') {
            // clear the selection
            if (e.key == 'a' && e.modifiers.control) {
                //clear the selection
                p.project.selectedItems.forEach(
                    item => item.selected = false
                );
            }
            // select all
            if (e.key == 'a' && e.modifiers.shift) {
                //iterate for all items in the active layer
                p.project.activeLayer.children.forEach(
                    item => item.fullySelected = true);
                //paper.project.activeLayer.fullySelected = true;
            }
            // remove selected items
            if (['x', 'delete', 'backspace'].includes(e.key)) {
                p.project.selectedItems.forEach(e => {
                    e.remove();
                });
            }
        }
    };

    tool.onKeyUp = e => {
        if (['q', 'd', 'e', '\\'].includes(e.key)) {
            params.activeTool = params.defaultTool;
        }
    };


    ////////////////////////////////////////////////////////////////////////////
    var lastSelectedPath;
    var lastSelectedSegment;
    var movePath;
    var segment,path;
    tool.onMouseDown = e => {

        if (selectionPath) selectionPath.remove();
        //console.log(params.activeTool);
        if (params.activeTool == 'draw') {

            // if (toolPath) toolPath.selected = false;

            toolPath = new p.Path();
            toolPath.strokeColor = params.fgcolor1;
            toolPath.fillColor = null;
            //set toolpath opacity to params.opacity1
            toolPath.opacity = params.opacity1;
            toolPath.strokeWidth = 1;
            //toolPath.fullySelected = true;
            toolPath.closed = false;

        } else if (params.activeTool == 'select') {
            if (selectionPath) selectionPath.remove();
            selectionPath = new Path();
            if (e.item) {
                if (e.modifiers.shift) {
                    // e.item.selected = true;
                    e.item.selected = !e.item.selected;
                } else {
                    //clear the selection
                    p.project.activeLayer.selected = false;
                    //toolPath.selected = false;
                    e.item.selected = true;

                    //e.item.selected = !e.item.selected;
                }
            } else {
                //if (!e.modifiers.shift) paper.project.activeLayer.selected = false;

                selectionPath.strokeColor = 'teal';
                selectionPath.fillColor = 'teal';
                selectionPath.opacity = 0.5;
                selectionPath.selected = true;
                selectionPath.closed = true;
                p.project.activeLayer.selected = false;
            }

        } else if (params.activeTool == 'edit') {
            segment=path=null;
            var hitResult = p.project.hitTest(e.point, hitOptions);
            if (!hitResult) {

                return false;
            } else {
                console.log(hitResult);
            }

            if (e.modifiers.shift) {
                if (hitResult.type == 'segment') {
                    console.log('removing segment');
                    hitResult.segment.remove();
                };
                return;
            } else {
                if (hitResult) {
                    path = hitResult.item;
                    if (hitResult.type == 'segment') {
                        segment = hitResult.segment;
                    } else if (hitResult.type == 'stroke') {
                        var location = hitResult.location;
                        segment = path.insert(location.index + 1, e.point);
                        path.smooth();
                    }
                }
            }
            movePath = hitResult.type == 'fill';
            if (movePath) {
                p.project.activeLayer.addChild(hitResult.item);
            }
        } else {


        }

    };

    tool.onMouseDrag = e => {
        if (params.activeTool == 'draw') {
            toolPath.add(e.point);
        } else if (params.activeTool == 'select') {
            if (e.item) {
                if (p.Key.isDown('s')) {
                    p.project.selectedItems.forEach(
                        item => {
                            item.simplify();
                            //item.smooth({ type: 'continuous', factor: .9 });
                        }
                    )
                }
            } else {
                if (selectionPath) {
                    selectionPath.add(e.point);
                } else {
                    selectionPath = new Path();
                    selectionPath.add(e.point);
                }

            }
        }
    }

    tool.onMouseMove = e => {
        if (params.activeTool == 'edit') {
            project.activeLayer.selected = false;
            if (e.item)
                e.item.selected = true;
        }
        //  if (params.activeTool == 'draw') {
        // project.activeLayer.selected = false;
        // if (e.item) {
        //     e.item.selected = true;
        //     selectedPath = event.item;
        // } else {
        //     selectedPath = null;
        // }
        //}
    };

    tool.onMouseUp = e => {
        if (params.activeTool == 'draw') {

            toolPath.add(e.point);

            //toolPath.smooth();
            if (e.modifiers.shift) {
                toolPath.closed = true;
                toolPath.fillColor = params.bgcolor1;
            } else {
                toolPath.fillColor = null;
            }

            //toolPath.smooth({ type: 'continuous', factor: .9 });
            //toolPath.simplify();
            toolPath.selected = false;
            // toolPath = null;
        }
        if (params.activeTool == 'erase') {
            console.log('erase');
            if (e.item)
                e.item.remove();

        }
        if (params.activeTool == 'select') {
            if (e.item) {
                p.project.activeLayer.children.forEach(
                    item => {
                        if (selectionPath.intersects(item)) {
                            //if (selectionPath.intersect(item) !=null) {
                            //item.selected = true;
                            item.selected = !item.selected;
                        }
                    }
                );
                selectionPath.remove();
                selectionPath = null;
            } else {
                selectionPath.add(e.point);
                //select all items contained in the selection path
                if (selectionPath.length > 1) {
                    // selectionPath.simplify();
                    p.project.activeLayer.children.forEach(
                        item => {
                            if (item.isInside(selectionPath.bounds)) {
                                item.selected = true;
                            }
                        }
                    );
                    selectionPath.remove();
                    selectionPath = null;

                }
                // paper.project.selectedItems.forEach(
                //     item => item.selected = false
                // );
                //  selectionPath = null;;
            }


        }

        if (params.activeTool == 'edit') {
            if (segment) {
                segment.point += e.delta;
                path.smooth();
            } else if (path) {
                path.position += e.delta;
            }
        }

    };
}

/////////////////////////////////
//// sketch 1
const sketch1 = _ => {
    layers[0].activate();
    drawBackgroundGrid(100, '#222', 'black');
    //lock layer 0
    layers[0].locked = true;
    layers[layers.length - 1].activate();
}

