
window.onload = _ => {
    paper.install(window);
    paper.setup('canvas');
    window.onresize();
    setupPaper();
    setupGUI();
    setupDrawingTools();
    sketch1();
}

var layers = [];
var params = {
    activeTool: 'select',
    previousActiveTool: 'select',
    defaultTool: 'select',


    fgcolor1: '#fff',
    bgcolor1: '#aaa',
    opacity1: 0.5,
    fgcolor2: '#ddd',
    bgcolor2: '#baa',
    opacity2: .5,
    clearCanvas: _ => { },
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
    //actions
    //mode
    //tool
    //layer
    //create a folder for the params 
    var actionsFolder = gui.addFolder('Actions');
    var modeFolder = gui.addFolder('Mode');
    var toolFolder = gui.addFolder('Tool');
    var layerFolder = gui.addFolder('Layer');

    toolFolder.add(params, 'activeTool',
        ['draw', 'edit', 'select', 'erase']).name('mode')
        .onChange(value => {
            // console.log(params.activeTool + ' ' + params.previousActiveTool);
        }).listen();
    //add color picker for foreground color
    toolFolder.addColor(params, 'fgcolor1').name('fgcolor1');
    toolFolder.addColor(params, 'bgcolor1').name('bgcolor1');
    toolFolder.add(params, 'opacity1', 0., 1.).name('opacity1');
    toolFolder.addColor(params, 'fgcolor2').name('fgcolor2');
    toolFolder.addColor(params, 'bgcolor2').name('bgcolor2');
    toolFolder.add(params, 'opacity2', 0., 1.).name('opacity2');

    layerFolder.add(params, 'clearCanvas').name('clear').onChange(_ => {
        paper.project.activeLayer.clear();
    });

    //add a button to the gui to add a new layer
    layerFolder.add(params, 'addLayer').name('add layer').onChange(_ => {
        var newLayer = new paper.Layer({
            name: 'layer' + (layers.length),
            visible: true,
            opacity: 1,
            locked: false,
            color: '#ff0000'
        });

        layers.push(newLayer);
        newLayer.activate();

        // console.log(layers.map(l => l.name));
        layerlist.remove();
        layerlist = layerFolder.add(params, 'activeLayer',
            layers.map(l => l.name)).name('layer')
            .onChange(updateActiveLayer).listen();
    });

    //update the dropdown menu choices with the names of the layers
    const updateLayerList = name => {
        paper.project.activeLayer = layers.find(l => l.name == name);
        let l = layers.find(l => l.name === value);
        // console.log(value + " " + l.name + " " + paper.project.activeLayer.name);

    };

    const updateActiveLayer = name => {
        let newactivelayer = layers.find(l => l.name === name);
        newactivelayer.activate();
        //(newactivelayer.name + " " + paper.project.activeLayer.name);
    }

    const layerlist = layerFolder.add(params, 'activeLayer',
        paper.project.layers.map(l => l.name)).
        name('layer').onChange(updateActiveLayer).listen();

    //add checkbox for layer1 visibility
    layerFolder.add(params, 'visible0').name('layer0').onChange(v => layers[0].visible = v);
    layerFolder.add(params, 'visible1').name('layer1').onChange(v => layers[1].visible = v);
    layerFolder.add(params, 'visible2').name('layer2').onChange(v => layers[2].visible = v);
    layerFolder.add(params, 'visible3').name('layer3').onChange(v => layers[3].visible = v);

    layerFolder.open();

    // gui.domElement.style.display = 'none';
    //setup keybinding for alt+v or shif+esc to toggle dat.gui visibility on/off
    document.addEventListener('keydown', e => {
        if (((e.keyCode == 27 && e.shiftKey)) || (e.keyCode == 86 && e.altKey)) {
            gui.domElement.style.display = gui.domElement.style.display == 'none' ? 'block' : 'none';
        }
    });


};

//on resize window rebuild the paper project
window.onresize = _ => {
    paper.view.viewSize = new paper.Size(window.innerWidth, window.innerHeight);
};

const setupPaper = _ => {
    //clear the paper project
    paper.project.clear();

    layers = paper.project.layers;

    new paper.Layer({
        name: 'layer0',
        visible: true,
        opacity: 1,
        locked: true,
        color: 'none'
    });

    new paper.Layer({
        name: 'layer1',
        visible: true,
        opacity: 1,
        locked: false,
        color: '#ffff00'
    });
    new paper.Layer({
        name: 'layer2',
        visible: true,
        opacity: 1,
        locked: false,
        color: 'none'
    });

    new paper.Layer({
        name: 'layer3',
        visible: true,
        opacity: 1,
        locked: false,
        color: '#ffff00'
    });
}

////////////////////////////////////////////////////////////////////////////////
//// draw background grid
const drawBackgroundGrid = (n = 20, fgcolor = 'black', bgcolor = 'grey', fgopacity = 1, bgopacity = 1) => {
    //draw a square n x n grid with thin black lines on the background layer
    //const n = 20;
    console.log(n);
    const viewsize = paper.view.size;
    const grid = new paper.Path.Rectangle({
        rectangle: [0, 0,
            paper.view.size.width, paper.view.size.height],
        fillColor: bgcolor,
        strokeColor: 'none',
        opacity: bgopacity
    }).sendToBack();
    let aspect = paper.view.size.width / paper.view.size.height;
    aspect = 1;
    let gridstep = { x: n, y: n };
    let nsteps = Math.max(paper.view.size.width, paper.view.size.height) /
        Math.min(gridstep.x, gridstep.y);

    for (let i = 0; i < nsteps; i++) {
        let x = i * gridstep.x;
        let y = aspect * i * gridstep.y;
        let line = new paper.Path.Line({
            from: [x, 0],
            to: [x, paper.view.size.height],
            strokeColor: fgcolor,
            opacity: fgopacity,
            strokeWidth: 1
        });
        // line.sendToFront();
        let line2 = new paper.Path.Line({
            from: [0, y],
            to: [paper.view.size.width, y],
            strokeColor: fgcolor,
            opacity: fgopacity,
            strokeWidth: 1
        });
        //line2.sendToBack();
    }

}
/////////////////////////////////////////////////////////////////////////////
//// setup drawing tools
const setupDrawingTools = _ => {
    //create a new tool for drawing
    var drawTool = new paper.Tool();
    drawTool.minDistance = 10;
    var drawToolPath;

    //document keybind'q' to change params.activeTool to select
    document.addEventListener('keydown', e => {
        params.previousActiveTool = params.activeTool;
        if (e.key == 'q') {
            params.activeTool = 'select';
        }
        if (e.key == 'd') {
            params.activeTool = 'draw';
        }
        if (e.key == 'x') {
            params.activeTool = 'erase';
        }
        if (e.key == 'e') {
            params.activeTool = 'edit';
        }
        // console.log(params.activeTool + " " + params.previousActiveTool);
    });

    document.addEventListener('keyup', e => {
        if (['q', 'd', 'e', 'x'].includes(e.key)) {
            params.activeTool = params.defaultTool;
            // console.log(params.activeTool + " " + params.previousActiveTool);
        }
    });




    drawTool.onMouseDown = e => {
        if (params.activeTool == 'draw') {
            if (drawToolPath) drawToolPath.selected = false;

            drawToolPath = new paper.Path();
            drawToolPath.strokeColor = params.fgcolor1;
            drawToolPath.fillColor = params.bgcolor1;
            //set drawtoolpath opacity to params.opacity1
            drawToolPath.opacity = params.opacity1;

            drawToolPath.strokeWidth = 1;
            drawToolPath.fullySelected = true;
            drawToolPath.closed = false;
        } else if (params.activeTool == 'select') {
            //if the user presses 'a' key, add all paths to the selection


            if (e.key == 'a') {
                paper.project.activeLayer.selected = true;
                console.log('selecting all');
            }


            if (e.item) {
                e.item.selected = !e.item.selected;
            }

        }
    };

    drawTool.onMouseDrag = e => {
        if (params.activeTool == 'draw') {
            drawToolPath.add(e.point);
        } else if (params.activeTool == 'select') {
            if (e.item) {
                if (e.key == 's') {
                    //smooth e.item by the mouse delta

                    e.item.smooth(
                        { type: 'continuous', factor: .9 }
                    );




                }
            }
        }


    };

    drawTool.onMouseMove = e => {
        //  if (params.activeTool == 'draw') {
        // project.activeLayer.selected = false;
        // if (e.item) {
        //     e.item.selected = true;
        //     selectedPath = event.item;
        // } else {
        //     selectedPath = null;
        // }

        //}
    }

    //loop over all selected items in the active layer and remove them
    drawTool.onKeyDown = e => {
        if (params.activeTool == 'select') {
            if (e.key == 'Backspace') {
                d
                paper.project.selectedItems.forEach(e => {
                    e.remove();
                });
            }
        }
    }

    //remove all selected items in the active layer
    //document keybind 'delete' to remove selected items
    document.addEventListener('keydown', e => {

        if (e.key == 'Delete' || e.key == 'Backspace') {
            paper.project.selectedItems.forEach(e => {
                e.remove();
            });
        }
    }
    );

    drawTool.onMouseUp = e => {
        if (params.activeTool == 'draw') {

            drawToolPath.add(e.point);

            //drawToolPath.smooth();
            drawToolPath.closed = true;

            drawToolPath.smooth({ type: 'continuous', factor: .9 });
            drawToolPath.simplify();
            drawToolPath.selected = false;
            // drawToolPath = null;
        } else if (params.activeTool == 'erase') {
            console.log('erase');
            if (e.item) e.item.remove();
        }

    };
}
/////////////////////////////////
//// sketch 1
const sketch1 = _ => {
    layers[0].activate();
    drawBackgroundGrid(100, 'grey', 'black');
    //lock layer 0
    layers[0].locked = true;
    layers[3].activate();
    //layers[1].activate();
    //drawBackgroundGrid(100, 'yellow');

}
