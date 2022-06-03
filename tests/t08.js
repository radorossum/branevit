let gui;

window.onload = () => {
    // Setup Paper
    p = paper;
    p.setup(document.querySelector('canvas'));
    p.install(window);

    gui = new dat.GUI();



    // Tool Path, draws paths on mouse-drag.
    // Note: Wrap each Tool in an IIFE to avoid polluting the 
    //       global scope with variables related with that Tool.



    setupTools();
    setupLayers();
    setupGUI();

    paperjsLayersPanel.create(
        {
            title: 'layers',
            //draggable:true,
            callback: function (panel) {
                console.log(panel);
            }
        }
    );
    console.log(paperjsLayersPanel);

}


function setupLayers() {
    // Create a new Layer
    const layer = new p.Layer();
    layer.name = 'Layer 0';
    // p.project.addLayer(layer);
    p.project.activeLayer = layer;

    p.project.layerInterface = {
        layerNames: _ => {
            p.project.layers.map(l => l.name);
        },
        add: () => {
            const layer = new p.Layer();
            //find the layer name with the largest trailing number in the layer.name
            if (p.project.layers.length === 0) {
                layer.name = 'Layer 0';
            }
           
            //find the largest of the trailing numbers in the layer names and add one

            let largest = 0;
            p.project.layers.forEach(l => {
                if (l.name != null) {
                    let num = parseInt((l.name || "0").match(/\d+$/));
                    if (num > largest) largest = num;
                }
            });
            layer.name = 'Layer ' + (largest + 1);

           // p.project.insertLayer(p.project.activeLayer.index, layer);




            // layer.name = 'Layer ' + (p.project.layers.length - 1);
            p.project.activeLayer = layer
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

    }

}
function setupTools() {
    p.tools.activeTool = 'line';

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
}

function setupGUI() {


    const guiToolFolder = gui.addFolder('Tools');
    guiToolFolder.add(p.tools, 'activeTool', p.tools.map(t => t.name))
        .name('active tool')
        .onChange(name => { // find named tool
            const tool = p.tools.find(tool => tool.name === name)
            tool.activate()
        })

    guiToolFolder.open();

    const guiLayerFolder = gui.addFolder('Layers');
    //add button to add a new layer

    let updateName = (name) => {
        let l = p.project.layers.find(l => l.name === name);
        l.activate();
        console.log(p.project.activeLayer.name);
    }


    let updateList =
        () => {
            guiCurrentLayer.remove();
            let layerNames = p.project.layers.map(l => l.name).reverse();
            //reverse order of layerNames

            guiCurrentLayer = guiLayerFolder.add(p.project.layerInterface, 'current',
                layerNames).onChange(updateName).listen();


            p.project.layerInterface.current = p.project.activeLayer.name;
            //guiLayerName.updateDisplay();
            console.log(p.project.activeLayer.name);
        };
    guiLayerFolder.add(p.project.layerInterface, 'add').onFinishChange(updateList);
    guiLayerFolder.add(p.project.layerInterface, 'remove').onFinishChange(updateList);
    guiLayerFolder.add(p.project.layerInterface, 'moveUp').onFinishChange(updateList);
    guiLayerFolder.add(p.project.layerInterface, 'moveDown').onFinishChange(updateList);
    guiLayerFolder.add(p.project.layerInterface, 'locked')
        .onChange(_ => p.project.activeLayer.locked = _);
    guiLayerFolder.add(p.project.layerInterface, 'visible')
        .onChange(_ => p.project.activeLayer.visible = _);
    guiLayerFolder.add(p.project.layerInterface, 'selected')
        .onChange(_ => p.project.activeLayer.selected = _);
    guiLayerFolder.add({ showPanel: () => paperjsLayersPanel.create() }, 'showPanel');
    // const guiLayerName = guiLayerFolder.add(p.project.activeLayer, 'name').listen();



    let guiCurrentLayer = guiLayerFolder.add(p.project.layerInterface, 'current',
        p.project.layers.map(l => l.name)).onFinishChange(updateName).listen();
    p.project.layerInterface.current = p.project.activeLayer.name;

    // guiLayerFolder.add(p.project.activeLayer.interface,'current', p.project.interface.layerNames())
    //     .name('active layer')
    //     .onChange(name => { // find named layer
    //         const layer = p.project.layers.find(layer => layer.name === name)
    //         if(layer) layer.activate(); 
    //     });
    guiLayerFolder.open();
}