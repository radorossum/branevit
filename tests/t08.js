
p = paper;

let gui;

window.onload = _ => {
    // Setup Paper
    //pp = paper.project;
    canvas = document.querySelector('canvas');
    p.setup(canvas);
    p.install(window);

    gui = new dat.GUI();

    setupTools();
    setupElements();
    setupLayers();
    setupInterface();
    setupGUI();

}

window.onresize = paper.onResize = function () {
    paper.view.viewSize = new Size(window.innerWidth, window.innerHeight);
    console.log("resized to " + view.viewSize.width + "," + view.viewSize.height)
}

function setupInterface() {
    // Actions
    p.actionInterface = {
        // Actions
        //source layer
        source: '_',
        //target layer
        target: '_',
        //blend mode
        blendMode: 'normal',
        //move selection to target layer
        move: _ => {
            //find layer with name p.actionInterface.source
            let source = p.project.layers.find(l => l.name == p.actionInterface.source);
            //find layer with name p.actionInterface.target
            let target = p.project.layers.find(l => l.name == p.actionInterface.target);

            if (source && target) {
                for(let i=source.children.length-1; i>=0; i--) {
                    let item = source.children[i];
                    //add item to target layer
                    item.remove();
                    target.addChild(item);

                    //item.moveTo(target);
                    
                }
                target.reverseChildren();
            }
        },
        //copy selection to target layer
        copy: _ => {
            p.comp.clipboard.removeChildren();
            p.project.selectedItems.map(item => item.copyTo(p.comp.clipboard));
        },
        cut: _ => {
            p.comp.clipboard.removeChildren();
            p.project.selectedItems.map(
                item => {               
                    item.copyTo(p.comp.clipboard);
                    item.remove();
                }
            )
  
        },
        paste: _ => {

            p.comp.clipboard.children.map(item => item.copyTo(p.project.activeLayer))
            p.comp.clipboard.removeChildren();
            // for(let i=0; i<p.comp.clipboard.children.length; i++) {
            //     let item = p.comp.clipboard.children[i];
            //     //add item to target layer
            //     item.copyTo(p.project.activeLayer);
            //     //item.moveTo(target);
                
            // }
            // p.comp.clipboard.children.forEach(
            //     item=>item.addTo(p.project.activeLayer)
            // )
        },
        //delete selection
        delete: _ => {

            for(let i=p.project.selectedItems.length-1; i>=0; i--) {
                p.project.selectedItems[i].remove();
                
            }
        },
        // probabilistic selection
        select: (prob) => {
            let source = p.layers[p.actionInterface.source];
            if (source) {
                source.children.forEach(item => {
                    if (Math.random() < prob) {
                        item.selected = true;
                    }
                });
            }
        },
        selectProbability: 1.,
        //randomize blend mode of the selected items
        blendModeRnd: _ => {
            //let source = p.layers[p.actionInterface.source];
            let source = p.project.selectedItems;
            if (source) {
                source.forEach(item => {
                    if (item.selected) {
                        item.blendMode = p.blendModes[Math.floor(Math.random() * p.blendModes.length)];
                    }
                });
            }
        }
    }

    p.processInterface = {
        smooth: _ => {
            p.project.selectedItems
                .forEach(function (v) {
                    // if v is a path or compound path
                    if (v instanceof p.Path) {
                        v.smooth({
                            type: p.processInterface.smoothType,
                            factor: p.processInterface.smoothness
                        })
                    }
                });
        },
        smoothness: 0.,
        smoothType: 'geometric',
        simplify: _ => {

            p.project.selectedItems.forEach(
                v => {
                    if (v instanceof p.Path) {
                        v.reduce();
                        v.simplify(p.processInterface.simplicity);
                    }
                });
        },
        simplicity: 0.,
        flatten: _ => {
            p.project.selectedItems
                .forEach(v => v.flatten(p.processInterface.flatness));
        },
        flatness: 0.5,
        resample: function (n) {
            n = n || p.processInterface.samples;
            p.project.selectedItems
                .forEach(path => {
                    // if p is a path, resample it
                    if (path instanceof p.Path) {
                        newSegments = [];
                        for (let i = 0; i <= n; i++) {
                            let s = path.getPointAt(path.length * i / n);
                            if (s) newSegments.push(s);
                        }

                        // console.log(newSegments);

                        let newpath = new p.Path({ segments: newSegments });
                        newpath.strokeColor = path.strokeColor;//.random();
                        // newpath.fillColor = p.Color.random();
                        newpath.closed = path.closed;
                        newpath.selected = true;
                        if (p.Key.isDown('alt')) {
                            path.remove();
                        }
                        path.selected = false;
                        newpath.smooth();
                    }


                });

        },
        samples: 10,
        stroke: _ => {
            p.project.selectedItems.forEach(v => {
                if (v instanceof p.Path) {
                    v.strokeColor = p.Color.random();
                }
            });
        },
        fill: _ => {
            p.project.selectedItems.forEach(v => {
                if (v instanceof p.Path) {
                    v.fillColor = p.Color.random();
                }
            });
        },
        interpolate: _ => {
            // if (p.project.selectedItems.length > 1) {
            //     let to = p.project.selectedItems[0];
            //     let from = p.project.selectedItems[p.project.selectedItems.length - 1];
            //     if (to.segments.length == from.segments.length) {
            //         let tmp = to.clone();
            //         tmp.interpolate(from, to, p.processInterface.interpolation);
            //     }
            // }
            let tmpgroup = new p.Group();
            for (let i = 0; i < p.project.selectedItems.length - 1; i++) {
                // for(let j=0; j<i<p.project.selectedItems.length; j++) {
                let to = p.project.selectedItems[i];
                let from = p.project.selectedItems[i + 1];

                let tmp = to.clone();

                if (to.segments.length == from.segments.length) {
                    tmp.interpolate(from, to, p.processInterface.interpolation);
                    let c1 = to.strokeColor.multiply(p.processInterface.interpolation);
                    let c2 = from.strokeColor.multiply(1. - p.processInterface.interpolation);
                    tmp.strokeColor = c1.add(c2);
                    // tmp.strokeColor = p.Color(to.strokeColor).multiply(p.processInterface.interpolation).add(
                    //     p.Color(from.strokeColor).multiply(1 - p.processInterface.interpolation));
                    // tmp.fillColor = tmp.strokeColor;
                    //              console.log(c1 + " " + c2 + " " + tmp.strokeColor);
                }
                if (p.Key.isDown('alt')) {
                    to.remove();
                    from.remove();
                } else {
                    tmp.selected = false;

                }
                tmpgroup.addChild(tmp);
                // }
            }
            //p.project.selectedItems = [];
            tmpgroup.children.map(v => {
                v.selected = true;
            });
            tmpgroup.parent.insertChildren(tmpgroup.index, tmpgroup.removeChildren());
            tmpgroup.remove();
            //tmpgroup.removeChildren();

        },
        interpolation: 0.5,
        bridge: (parts) => {
            parts = parts || p.processInterface.bridgeSegments;
            let tmpgroup = new p.Group();
            for (let i = 0; i < p.project.selectedItems.length - 1; i++) {
                let from = p.project.selectedItems[i];
                let to = p.project.selectedItems[i + 1];
                for (let j = 0; j < parts; j++) {
                    let tmp = to.clone();
                    tmp.interpolate(from, to, j / parts);
                    tmp.selected = false;
                    tmpgroup.addChild(tmp);
                    let c1 = to.strokeColor.multiply(j / parts);
                    let c2 = from.strokeColor.multiply(1. - j / parts);
                    tmp.strokeColor = c1.add(c2);
                }

            }
            tmpgroup.children.map(v => {
                v.selected = true;
            });

            if (tmpgroup.parent) {
                tmpgroup.parent.insertChildren(tmpgroup.index, tmpgroup.removeChildren());
                tmpgroup.remove();
            }
        },
        bridgeSegments: 3,

        close: _ => {
            p.project.selectedItems.forEach(v => {
                if (v instanceof p.Path) {
                    v.closed = !v.closed;
                }
            });
        },
        reverse: _ => {
            p.project.selectedItems.forEach(v => {
                if (v instanceof p.Path) {
                    v.reverse();
                }
            });
        },
        //remove fill
        removeFill: _ => {
            p.project.selectedItems.forEach(v => v.fillColor = null);
        }

    }

}

function setupElements() {
    p.comp = {};


    // background layer
    p.comp.bg = new paper.Layer({ name: 'background' });
    p.comp.bg.name = 'background';
    p.comp.bg.locked = true;
    p.project.addLayer(p.comp.bg);


    p.comp.bg.type = 'color'; //['color','image','svg','json','none']; 
    p.comp.bg.visible = true;
    p.comp.bg.opacity = 1.;
    //p.project.layers['background'].activate();
    //bg.activate();
    p.comp.bg.sendToBack();
    p.comp.bg.backdrop = new p.Shape.Rectangle(0, 0, p.view.size.width, p.view.size.height);
    p.comp.bg.backdrop.visible = true;
    p.comp.bg.addChild(p.comp.bg.backdrop);
    p.comp.bg.backdrop.name = 'backdrop_solid';
    p.comp.bg.backdrop.fillColor = p.comp.bg.backdrop.color1 = '#555';
    // p.comp.bg.backdrop.strokeColor = '#333'; 
    p.comp.bg.backdrop.name = 'backdrop'
    p.comp.bg.backdrop.update = function () {
        p.comp.bg.backdrop.size = p.view.size;
    };

    //////////////////////
    p.comp.src = new paper.Layer({ name: 'sources' });
    p.comp.src.locked = true;
    p.project.addLayer(p.comp.src);
    p.comp.src.sendToBack();

    p.comp.clipboard = new p.Layer();
    p.comp.clipboard.name = "clipboard";
    p.comp.clipboard.visible = false;
    p.comp.clipboard.locked = true;
    p.comp.clipboard.selectable = false;
    p.project.addLayer(p.comp.clipboard);
    p.comp.clipboard.sendToBack();

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
    p.project.layers['Layer 0'].activate();

}

function setupTools() {
    // edit tool
    p.tools.minDistance = 0;
    p.tools.maxDistance = 0;
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

        //   tool.minDistance = 10;

        tool.selectionPath = new Path();
        tool.selectionPath.strokeColor = 'red';
        tool.selectionPath.strokeWidth = 1;
        //dashed line for selection
        tool.selectionPath.dashArray = [5, 5];
        tool.oldPointViewCoords = null;


        tool.onMouseDown = e => {
            selectedSegment = selectedPath = null;
            mouseDownPoint = e.point.clone();
            if (p.Key.isDown('q')) {
                tool.selectionPath.remove();
                tool.selectionPath = new Path();
                tool.selectionPath.strokeColor = 'red';
                tool.selectionPath.strokeWidth = 1;
                tool.selectionPath.dashArray = [5, 5];
                tool.selectionPath.add(e.point);
                // console.log('mouse down' + event.point.x + " " + event.point.y);

            } else if (p.Key.isDown('space')) {
                tool.oldPointViewCoords = p.view.projectToView(e.point);
            } else {
                let hitResult = p.project.hitTest(e.point, hitOptions);
                if (!hitResult && !e.modifiers) {
                    p.project.activeLayer.selected = false;
                    return;
                }

                if (e.modifiers.meta) {
                    p.project.activeLayer.selected = false;
                }

                if (e.modifiers.alt) {
                    if (hitResult) {
                        if (hitResult.type == 'segment') {
                            hitResult.segment.remove();
                        } else if (hitResult.type == 'stroke') {
                            hitResult.item.selected = false;

                        } else if (hitResult.type == 'fill') {
                            hitResult.item.selected = false;
                        }
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
        }

        tool.onMouseDrag = e => {
            if (p.Key.isDown('q')) {
                tool.selectionPath.add(e.point);
            } else if (p.Key.isDown('space')) {
                const delta = e.point.subtract(p.view.viewToProject(tool.oldPointViewCoords));
                tool.oldPointViewCoords = p.view.projectToView(e.point);
                p.view.translate(delta);
            } else {
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
                    if (p.Key.isDown('alt')) {
                        p.project.selectedItems
                            .map(i => {
                                let c = i.clone().set({ selected: false });
                            })
                    }
                    p.project.selectedItems
                        .forEach(i => i.position = i.position.add(e.delta));
                }
                if (p.Key.isDown('r')) {
                    if (p.Key.isDown('alt')) {
                        p.project.selectedItems
                            .map(i => {
                                let c = i.clone().set({ selected: false });
                            })
                    }
                    p.project.selectedItems.forEach(
                        item => {
                            //item.rotation += event.delta.angle * 0.1;
                            item.rotate(e.delta.angle * 0.025,
                                p.Key.isDown('`') ? mouseDownPoint : item.position);
                            //item.position += event.delta;
                        }
                    );
                }
                //if 's' is down scale the selected items
                if (p.Key.isDown('s')) {
                    if (p.Key.isDown('alt')) {
                        p.project.selectedItems
                            .map(i => {
                                let c = i.clone().set({ selected: false });
                            })
                    }
                    p.project.selectedItems.forEach(
                        function (item) {
                            item.scale(1 + (e.delta.x - e.delta.y) * 0.01,
                                p.Key.isDown('`') ? mouseDownPoint : item.position);
                        }
                    );
                }
            }

        }

        tool.onMouseUp = e => {
            if (p.Key.isDown('q')) {
                // if (e.item) {
                tool.selectionPath.add(e.point);
                tool.selectionPath.smooth();
                tool.selectionPath.closed = true;
                tool.selectionPath.simplify();

                // let selected = p.project.activeLayer.children.filter(c => c.bounds.intersects(tool.selectionPath.bounds));
                // selected.forEach(c => c.selected = true);
                // if (selected == null) {
                //     //clear selection
                //     //p.project.activeLayer.children.forEach(c => c.selected = false);
                //     p.project.selectedItems.forEach(i => i.selected = false);
                // }

                p.project.activeLayer.children.forEach(c => {
                    let selected = false;
                    if (c.segments) {
                        c.segments.map(s => {
                            selected = selected || tool.selectionPath.contains(s.point);
                            if (selected) {
                                c.selected = true;
                                return;
                            }
                        });
                    }

                });
                // if (selected) {
                //     p.project.selectedItems.forEach(i => i.selected = true);
                // }

                //}
                //  } else {
                //     p.project.selectedItems.forEach(i => i.selected = false);

            }//
            tool.selectionPath.remove();
        }
    })();

    // pencil draw tool
    (_ => {
        let tool = new p.Tool({ name: 'pencil' });
        tool.minDistance = p.tools.minDistance;
        tool.maxDistance = p.tools.maxDistance;
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

    // // select tool
    // (_ => {
    //     const tool = new p.Tool({ name: 'select' });
    //     tool.minDistance = 10;

    //     tool.selectionPath = new Path();
    //     tool.selectionPath.strokeColor = 'red';
    //     tool.selectionPath.strokeWidth = 1;
    //     //dashed line for selection
    //     tool.selectionPath.dashArray = [5, 5];

    //     tool.onMouseDown = function (e) {
    //         tool.selectionPath.remove();
    //         tool.selectionPath = new Path();
    //         tool.selectionPath.strokeColor = 'red';
    //         tool.selectionPath.strokeWidth = 1;
    //         tool.selectionPath.dashArray = [5, 5];
    //         tool.selectionPath.add(e.point);
    //         // console.log('mouse down' + event.point.x + " " + event.point.y);


    //     }

    //     tool.onMouseDrag = function (e) {
    //         tool.selectionPath.add(e.point);
    //     }

    //     tool.onMouseUp = function (e) {

    //         // if (e.item) {
    //         //     p.project.activeLayer.children.forEach(
    //         //         item => {
    //         //             if (tool.selectionPath.intersects(item)) {
    //         //                 //if (selectionPath.intersect(item) !=null) {
    //         //                 //item.selected = true;
    //         //                 item.selected = !item.selected;
    //         //             }
    //         //         }
    //         //     );
    //         //     tool.selectionPath.remove();
    //         // } else {
    //         if (e.item) {
    //             tool.selectionPath.add(e.point);
    //             tool.selectionPath.smooth();
    //             tool.selectionPath.closed = true;
    //             tool.selectionPath.simplify();

    //             let selected = p.project.activeLayer.children.filter(c => c.bounds.intersects(tool.selectionPath.bounds));
    //             selected.forEach(c => c.selected = true);
    //             if (selected == null) {
    //                 //clear selection
    //                 //p.project.activeLayer.children.forEach(c => c.selected = false);
    //                 p.project.selectedItems.forEach(i => i.selected = false);
    //             }
    //             tool.selectionPath.remove();
    //             //}
    //         } else {
    //             p.project.selectedItems.forEach(i => i.selected = false);
    //             tool.selectionPath.remove();
    //         }


    //     }

    //     // tool.onKeyDown = function (e) {
    //     //     if (e.key == 'delete' || e.key == 'backspace') {
    //     //         if (e.modifiers.shift) {
    //     //             p.project.selectedItems.forEach(i => i.remove());
    //     //         } else {
    //     //             p.project.activeLayer.children.forEach(i => i.selected ? i.remove() : null);
    //     //         }
    //     //     }
    //     // }

    // })();


    ///////////////////
    // pan view tool
    //////////////////
    // (_ => {
    //     const tool = new p.Tool({ name: 'pan' });
    //     let oldPointViewCoords;

    //     tool.onMouseDown = e => {
    //         oldPointViewCoords = p.view.projectToView(e.point);
    //     }

    //     tool.onMouseDrag = e => {
    //         const delta = e.point.subtract(p.view.viewToProject(oldPointViewCoords));
    //         oldPointViewCoords = p.view.projectToView(e.point);
    //         p.view.translate(delta);
    //     }
    // })();

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
    p.tools.lastTool = 'select';
    p.tools.setActiveTool = (name) => {
        p.tools.lastTool = p.tools.activeTool;
        p.tools.activeTool = name;
        const tool = p.tools.find(tool => tool.name === name);
        tool.activate();
        tool.minDistance = p.tools.minDistance;
        tool.maxDistance = p.tools.maxDistance;
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
        document.addEventListener('keydown', e => {
            if ((e.keyCode == 71 && e.altKey)) {
                if (e.shiftKey) { gui.closed ? gui.open() : gui.close(); }
                else {
                    gui.domElement.style.display = gui.domElement.style.display == 'none' ? 'block' : 'none';
                }
            }
            if (e.keyCode === 27) {
                //p.view.scale(1);
                //fit the view to the window
                //p.view.fit(p.project.activeLayer.bounds);
                console.log('escape key pressed');
                //if the shift key is pressed
                if (e.shiftKey) {
                    console.log('escape-shift key pressed');
                    p.project.activeLayer.children.forEach(c => {
                        c.selected = !c.selected;
                    });
                } else if (e.ctrlKey) {

                    console.log(p.view);

                    let x = p.view.bounds.x;
                    let y = p.view.bounds.y;
                    p.view.zoom = 1.;
                    p.view.translate(x, y);
                    x = p.view.bounds.x;
                    y = p.view.bounds.y;
                    // p.view.zoom = 1.;
                    p.view.translate(x, y);

                    // let allLayers = new p.Layer();
                    // allLayers.name = 'allLayers';
                    // let merge = new p.Group({ name: 'merge' });
                    // console.log('control key pressed');
                    // for (let i = p.project.layers.length -1; i >= 0; i--) {
                    //     if (p.project.layers[i].name != 'allLayers') {
                    //         allLayers.addChild(p.project.layers[i]);
                    //     }
                    // }
                    // console.log(allLayers.parent);
                    // console.log(merge.parent);
                    // p.project.layers.forEach(l => {
                    //     console.log(l.name);
                    //     if (l.name != "merge") allLayers.addChild(l)
                    // }); 
                    // allLayers.parent.addChild(allLayers.removeChildren());
                    // allLayers.remove();
                    // allLayers.fitBounds(p.view.bounds);
                    // p.view.insertChildren(allLayers.index, allLayers.removeChildren());
                    // allLayers.remove(); 
                    // move the children of allLayers to the top
                    // allLayers.children.forEach(c => {
                    //     if (c.name != 'merge') {
                    //     c.parent = merge
                    //     }
                    // });




                } else if (e.metaKey) {
                    p.project.layers.forEach(l => {
                        if (!l.locked) l.children.forEach(ll => ll.selected = true)
                    });
                    // p.project.activeLayer.selected = false;
                    // p.project.activeLayer.children.forEach(c => {
                    //     c.selected = true;
                    // });
                } else {
                    p.project.selectedItems.forEach(i => i.selected = false);
                    // p.project.selectedItems.for = [];

                }
            }
            // on delete or backspace key press
            //            if (e.keyCode === 8 || e.keyCode === 46) {
            if (e.keyCode === 46) {
                p.project.selectedItems.forEach(i => i.remove());
            }

            // on cmd+down arrow key press
            if (e.keyCode === 40 && e.metaKey) {
                //move the selected items to the back
                p.project.selectedItems.forEach(i => i.sendToBack());
            }
            // on cmd+up arrow key press move selected items to the front
            if (e.keyCode === 38 && e.metaKey) {
                p.project.selectedItems.forEach(i => i.bringToFront());
            }
            if (e.keyCode === 9) {
                e.preventDefault();
                //get the next tool in the array


                let index = p.tools.map(t => t.name).indexOf(p.tools.activeTool);
                let nextIndex = (p.tools.length + index + (e.shiftKey ? -1 : 1)) % p.tools.length;
                // const nextIndex = Math.max(((p.tools.length+index + e.shiftKey?-1:1) % p.tools.length),0);
                // const nextTool = p.tools[nextIndex];

                //set the first tool as the active tool

                p.tools.lastTool = p.tools.activeTool;
                p.tools.activeTool = p.tools[nextIndex].name;
                p.tools.setActiveTool(p.tools.activeTool);

            }

        });






    }
    /////////drag+drop read file
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
    //////////////

    const guiToolFolder = gui.addFolder('Tools');
    guiToolFolder.add(p.tools, 'activeTool', p.tools.map(t => t.name))
        .name('active tool')
        .onChange(_ => p.tools.setActiveTool(_)).listen();
    guiToolFolder.add(p.tools, 'minDistance', 0., 100.)
        .name('minDistance').onChange(_ => {
            p.tools.minDistance = _;
            p.tools.setActiveTool(p.tools.activeTool)
        });
    guiToolFolder.add(p.tools, 'maxDistance', 0., 100.)
        .name('maxDistance').onChange(_ => {
            p.tools.maxDistance = _;
            p.tools.setActiveTool(p.tools.activeTool)
        });

    guiToolFolder.open();

    const guiLayerFolder = gui.addFolder('Layers');
    //add button to add a new layer

    let guiUpdateLayerName = (name) => {
        let l = p.project.layers.find(l => l.name === name);
        l.activate();
        p.project.layerInterface.name = p.project.activeLayer.name;

        guiLayerBlendMode.setValue(p.project.activeLayer.blendMode);
        p.project.layerInterface.opacity = p.project.activeLayer.opacity;
        p.project.layerInterface.style = p.project.activeLayer.style;
        // guiLayerName.setValue(l.name);
        console.log(p.project.activeLayer.name);
    }

    let guiUpdateLayerList =
        _ => {
            guiCurrentLayer.remove();
            let layerNames = p.project.layers.map(l => l.name).reverse();
            guiCurrentLayer = guiLayerFolder.add(p.project.layerInterface, 'current',
                layerNames).onChange(guiUpdateLayerName).listen();

            p.project.layerInterface.current = p.project.activeLayer.name;
            guiUpdateLayerName(p.project.layerInterface.current);
            //guiLayerBlendMode.setValue(p.project.activeLayer.blendMode);
            // guiLayerBlendMode.updateDisplay();
            // console.log(p.project.activeLayer.name);


        };
    guiLayerFolder.add(p.project.layerInterface, 'add').onFinishChange(guiUpdateLayerList);
    guiLayerFolder.add(p.project.layerInterface, 'remove').onFinishChange(guiUpdateLayerList);
    guiLayerFolder.add(p.project.layerInterface, 'moveUp').onFinishChange(guiUpdateLayerList);
    guiLayerFolder.add(p.project.layerInterface, 'moveDown').onFinishChange(guiUpdateLayerList);
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
    //    guiLayerFolder.add(p.project.layerInterface, 'style', p.styles).onChange(_ => p.project.activeLayer.style = _).listen();
    guiLayerFolder.add({
        layerPanel: _ => paperjsLayersPanel.create({
            title: '', draggable: true
        })
    }, 'layerPanel').name('layer panel');

    let guiCurrentLayer = guiLayerFolder.add(p.project.layerInterface, 'current',

        p.project.layers.map(l => l.name)).onFinishChange(guiUpdateLayerName).listen();

    p.project.layerInterface.current = p.project.activeLayer.name;
    p.project.layerInterface.name = p.project.activeLayer.name;

    // guiLayerFolder.add(p.project.activeLayer.interface,'current', p.project.interface.layerNames())
    //     .name('active layer')
    //     .onChange(name => { // find named layer
    //         const layer = p.project.layers.find(layer => layer.name === name)
    //         if(layer) layer.activate(); 
    //     });
    guiLayerFolder.open();

    const guiBackground = gui.addFolder('Background');
    //guiBackground.addColor({bg:fillColor}, 'fillColor');
    //guiBackground.addColor({bg:strokeColor}, 'strokeColor'); 
    guiBackground.addColor(p.comp.bg.backdrop, 'color1')
        .onChange(_ => {
            //  paper.comp.bg.backdrop.fillColor = p.Color.random();  
            p.comp.bg.backdrop.fillColor = _
        });
    guiBackground.add(p.comp.bg.backdrop, 'visible');
    // guiBackground.addColor(p.comp.bg.backdrop
    guiBackground.add(p.comp.bg, 'opacity', 0., 1., 0.1);
    guiBackground.add(p.comp.bg.backdrop, 'update');
    //guiBackground.add(p.comp.bg.backdrop, 'strokeWidth').min(0).max(10).step(0.1);

    //////Process
    ///////////////////////////////////////////
    const guiProcess = gui.addFolder('Process')
    guiProcess.add(p.processInterface, 'smooth');
    guiProcess.add(p.processInterface, 'smoothness', -10., 10., 0.01);
    guiProcess.add(p.processInterface, 'smoothType', ['geometric', 'catmull-rom', 'bezier']);
    guiProcess.add(p.processInterface, 'flatten');
    guiProcess.add(p.processInterface, 'flatness', 0., 100., 0.01);
    guiProcess.add(p.processInterface, 'simplify');
    guiProcess.add(p.processInterface, 'simplicity', 0., 100., 0.01);
    guiProcess.add(p.processInterface, 'resample');
    guiProcess.add(p.processInterface, 'samples', 1, 1000, 1);
    guiProcess.add(p.processInterface, 'stroke');
    guiProcess.add(p.processInterface, 'interpolate');
    guiProcess.add(p.processInterface, 'interpolation', -2., 2., 0.01);
    guiProcess.add(p.processInterface, 'bridge');
    guiProcess.add(p.processInterface, 'bridgeSegments', 1, 100, 1).name('parts');
    guiProcess.add(p.processInterface, 'close');
    guiProcess.add(p.processInterface, 'removeFill');

    ///////////////////////////////////////////
    const guiIOFolder = gui.addFolder('Import/Export');

    guiIOFolder.add({
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
    guiIOFolder.add({
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

    //import json
    guiIOFolder.add({
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

    // download json
    guiIOFolder.add({
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
    }, 'jsonDownload').name('scene as JSON');




    guiIOFolder.add({
        pngDownload:
            _ => {
                let timestamp = new Date().toJSON().replace(/[-:]/g, '')
                let parts = timestamp.match(/^20(.*)T(.*)\.\d*Z$/); // remove timezone
                let a = document.createElement('a');
                //rasterize the view to a png blob
                //p.view.draw();
                a.href = canvas.toDataURL('image/png');;

                let blob;

                // p.view.element.toBlob(function (blob) { saveAs(blob, "image.png"); });
                // a.href = p.project.exportImage({
                //     type: 'png',
                //     width: p.project.view.size.width,
                //     height: p.project.view.size.height,
                //     quality: 1,
                //     transparent: true
                // });
                a.download = `Export_${parts[1]}_${parts[2]}.png`;
                let body = document.body;
                body.appendChild(a);
                a.click();
                body.removeChild(a);
            }
    }, 'pngDownload').name('scene as PNG');
    guiIOFolder.add({
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
    }, 'svgDownload').name('scene as SVG');
    guiIOFolder.add({
        svgSelection:
            _ => {
                let svgGroup = new p.Group();
                p.project.selectedItems.forEach(item => svgGroup.addChild(item));

                let svg = svgGroup.exportSVG({ asString: true })

                //remove the first '<g xlmns="http://www.w3.org/2000/svg">'
                svg = svg.replace('<g xmlns="http:\/\/www.w3.org\/2000\/svg"', '');
                //      svg = `<svg xmlns="http:\/\/www.w3.org\/2000\/svg"> <g`  + svg + '</svg>';

                svg = `<svg width=\"${p.view.viewSize.width}\" height=\"${p.view.viewSize.height}\" xmlns="http:\/\/www.w3.org\/2000\/svg"> <g` + svg + '</svg>';
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
    }, 'svgSelection').name('selection as SVG');

    ///////////////////////////////////////////
    const guiActionFolder = gui.addFolder('Actions');
    guiActionFolder.add(p.actionInterface, 'source');
    guiActionFolder.add(p.actionInterface, 'target');
    guiActionFolder.add(p.actionInterface, 'blendMode');
    guiActionFolder.add(p.actionInterface, 'move');
    guiActionFolder.add(p.actionInterface, 'copy');
    guiActionFolder.add(p.actionInterface, 'cut');
    guiActionFolder.add(p.actionInterface, 'paste');
    guiActionFolder.add(p.actionInterface, 'delete');



}