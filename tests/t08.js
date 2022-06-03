
let gui;

window.onload = () => {
    // Setup Paper
    p = paper;
    pp = paper.project;
    canvas = document.querySelector('canvas');
    p.setup(canvas);
    p.install(window);


    gui = new dat.GUI();

    setupTools();
    setupLayers();
    setupGUI();

}

function setupLayers() {
    p.blendModes = ['normal', 'multiply', 'screen', 'overlay', 'soft-light', 'hard- light', 'color-dodge', 'color-burn', 'darken', 'lighten', 'difference', 'exclusion', 'hue', 'saturation', 'luminosity', 'color', 'add', 'subtract', 'average', 'pin-light', 'negation', 'source-over', 'source-in', 'source-out', 'source-atop', 'destination-over', 'destination-in', 'destination-out', 'destination-atop', 'lighter', 'darker', 'copy', 'xor'];

    p.project.layerInterface = {
        layerNames: _ => {
            p.project.layers.map(l => l.name);
        },
        add: () => {
            p.project.insertLayer(p.project.activeLayer.index + 1, layer = new p.Layer());
            if (p.project.layers.length === 0) {
                layer.name = 'Layer 0';
            }

            let largest = 0;
            p.project.layers.forEach(l => {
                if (l.name != null) {
                    let num = parseInt((l.name || "0").match(/\d+$/));
                    if (num > largest) largest = num;
                }
            });
            layer.name = 'Layer ' + (largest + 1);
            layer.activate();

        },
        remove: () => {
            p.project.activeLayer.remove()
            console.log(p.project.layers.map(l => l.name));

        },
        moveUp: () => {
            let l = p.project.activeLayer;
            p.project.activeLayer.moveAbove(p.project.activeLayer.nextSibling)
            l.activate();
        },
        moveDown: () => {
            let l = p.project.activeLayer;
            p.project.activeLayer.moveBelow(p.project.activeLayer.previousSibling)
            l.activate();

        },
        locked: false,
        visible: true,
        selected: false,
        current: '_',
        name: '...',
        opacity: 1.,
        style: '',

    }
    // Create a new Layer

    let layer = new p.Layer({ name: 'Layer 0' });

}

function setupTools() {

    (() => {
        const tool = new p.Tool();
        tool.name = 'pan';

        let oldPointViewCoords;


        tool.onMouseDown = e => {
            oldPointViewCoords = p.view.projectToView(e.point);
        }

        tool.onMouseDrag = e => {
            const delta = e.point.subtract(p.view.viewToProject(oldPointViewCoords));
            oldPointViewCoords = p.view.projectToView(e.point);
            p.view.translate(delta);
        }
    })();


    (() => {
        const tool = new p.Tool();
        tool.name = 'draw';
        tool.minDistance = 10;
        let path;
        let selectionPath;
        let mouseDownPoint, mouseUpPoint;

        tool.onMouseDown = function (event) {
            path = new p.Path();
            // path.strokeColor = paramPalette.randomColor();
            path.strokeColor = p.Color.random();
            path.strokeWidth = 1;
            mouseDownPoint = event.point;
            path.add(mouseDownPoint);
        }

        tool.onMouseDrag = function (event) {
            path.add(event.point);
        }

        tool.onMouseUp = function (event) {
            mouseUpPoint = event.point;
            path.add(mouseUpPoint);
            path.smooth();
            if (event.modifiers.alt)
                path.closed = true;
            path.simplify();
            // toolPath.removeOnDrag();
            path = null;
        }
    })();

    (() => {
        const tool = new p.Tool()
        tool.name = 'line'
        let path
        tool.onMouseDown = (e) => {
            path = new p.Path()
            path.strokeColor = '#424242'
            path.strokeWidth = 4
            path.add(e.point)
        }

        tool.onMouseDrag = function (event) {
            path.add(event.point)
        }
    })();

    (() => {
        const tool = new p.Tool()
        tool.name = 'dot'

        let path

        tool.onMouseDown = function (event) {
            path = new p.Path.Circle({
                center: event.point,
                radius: 30,
                fillColor: '#9C27B0'
            })
        }
    })();

    p.tools.activeTool = 'draw';

    p.tools.setActiveTool = (name) => {
        p.tools.activeTool = name;
        const tool = p.tools.find(tool => tool.name === name);
        tool.activate();
    };
    p.tools.setActiveTool(p.tools.activeTool); // activate the tool
}

function setupGUI() {
    // Pinch-to-zoom
    if (p.DomEvent) {
        // canvas.on('wheel', function (event) {
        //     var e = event,
        //         view = p.scope.view,
        //         offset = canvas.offset(),
        //         point = view.viewToProject(
        //             p.DomEvent.getPoint(e).subtract(offset.left, offset.top)
        //         ),
        //         delta = e.deltaY || 0,
        //         scale = 1 - delta / 100;
        //     p.view.scale(scale, point); 
        //     return false; 
        // }); 
        

        //add event handler on mousewheel to canvas
        canvas.addEventListener('wheel', function (event) {
            var e = event,
                view = p.view,
                //offset = canvas.offset(),
                point = p.view.viewToProject(
                    p.DomEvent.getPoint(e).subtract(canvas.offsetLeft, canvas.offsetTop)
                ),
                delta = e.deltaY || 0,
                scale = 1 - delta / 100;
            view.scale(scale, point);
            return false;
        }); 


    }

    const guiToolFolder = gui.addFolder('Tools');
    guiToolFolder.add(p.tools, 'activeTool', p.tools.map(t => t.name))
        .name('active tool')
        .onChange(_ => p.tools.setActiveTool(_)).listen();


    guiToolFolder.open();

    const guiLayerFolder = gui.addFolder('Layers');
    //add button to add a new layer

    let updateName = (name) => {
        let l = p.project.layers.find(l => l.name === name);
        l.activate();
        p.project.layerInterface.name = p.project.activeLayer.name;

        guiLayerBlendMode.setValue(p.project.activeLayer.blendMode);
        p.project.layerInterface.opacity = p.project.activeLayer.opacity;
        p.project.layerInterface.style = p.project.activeLayer.style;
        // guiLayerName.setValue(l.name);
        console.log(p.project.activeLayer.name);
    }


    let updateList =
        () => {
            guiCurrentLayer.remove();
            let layerNames = p.project.layers.map(l => l.name).reverse();
            guiCurrentLayer = guiLayerFolder.add(p.project.layerInterface, 'current',
                layerNames).onChange(updateName).listen();

            p.project.layerInterface.current = p.project.activeLayer.name;
            //guiLayerBlendMode.setValue(p.project.activeLayer.blendMode);
            // guiLayerBlendMode.updateDisplay();
            // console.log(p.project.activeLayer.name);


        };
    guiLayerFolder.add(p.project.layerInterface, 'add').onFinishChange(updateList);
    guiLayerFolder.add(p.project.layerInterface, 'remove').onFinishChange(updateList);
    guiLayerFolder.add(p.project.layerInterface, 'moveUp').onFinishChange(updateList);
    guiLayerFolder.add(p.project.layerInterface, 'moveDown').onFinishChange(updateList);
    let guiLayerName = guiLayerFolder.add(p.project.layerInterface, 'name')
        .onChange(_ => {
            p.project.layerInterface.current = _;
            p.project.activeLayer.name = _
        }).listen();

    let guiLayerBlendMode = guiLayerFolder.add(p.project.activeLayer, 'blendMode', p.blendModes).onChange(

        _ => {
            p.project.activeLayer.blendMode = _;
            guiLayerBlendMode.updateDisplay();
        }).listen();
    let guiLayerOpacity = guiLayerFolder.add(p.project.layerInterface, 'opacity', 0., 1.).onChange(_ => p.project.activeLayer.opacity = _).listen();
    // guiLayerFolder.add(p.project.layerInterface, 'locked')
    //     .onChange(_ => p.project.activeLayer.locked = _);
    // guiLayerFolder.add(p.project.layerInterface, 'visible')
    //     .onChange(_ => p.project.activeLayer.visible = _);
    // guiLayerFolder.add(p.project.layerInterface, 'selected')
    //     .onChange(_ => p.project.activeLayer.selected = _);

    // guiLayerFolder.add()   
    guiLayerFolder.add({
        layerPanel: () => paperjsLayersPanel.create({
            title: '', draggable: true
        })
    }, 'layerPanel').name('layer panel');

    let guiCurrentLayer = guiLayerFolder.add(p.project.layerInterface, 'current',

        p.project.layers.map(l => l.name)).onFinishChange(updateName).listen();

    p.project.layerInterface.current = p.project.activeLayer.name;
    p.project.layerInterface.name = p.project.activeLayer.name;

    // guiLayerFolder.add(p.project.activeLayer.interface,'current', p.project.interface.layerNames())
    //     .name('active layer')
    //     .onChange(name => { // find named layer
    //         const layer = p.project.layers.find(layer => layer.name === name)
    //         if(layer) layer.activate(); 
    //     });
    guiLayerFolder.open();
}