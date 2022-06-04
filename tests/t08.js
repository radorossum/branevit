
let gui;

window.onload = _ => {
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


window.onresize = paper.onResize = _ => {
    paper.view.viewSize = new Size(window.innerWidth, window.innerHeight);
    console.log("resized to " + view.viewSize.width + "," + view.viewSize.height)
}

function setupLayers() {
    let layer = p.project.activeLayer;
    layer.name = "Layer 0";
    p.blendModes = ['normal', 'multiply', 'screen', 'overlay', 'soft-light', 'hard- light', 'color-dodge', 'color-burn', 'darken', 'lighten', 'difference', 'exclusion', 'hue', 'saturation', 'luminosity', 'color', 'add', 'subtract', 'average', 'pin-light', 'negation', 'source-over', 'source-in', 'source-out', 'source-atop', 'destination-over', 'destination-in', 'destination-out', 'destination-atop', 'lighter', 'darker', 'copy', 'xor'];

    p.project.layerInterface = {
        layerNames: _ => {
            p.project.layers.map(l => l.name);
        },
        add: _ => {
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
        remove: _ => {
            p.project.activeLayer.remove()
            console.log(p.project.layers.map(l => l.name));

        },
        moveUp: _ => {
            let l = p.project.activeLayer;
            p.project.activeLayer.moveAbove(p.project.activeLayer.nextSibling)
            l.activate();
        },
        moveDown: _ => {
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



}

function setupTools() {
    // edit tool
    (_ => {
        let tool = new p.Tool({ name: 'edit' });
        let hitOptions = {
            segments: true,
            stroke: true,
            fill: true,
            tolerance: 10
        };

        let selectedSegment, selectedPath;
        let movePath = false;
        let mouseDownPoint = null;


        tool.onKeyDown = e => {
            // if (e.key == 'escape') {
            //     if (e.modifiers.shift) {
            //         p.project.activeLayer.children.forEach(c => {
            //             c.selected = !c.selected;
            //         });
            //         return;
            //     }
            //     if (e.modifiers.control) {
            //         p.project.activeLayer.selected = false;
            //         return;
            //     }
            //     p.project.selectedItems.forEach(c => {
            //         c.selected = false;
            //     });

            // }

            // if (e.key == 'delete' || e.key == 'backspace') {
            //     p.project.selectedItems.forEach(v => v.remove());
            // }
        }

        tool.onMouseDown = e => {
            selectedSegment = selectedPath = null;
            mouseDownPoint = e.point.clone();

            let hitResult = p.project.hitTest(e.point, hitOptions);
            if (!hitResult && !e.modifiers) {
                p.project.activeLayer.selected = false;
                return;
            }

            if (e.modifiers.meta) {
                p.project.activeLayer.selected = false;
            }
            if (e.modifiers.alt) {
                if (hitResult.type == 'segment') {
                    hitResult.segment.remove();
                } else if (hitResult.type == 'stroke') {
                    hitResult.item.selected = false;

                } else if (hitResult.type == 'fill') {
                    hitResult.item.selected = false;
                }
                return;
            }

            if (hitResult) {
                //hitResult.selected = true;

                if (e.item) {
                    // event.item.selected = true;
                    hitResult.item.selected = true;
                    // event.item.selected = !event.item.selected;
                }

                selectedPath = hitResult.item;
                if (hitResult.type == 'segment') {
                    selectedSegment = hitResult.segment;
                } else if (hitResult.type == 'stroke') {
                    var location = hitResult.location;
                    if (e.modifiers.shift) {
                        selectedSegment = selectedPath.insert(location.index + 1, e.point);
                    }


                    if (p.Key.isDown('`')) {
                        // selectedPath.smooth(
                        //     {from: (location.index-1) % selectedPath.segments.length, 
                        //         to: (location.index + 2) % selectedPath.segments.length,
                        //     type:paramProcess.smoothType,
                        //     factor:paramProcess.smoothness});
                        if (selectedSegment)
                            selectedSegment.smooth();
                    }
                }
            }
            //  movePath = hitResult.type == 'fill';
            if (hitResult && hitResult.type == 'fill') {
                //project.activeLayer.addChild(hitResult.item);
                // p.project.selectedItems.addChild(hitResult.item);
            }
        }

        tool.onMouseDrag = function (e) {
            if (selectedSegment) {
                selectedSegment.point =
                    selectedSegment.point.add(e.delta);
                if (p.Key.isDown('`')) {
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

            if (p.Key.isDown('t')) {
                p.project.selectedItems.forEach(
                    function (item) {
                        item.position = item.position.add(e.delta);
                    }
                );
            }
            if (p.Key.isDown('r')) {
                p.project.selectedItems.forEach(
                    function (item) {
                        //item.rotation += event.delta.angle * 0.1;
                        item.rotate(e.delta.angle * 0.1,
                            p.Key.isDown('shift') ? mouseDownPoint : item.position);
                        //item.position += event.delta;
                    }
                );
            }
            //if 's' is down scale the selected items
            if (p.Key.isDown('s')) {
                p.project.selectedItems.forEach(
                    function (item) {
                        item.scale(1 + (e.delta.x - e.delta.y) * 0.01,
                            p.Key.isDown('shift') ? mouseDownPoint : item.position);
                    }
                );
            }

        }


    })();

    // select tool
    (_ => {
        const tool = new p.Tool({ name: 'select' });
        tool.minDistance = 10;

        tool.selectionPath = new Path();
        tool.selectionPath.strokeColor = 'red';
        tool.selectionPath.strokeWidth = 1;

        tool.onMouseDown = function (e) {
            tool.selectionPath.remove();
            tool.selectionPath = new Path();
            tool.selectionPath.strokeColor = 'red';
            tool.selectionPath.strokeWidth = 1;
            tool.selectionPath.add(e.point);
            // console.log('mouse down' + event.point.x + " " + event.point.y);


        }

        tool.onMouseDrag = function (e) {
            tool.selectionPath.add(e.point);
        }

        tool.onMouseUp = function (e) {

            // if (e.item) {
            //     p.project.activeLayer.children.forEach(
            //         item => {
            //             if (tool.selectionPath.intersects(item)) {
            //                 //if (selectionPath.intersect(item) !=null) {
            //                 //item.selected = true;
            //                 item.selected = !item.selected;
            //             }
            //         }
            //     );
            //     tool.selectionPath.remove();
            // } else {
            if (e.item) {
                tool.selectionPath.add(e.point);
                tool.selectionPath.smooth();
                tool.selectionPath.closed = true;
                tool.selectionPath.simplify();

                let selected = p.project.activeLayer.children.filter(c => c.bounds.intersects(tool.selectionPath.bounds));
                selected.forEach(c => c.selected = true);
                if (selected == null) {
                    //clear selection
                    //p.project.activeLayer.children.forEach(c => c.selected = false);
                    p.project.selectedItems.forEach(i => i.selected = false);
                }
                tool.selectionPath.remove();
                //}
            } else {
                p.project.selectedItems.forEach(i => i.selected = false);
                tool.selectionPath.remove();
            }


        }

        tool.onKeyDown = function (e) {
            if (e.key == 'delete' || e.key == 'backspace') {
                if (e.modifiers.shift) {
                    p.project.selectedItems.forEach(i => i.remove());
                } else {
                    p.project.activeLayer.children.forEach(i => i.selected ? i.remove() : null);
                }
            }
        }

    })();

    // pan view tool
    (_ => {
        const tool = new p.Tool({ name: 'pan' });
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

    // pencil draw tool
    (_ => {
        const tool = new p.Tool({ name: 'pencil' });
        tool.minDistance = 10;
        let path;
        let selectionPath;
        let mouseDownPoint, mouseUpPoint;

        tool.onMouseDown = function (e) {
            path = new p.Path();
            // path.strokeColor = paramPalette.randomColor();
            path.strokeColor = p.Color.random();
            path.strokeWidth = 1;
            mouseDownPoint = e.point;
            path.add(mouseDownPoint);
        }

        tool.onMouseDrag = e => path.add(e.point);


        tool.onMouseUp = function (e) {
            mouseUpPoint = e.point;
            path.add(mouseUpPoint);
            path.smooth();
            if (e.modifiers.alt)
                path.closed = true;
            if (e.modifiers.meta)
                path.fillColor = p.Color.random();
            path.simplify();
            if (e.modifiers.shift) {
                path.selected = true;
            }
            // toolPath.removeOnDrag();
            path = null;
        }
    })();

    // old drawing line
    (_ => {
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

    // spot tool
    (_ => {
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


    p.tools.activeTool = 'pencil';
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

        //add event handler for escape key
        document.addEventListener('keydown', function (event) {
            if (event.keyCode === 27) {
                //p.view.scale(1);
                //fit the view to the window
                //p.view.fit(p.project.activeLayer.bounds);
                console.log('escape key pressed');

                p.project.activeLayer.children.forEach(c => {
                    c.selected = !c.selected;
                });
            }
            // on delete or backspace key press
            if (event.keyCode === 8 || event.keyCode === 46) {
                p.project.selectedItems.forEach(i => i.remove());
            }

            // on cmd+down arrow key press
            if (event.keyCode === 40 && event.metaKey) {
                //move the selected items to the back
                p.project.selectedItems.forEach(i => i.sendToBack());
            }
            // on cmd+up arrow key press move selected items to the front
            if (event.keyCode === 38 && event.metaKey) {
                p.project.selectedItems.forEach(i => i.bringToFront());
            }


        });

    }

    function onDocumentDrag(e) {
        e.preventDefault();
    }

    function onDocumentDrop(e) {
        e.preventDefault();

        var file = e.dataTransfer.files[0];
        var reader = new FileReader();
        //check the file type
        console.log(file.type);
        if (file.type.match(/image.svg*/)) {
            reader.onload = function (e) {
                let svg = e.target.result;
                //var svg = new p.SVG(e.target.result);
                // import the SVG into the current project
                p.project.importSVG(svg);
               // svg.position = p.view.center;
                //svg.scale(0.5);
            }
            reader.readAsText(file);
        } else if (file.type.match(/image.*/)) {
            reader.onload = function (e) {
                var img = new p.Raster(e.target.result);
                img.position = p.view.center;
                img.scale(0.5);
            }
            reader.readAsDataURL(file);

        } else if (file.type.match(/json.*/)) {
            reader.onload = function (e) {
                var json = JSON.parse(e.target.result);
                p.project.importJSON(json);
            }
            reader.readAsText(file);
        }




        // reader.onload = function (event) {
        //     var image = document.createElement('img');
        //     image.onload = function () {

        //         raster = new p.Raster(image);
        //        // raster.visible = false;
        //        // resetSpiral();
        //     };
        //     image.src = event.target.result;
        // };
        // reader.readAsDataURL(file);
    }

    document.addEventListener('drop', onDocumentDrop, false);
    document.addEventListener('dragover', onDocumentDrag, false);
    document.addEventListener('dragleave', onDocumentDrag, false);

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
        _ => {
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
        layerPanel: _ => paperjsLayersPanel.create({
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

    const guiActionsFolder = gui.addFolder('Actions');
    guiActionsFolder.add({
        svgDownload:
            _ => {
                let svg = p.project.exportSVG({ asString: true });
                //  let svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
                let a = document.createElement('a');
                a.href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
                let timestamp = new Date().toJSON().replace(/[-:]/g, '')
                let parts = timestamp.match(/^20(.*)T(.*)\.\d*Z$/); // remove timezone
                a.download = `Export_${parts[1]}_${parts[2]}.svg`;
                let body = document.body;
                body.appendChild(a);
                a.click();
                body.removeChild(a);
            }
    }, 'svgDownload').name('download SVG');

    guiActionsFolder.add({
        svgUpload:
            _ => {
                let input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/svg+xml';
                input.onchange = e => {
                    let file = e.target.files[0];
                    let reader = new FileReader();
                    reader.onload = e => {
                        let svg = e.target.result;
                        p.project.importSVG(svg);
                    };
                    reader.readAsText(file);
                };
                input.click();
            }
    }, 'svgUpload').name('import SVG');

    // image upload action
    guiActionsFolder.add({
        imageUpload:
            _ => {
                let input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = e => {
                    let file = e.target.files[0];
                    let reader = new FileReader();
                    reader.onload = e => {
                        let image = e.target.result;
                        raster = new Raster(image);
                        //p.project.importImage(image);
                    };
                    reader.readAsDataURL(file);

                };
                input.click();


            }
    }, 'imageUpload').name('import image');


    // download json
    guiActionsFolder.add({
        jsonDownload:
            _ => {
                let json = p.project.exportJSON();
                let jsonBlob = new Blob([json], { type: "application/json;charset=utf-8" });
                let a = document.createElement('a');
                a.href = URL.createObjectURL(jsonBlob);
                let timestamp = new Date().toJSON().replace(/[-:]/g, '')
                let parts = timestamp.match(/^20(.*)T(.*)\.\d*Z$/); // remove timezone
                a.download = `Export_${parts[1]}_${parts[2]}.json`;
                let body = document.body;
                body.appendChild(a);
                a.click();
                body.removeChild(a);
            }
    }, 'jsonDownload').name('download JSON');

    //import json
    guiActionsFolder.add({
        jsonUpload:
            _ => {
                let input = document.createElement('input');
                input.type = 'file';
                input.accept = 'application/json';
                input.onchange = e => {
                    let file = e.target.files[0];
                    let reader = new FileReader();
                    reader.onload = e => {
                        let json = e.target.result;
                        p.project.importJSON(json);
                    };
                    reader.readAsText(file);
                };
                input.click();
            }
    }, 'jsonUpload').name('import JSON');



    // $('.button.canvas-export-json', element).click(function() {
    // 			var svg = scope.project.exportJSON();
    // 			this.href = getBlobURL(svg, 'text/json');
    // 			this.download = 'Export_' + getTimeStamp() + '.json';
    // 		});

}