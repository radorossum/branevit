
p = paper;
let gui;

window.onload = _ => {
    // Setup Paper
    //pp = paper.project;
    canvas = document.querySelector('canvas');
    p.setup(canvas);
    p.install(window);

    p.Path.prototype.resample = function (n) {
        let path = this;
        let length = path.length;
        let newSegments = [];
        let epsilon = path.closed ? 1 : 0;
        for (let i = 0; i < n; i++) {
            let s = path.getPointAt(length * (i) / (n - 1 + epsilon));
            if (s) newSegments.push(s);
        }
        path.segments = newSegments;
        return path;
    }

    gui = new dat.GUI();
    setupElements();
    setupTools();
    setupInterfaces();
    setupLayers();
    setupGUI();

}

window.onresize = paper.onResize = function () {
    paper.view.viewSize = new Size(window.innerWidth, window.innerHeight);
    console.log("resized to " + view.viewSize.width + "," + view.viewSize.height)
}

function setupInterfaces() {
    p.bools = ['unite', 'intersect', 'subtract', 'exclude', 'divide'];
    p.brushInterface = {
        strokeMethod: 'paletternd', //fixed, random, none, color0, color1, paletternd, paletteindex
        fillMethod: 'none',
        strokeColor: '#000',

        fillColor: '#fff',
        strokeWidth: 1,
        opacity: 1.,
        blendMode: 'normal',

        getStrokeColor: function () {
            return p.brushInterface[p.brushInterface.strokeMethod]();
        },
        getFillColor: function () {
            return p.brushInterface[p.brushInterface.fillMethod]();
        },
        getStrokeWidth: function () {
            return p.brushInterface.strokeWidth;
        },
        getOpacity: function () {
            return p.brushInterface.opacity;
        },
        updateOpacity: function () {
            let selection = p.project.getItems({
                selected: true,
                class: p.PathItem
            });
            selection.forEach(function (item) {
                item.opacity = p.brushInterface.getOpacity();
            });
        },
        updateFillColor: function () {
            let selection = p.project.getItems({
                selected: true,
                class: p.PathItem
            });
            selection.forEach(function (item) {
                item.fillColor = p.brushInterface.getFillColor();
            });
        },
        updateStrokeColor: function () {
            let selection = p.project.getItems({
                selected: true,
                class: p.PathItem
            });
            selection.forEach(function (item) {
                item.strokeColor = p.brushInterface.getStrokeColor();
            });
        },
        updateStrokeWidth: function () {
            let selection = p.project.getItems({
                selected: true,
                class: p.PathItem
            });
            selection.forEach(function (item) {
                item.strokeWidth = p.brushInterface.strokeWidth;
            });
        },

        random: _ => { return p.Color.random() },
        fixedStroke: _ => { return p.brushInterface.strokeColor },
        fixedFill: _ => { return p.brushInterface.fillColor },

        none: _ => { return null },
        paletternd: _ => {
            return p.paletteInterface.palette[Math.floor(Math.random() * p.paletteInterface.palette.length)];

            //  return p.paletteInterface.palette[p.randomInt(0, p.paletteInterface.palette.length - 1)];
        },
        lastIndex: 0,
        paletteindex: function () {
            let c = p.paletteInterface.palette[this.lastIndex];
            this.lastIndex = (this.lastIndex + 1) % p.paletteInterface.palette.length;

            return c;

        },
        palettize: function () {
            p.project.selectedItems.forEach(
                function (item) {
                    if (item.fillColor) item.fillColor = p.paletteInterface.randomColor();
                    if (item.strokeColor) item.strokeColor = p.paletteInterface.randomColor();
                }
            );
        },
        updateBlendMode: function () { p.project.selectedItems.forEach(item => item.blendMode = p.brushInterface.blendMode) }

    }


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
                for (let i = source.children.length - 1; i >= 0; i--) {
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
            p.project.selectedItems.map(item => {
                item.copyTo(p.comp.clipboard);
                item.selected = false;
            });
            p.comp.clipboard.selected = false;
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
            // p.comp.clipboard.removeChildren();
            //  p.actionInterface.copy();
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

            for (let i = p.project.selectedItems.length - 1; i >= 0; i--) {
                p.project.selectedItems[i].remove();

            }
        },
        // probabilistic selection
        select: (prob) => {
            prob = prob || p.actionInterface.selectProbability;
            let selected = p.project.selectedItems;
            selected.map(item => {
                Math.random() > prob ? item.selected = false : item.selected = true;
            })
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
        },


        visibility: function () {
            p.project.selectedItems.forEach(
                function (item) {
                    item.visible = !item.visible;
                }
            );
        },



    }

    p.processInterface = {
        boolOp: 'unite', //unite, intersect, subtract, exclude, divide
        boolOperate: function (desctructive = false) {
            let selectedPaths = p.project.getItems({
                selected: true,
                class: p.PathItem
            });
            //  selectedPaths.forEach(item=>item.dashArray = [5,5]);
            let tmp = selectedPaths[0].clone(), result;
            for (let i = 1; i < selectedPaths.length; i++) {
                result = selectedPaths[i][p.processInterface.boolOp](tmp);
                result.copyAttributes(selectedPaths[i]);
                if (tmp.strokeColor && selectedPaths[i].strokeColor) {
                    result.strokeColor = tmp.strokeColor.add(selectedPaths[i].strokeColor).multiply(0.5);
                }
                if (tmp.fillColor && selectedPaths[i].fillColor) {
                    result.fillColor = tmp.fillColor.add(selectedPaths[i].fillColor).multiply(0.5);
                }
                tmp.remove();
                tmp = result;
            }
            if (desctructive || p.Key.isDown('alt')) {
                for (let i = selectedPaths.length - 1; i >= 0; i--) {
                    selectedPaths[i].remove();
                }
            } else {
                selectedPaths.forEach(item => item.selected = false);
            }
            result.reduce();
            if (result) {
                result.selected = true;
                if (result.className == 'CompoundPath') {
                    for (let i = result.children.length - 1; i >= 0; i--) {
                        // result.children[i].copyAttributes(result);
                        // console.log(result.children[i].strokeColor.toString());
                        if (!result.children[i].strokeColor && !result.children[i].fillColor) {
                            result.children[i].strokeColor = result.strokeColor;
                        }
                        result.children[i].selected = true;
                        result.children[i].visible = true;
                        result.children[i].reduce();
                        result.children[i].addTo(result.parent);


                    }
                    result.remove();
                }
            }
        },
        bool: function () {
            let selectedPaths = p.project.getItems({
                selected: true,
                class: p.PathItem

            });
            let source = [...selectedPaths];
            selectedPaths.forEach(item => item.selected = false);

            let resultGroup = new p.Group();
            resultGroup.name = resultGroup.className + '_results';
            // apply the selected bool operation to the source items, pairing every two consecutive items
            // for (let i = 0; i < source.length - 1; i++) {
            //     let item1 = source[i];
            //     for (let j = i + 1; j < source.length; j++) {

            for (let i = 0; i < source.length - 1; i++) {
                let item1 = source[i];
                let item2 = source[i + 1];
                let result = item1[p.processInterface.boolOp](item2);
                //set the item name to the item's class name
                //result.name = result.className;

                item1.name = `${item1.className}_ ${i}`;
                //item2.name = `${item2.className}_ ${j}`;
                item2.name = `${item2.className}_ ${i + 1}`;
                //result.name = `${result.className}_${p.processInterface.boolOp}${i}-${j}`;
                result.name = `${result.className}_${p.processInterface.boolOp}${i}-${i + 1}`;
                result.reduce();
                result.selected = true;
                if (result.className == 'Path') {
                    result.isEmpty() ? result.remove() : resultGroup.addChild(result.reduce());

                } else if (result.className == 'CompoundPath') {
                    //count backwards to avoid indexing issues
                    for (let k = result.children.length - 1; k >= 0; k--) {
                        resultGroup.addChild(result.children[k]);
                    }
                    result.remove();
                    //result.children.map(item => resultGroup.addChild(item));
                    // result.remove();
                }


            }
            //}
            console.log(resultGroup);


            for (let i = resultGroup.children.length - 1; i >= 0; i--) {
                resultGroup.children[i].addTo(resultGroup.parent);
            }
            if (!resultGroup.children.length) {
                resultGroup.remove();
            }
            if (p.Key.isDown('alt')) {
                //count backwards to avoid indexing issues delete the source items
                for (let i = selectedPaths.length - 1; i >= 0; i--) {
                    selectedPaths[i].remove();
                }
            }


        },

        smooth: _ => {
            let selected = p.project.getItems({ class: Path, selected: true });
            selected.map(v => v.smooth({
                type: p.processInterface.smoothType,
                factor: p.processInterface.smoothness
            }));
            // p.project.selectedItems
            //     .forEach(function (v) {
            //         // if v is a path or compound path
            //         if (v instanceof p.Path) {
            //             v.smooth({
            //                 type: p.processInterface.smoothType,
            //                 factor: p.processInterface.smoothness
            //             })
            //         }
            //     });
        },
        smoothness: 0.,
        smoothType: 'geometric',
        simplify: _ => {
            let selected = p.project.getItems({ class: Path, selected: true });

            selected.map(
                v => {
                    if (v instanceof p.Path) {
                        v.reduce();
                        if (v.segments.length > 1) {
                            v.simplify(p.processInterface.simplifyTolerance);
                        }
                        // v.simplify(p.processInterface.simplicity);
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
                        let epsilon = path.closed ? 1 : 0;
                        for (let i = 0; i <= n; i++) {

                            let s = path.getPointAt(path.length * (i) / (n + epsilon));
                            if (s) newSegments.push(s);
                        }

                        // console.log(newSegments);

                        let newpath = new p.Path({ segments: newSegments });
                        newpath.copyAttributes(path);
                        newpath.closed = path.closed;

                        //newpath.selected = true;
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
            let selected = p.project.getItems({ class: Path, selected: true });
            for (let i = 0; i < selected.length - 1; i++) {

                let from = selected[i];
                // if (['Path', 'CompoundPath'].includes(from.className)) {
                let to = selected[i + 1];
                if (to.segments.length == from.segments.length) {
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
                // }

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
            let selected = p.project.getItems({ class: Path, selected: true });
            selected.map(v => v.closePath());
            // p.project.selectedItems.forEach(v => {
            //     if (v instanceof p.Path) {
            //         v.closed = !v.closed;
            //     }
            // });
        },
        reverse: _ => {
            p.project.selectedItems.map(v => v.reverse());
        },
        //remove fill
        removeFill: _ => {
            p.project.selectedItems.forEach(v => v.fillColor = null);
        },
        //fit to view
        fitToView: _ => {
            p.project.selectedItems.map(i => i.fitBounds(p.view.bounds))
        },
        fitToLast: _ => {
            let last = p.project.selectedItems[p.project.selectedItems.length - 1];
            p.project.selectedItems.map(i => i.fitBounds(last.bounds));
        },
        normalGrow: function (modSource = Math.random, modScale = 10., modBias = 10.) {
            // randomize path by displacing each segment along the normal at that location
            // get path items
            let paths = p.project.getItems({
                type: 'path',
                selected: true
            });
            // for each path iterate over segments
            paths.forEach(function (path) {
                //let marks = new p.Path();

                // marks.copyAttributes(path);
                // marks.strokeColor = p.paletteInterface.randomColor();
                //let band = new p.CompoundPath();
                let band = new p.Path();
                band.copyAttributes(path);
                band.segments = [];
                band.strokeColor = p.paletteInterface.randomColor();
                // band.fillColor = p.paletteInterface.randomColor();

                path.segments.forEach(function (segment) {
                    let offset = path.getOffsetOf(segment.point);
                    let normal = path.getNormalAt(offset);
                    let displaced = segment.point.add(normal.multiply(modSource() * modScale + modBias)).clone();
                    // marks.add(displaced);
                    //band.addChild(new p.Path.Line(segment.point, displaced));
                    // band.add(segment.point.clone(), displaced, segment.point.add(normal.rotate(90)));
                    band.add(displaced);

                });
                // if (marks.className == 'Path') {
                //     marks.closed = path.closed;
                //     if (p.tools.autoFlatten) marks.flatten(p.tools.flatness);
                //     if (p.tools.autoSimplify) marks.simplify(p.tools.simplicity);
                //     if (p.tools.autoResample) marks.resample(p.tools.samples);
                //     if (p.tools.autoSmooth && !marks.intersects(marks)) marks.smooth({ type: p.tools.smoothType, factor: p.tools.smoothness });
                //     path.parent.addChild(marks);
                // } else {
                //     marks.remove();
                // }
                path.selected = false;

                // let normGrow = band['exclude'](path);
                // if (normGrow.type == 'path') {
                //     normGrow.smooth({ type: p.tools.smoothType, factor: p.tools.smoothFactor });
                //     path.parent.addChild(normGrow); 
                // }
                // band.remove();
                if (band && !band.isEmpty()) {
                    band.closed = path.closed;
                    band.smooth({ type: p.tools.smoothType, factor: p.tools.smoothFactor });

                    path.parent.addChild(band);
                } else {
                    band.remove();
                }
            });

        },


    }

    //////////////////////////////////////////////////////////////////////////////
    p.sourceInterface = {
        type: 'paint', //paint, gradients, palette, reference
    }

    p.gridInterface = {

    }

    /////////////////////////////////////////////////////
    p.paletteInterface = {
        coolors: '000-fff-ff0-0ff-f0f',
        ncolors: 5,
        color0: '#000',
        prob0: .5,
        color1: '#fff',
        prob1: .5,
        color2: '#ff0',
        prob2: 0.5,
        color3: '#0ff',
        prob3: 0.5,
        color4: '#f0f',
        prob4: 0.5,
        color5: '#888',
        prob5: 0.5,
        palette: ['#000', '#fff', '#ff0', '#0ff', '#f0f', '#888'],
        lastIndex: 0,
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

        draw: function (pal, layer, clearfirst) {
            pal = pal || p.paletteInterface.palette;
            layer = layer || p.comp.clipboard;
            clearfirst = clearfirst || true;
            let ncolors = pal.length;
            let w = view.size.width / ncolors;
            let h = view.size.height;


            if (clearfirst) layer.removeChildren();
            for (var i = 0; i < ncolors; i++) {
                var color = pal[i];
                var rect = new Path.Rectangle({
                    point: [i * w, 0],
                    size: [w, h],
                    fillColor: color,
                    //strokeColor:'white'
                });
                layer.addChild(rect);

            }
            layer.visible = true;
            let raster = layer.rasterize();
            raster.name = 'raster_palette';
            layer.removeChildren();

            layer.addChild(raster);
            raster.onLoad = _ => {
                //raster.fitBounds(p.view.bounds);

                // layer.addChild(raster);
            }
        },
        strokeChoice: '#000',
        setCoolors: function (url) {
            url = url || this.coolors;
            return url.split('/').pop().split('-').map(_ => '#' + _);
        }
    }
    // p.paletteInterface.setCoolors(p.paletteInterface.coolors);

}

function setupElements() {
    p.comp = {};

    // background layer
    p.comp.bg = new p.Layer({ name: 'background' });
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
    p.comp.bg.backdrop.name = 'backdrop';
    p.comp.bg.backdrop.update = function () {
        p.comp.bg.backdrop.size = p.view.size;
        //translate back to origin
        p.comp.bg.backdrop.position = [0, 0];
        // p.comp.bg.backdrop.position = p.Point(0,0);
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
    // let layer = new p.Layer(); 
    // layer.name = "Layer 0"; 

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
    // p.project.layers['Layer 0'].activate();
    //layer.bringToFront(); 
    p.project.layerInterface.add();

}

function setupTools() {
    // edit tool
    p.tools.minDistance = 0;
    p.tools.maxDistance = 0;
    p.tools.tolerance = 20;
    p.tools.autoClose = false;
    p.tools.autoSmooth = true;
    p.tools.smoothness = 0.5;
    p.tools.smoothType = 'geometric';//'geometric', 'catmull-rom', 'continuous', 'asymmetric'
    p.tools.autoSimplify = true;
    p.tools.simplicity = 0.5;
    p.tools.autoFlatten = false;
    p.tools.flatness = 0.;
    p.tools.autoResample = true;
    p.tools.samples = 10;

    (_ => {
        let tool = new p.Tool({ name: 'edit' });
        let hitOptions = {
            //'segment', 'handle-in', 'handle-out', 'curve', 'stroke', 'fill', 'bounds', 'center', 'pixel'
            segments: true,
            stroke: true,
            fill: true,
            handles: true,

            tolerance: 20
        };

        let selectedSegment, selectedPath;
        let movePath = false;
        let mouseDownPoint = null;
        tool.selectionPath = null;
        tool.oldPointViewCoords = null;


        tool.onMouseDown = e => {
            selectedSegment = selectedPath = null;
            mouseDownPoint = e.point.clone();
            if (p.Key.isDown('q')) {
                // if (tool.selectionPath) tool.selectionPath.remove();
                tool.selectionPath = new p.Path();
                tool.selectionPath.strokeColor = 'red';
                tool.selectionPath.strokeWidth = 1;
                tool.selectionPath.dashArray = [5, 5];
                tool.selectionPath.add(e.point);
                tool.selectionPath.name = 'selectionPath';
                tool.selectionPath.removeOn({
                    up: true,
                    down: true
                })
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
                    hitResult.fullySelected = true;

                    if (e.item) {
                        // event.item.selected = true;
                        // hitResult.item.selected = true;

                        //e.item.selected = !e.item.selected;
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
            if (p.Key.isDown('b')) { //box selection
                let b = new p.Path.Rectangle(mouseDownPoint, e.point);
                b.removeOn(
                    {
                        drag: true,
                        move: true,
                        up: true,
                    }
                )
                b.strokeColor = 'red';
                b.dashArray = [5, 5];

            } else if (p.Key.isDown('q')) { //lasso selection
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
            // if 'b' is down box select
            if (p.Key.isDown('b')) {
                let rect = new Rectangle(mouseDownPoint, e.point);
                p.project.activeLayer.children.map(i => {
                    if (i.isInside(rect)) {
                        e.modifiers.alt ? i.selected = !i.selected : i.selected = true;
                    } else {
                        if (!e.modifiers.shift) i.selected = false;
                    }
                    // i.isInside(rect) ? i.selected = true : i.selected = false;
                });

            } else if (p.Key.isDown('q')) {
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
                                //c.selected = true;
                                c.selected = e.modifiers.alt ? false : true;
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
            //tool.selectionPath.remove();
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
        tool.oldPointViewCoords = null;

        tool.selectionPath = null;
        tool.oldPointViewCoords = null;

        tool.onMouseDown = function (e) {
            mouseDownPoint = e.point;
            if (p.Key.isDown('b')) {
            } else if (p.Key.isDown('q')) {
                // if (tool.selectionPath) tool.selectionPath.remove();
                tool.selectionPath = new p.Path();
                tool.selectionPath.strokeColor = 'red';
                tool.selectionPath.strokeWidth = 1;
                tool.selectionPath.dashArray = [5, 5];
                tool.selectionPath.add(e.point);
                tool.selectionPath.name = 'selectionPath';
                tool.selectionPath.removeOn({
                    up: true,
                    down: true
                })
            } else if (p.Key.isDown('space')) { //pan view
                tool.oldPointViewCoords = p.view.projectToView(e.point);
            } else {
                path = new p.Path();
                // path.strokeColor = paramPalette.randomColor();
                // path.strokeColor = p.Color.random();
                path.strokeColor = p.brushInterface.getStrokeColor();
                path.fillColor = p.brushInterface.getFillColor();
                path.strokeWidth = p.brushInterface.getStrokeWidth();
                path.blendMode = p.brushInterface.blendMode;
                path.opacity = p.brushInterface.getOpacity();

                path.add(e.point);
            }
        }

        tool.onMouseDrag = e => {
            if (p.Key.isDown('b')) {
                let b = new p.Path.Rectangle(mouseDownPoint, e.point);
                b.removeOn(
                    {
                        drag: true,
                        move: true,
                        up: true,
                    }
                )
                b.strokeColor = 'red';
                b.dashArray = [5, 5];

            } else if (p.Key.isDown('q')) { //lasso selection
                tool.selectionPath.add(e.point);
            } else if (p.Key.isDown('space')) { //pan view
                const delta = e.point.subtract(p.view.viewToProject(tool.oldPointViewCoords));
                tool.oldPointViewCoords = p.view.projectToView(e.point);
                p.view.translate(delta);
            }
            else { //draw
                path.add(e.point);
                if (p.tools.autoSmooth) path.smooth({ type: p.tools.smoothType, factor: p.tools.smoothness });
                if (p.tools.autoFlatten) path.flatten(p.tools.flatness);
                // if(p.tools.autoSimplify) path.simplify();
            }
        }

        tool.onMouseUp = function (e) {
            if (p.Key.isDown('b')) {
                let rect = new Rectangle(mouseDownPoint, e.point);
                p.project.activeLayer.children.map(i => {
                    if (i.isInside(rect)) {
                        e.modifiers.alt ? i.selected = !i.selected : i.selected = true;
                    } else {
                        if (!e.modifiers.shift) i.selected = false;
                    }
                    // i.isInside(rect) ? i.selected = true : i.selected = false;
                });
            } else if (p.Key.isDown('q')) {
                // if (e.item) {
                tool.selectionPath.add(e.point);
                tool.selectionPath.smooth();
                tool.selectionPath.closed = true;
                tool.selectionPath.simplify();
                //tool.selectionPath.remove();
                p.project.activeLayer.children.map(c => {
                    let selected = false;
                    if (c.segments) {
                        c.segments.map(s => {
                            selected = selected || tool.selectionPath.contains(s.point);
                            if (selected) {
                                c.selected = e.modifiers.alt ? false : true;
                                return;
                            }
                        });
                    }

                });

            }
            else { //draw
                if (e.point.equals(mouseDownPoint)) {
                    // // path.remove();
                    // path.replaceWith(new p.Path
                    //     .Circle({
                    //         center: mouseDownPoint,
                    //         radius: p.brushInterface.strokeWidth,
                    //         strokeColor: p.brushInterface.getStrokeColor(),
                    //         fillColor: p.brushInterface.getFillColor(),
                    //     }));
                } else {
                    mouseUpPoint = e.point;
                    path.add(mouseUpPoint);

                    if (e.modifiers.alt || p.tools.autoClose) {
                        path.closed = true;
                    }
                    if (e.modifiers.meta)
                        // path.fillColor = p.Color.random();
                        //  path.fillColor = p.brushInterface.getFillColor();
                        path.selected = true;

                    if (!e.modifiers.shift) {

                        if (p.tools.autoFlatten) path.flatten(p.tools.flatness);
                        if (p.tools.autoSimplify) path.simplify(p.tools.simplicity);
                        if (p.tools.autoResample) path.resample(p.tools.samples);
                        if (path.segments.length > 2 && p.tools.autoSmooth) path.smooth({ type: p.tools.smoothType, factor: p.tools.smoothness });

                        p
                        //path.selected = true; 
                    }

                }
                path = null;
            }
        }
    })();

    // handles tool
    (_ => {
        let tool = new p.Tool({ name: 'handles' });
        tool.minDistance = p.tools.minDistance;
        tool.maxDistance = p.tools.maxDistance;
        tool.hitResult = null;
        tool.hitOptions = {
            //type:'PathItem',
            segments: true,
            stroke: true,
            handles: true,
            tolerance: p.tools.tolerance,
        }
        tool.dragMap = {
            'stroke': 'curve',
            'segment': 'point',
            'handle-in': 'handleIn',
            'handle-out': 'handleOut',
        }
        // tool.onMouseMove = e=>{
        //     let hitResult = p.project.hitTest(e.point, tool.hitOptions);
        //     p.project.deselectAll();
        //     if (hitResult) {
        //         hitResult.item.selected = true;
        //         hitResult.item.segments.map(s=>{
        //             s.selected = true;
        //         });
        //     }
        // }
        tool.onMouseDown = e => {
            hitResult = p.project.hitTest(e.point, tool.hitOptions);
            if (hitResult) {
                hitResult.item.selected = true;
                hitResult.item.segments.map(s => {
                    s.selected = true;
                });
            }
        }
        tool.onMouseDrag = e => {
            hitResult.segment[tool.dragMap[hitResult.type]] =
                hitResult.segment[tool.dragMap[hitResult.type]].add(e.delta);

        }
    })();


    p.tools.activeTool = 'pencil';
    p.tools.lastTool = 'edit';
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

        document.addEventListener('keydown', e => {
            //select all elements in a layer on cmd-a
            if (e.keyCode === 65 && e.metaKey) {
                e.preventDefault();
                p.project.activeLayer.children.map(c => c.selected = true);
            }
            //delete selected elements on cmd-d
            if (e.keyCode === 68 && e.metaKey) {
                e.preventDefault();
                //count backwards and remove
                for (let i = p.project.selectedItems.length - 1; i >= 0; i--) {
                    p.project.selectedItems[i].remove();
                }
            }
            //delete all elements on cmd-shift-d
            if (e.keyCode === 68 && e.shiftKey && e.metaKey) {
                e.preventDefault();
                for (let i = p.project.activeLayer.children.length - 1; i >= 0; i--) {
                    p.project.activeLayer.children[i].remove();
                }
            }
            //toggle selected elements on cmd-opt-a or t 
           if ( (e.keyCode === 84 || e.keyCode===65)  && e.altKey &&  e.metaKey) {
                e.preventDefault();
                for(let i=0;i<p.project.activeLayer.children.length;i++) {
                    let s = p.project.activeLayer.children[i].selected;
                    p.project.activeLayer.children[i].selected = !s;
                }
               // p.project.activeLayer.children.forEach(c => c.selected = !c.selected);
            }
            
            //uselect all on cmd-shift-a
            if (e.keyCode === 65 && e.shiftKey && e.metaKey) {
                e.preventDefault();
                p.project.selectedItems.map(c => c.selected = false);
            }

            //reset the view on cmd-option-v
            if (e.keyCode === 86 && e.metaKey && e.altKey) {
                e.preventDefault();
                let x = p.view.bounds.x;
                let y = p.view.bounds.y;
                p.view.zoom = 1.;
                p.view.translate(x, y);
                x = p.view.bounds.x;
                y = p.view.bounds.y;
                // p.view.zoom = 1.;
                p.view.translate(x, y);
            }

            //toggle gui view
            if ((e.keyCode == 71 && e.altKey)) {
                if (e.shiftKey) { gui.closed ? gui.open() : gui.close(); }
                else {
                    gui.domElement.style.display = gui.domElement.style.display == 'none' ? 'block' : 'none';
                }
            }
            //add event handler for escape key
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
            // on meta+x key press cut
            if (e.keyCode === 88 && e.metaKey) {
                p.actionInterface.cut();
            }
            // on meta+c key press copy
            if (e.keyCode === 67 && e.metaKey) {
                p.actionInterface.copy();
            }
            // on meta+v key press paste
            if (e.keyCode === 86 && e.metaKey) {
                p.actionInterface.paste();
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
    guiToolFolder.add(p.tools, 'autoClose');
    guiToolFolder.add(p.tools, 'autoSmooth');
    guiToolFolder.add(p.tools, 'smoothness', -10., 10., 0.01);
    guiToolFolder.add(p.tools, 'smoothType', ['geometric', 'catmull-rom', 'continuous', 'asymmetric']);

    guiToolFolder.add(p.tools, 'autoSimplify');
    guiToolFolder.add(p.tools, 'simplicity', 0., 100., 0.01);

    guiToolFolder.add(p.tools, 'autoFlatten');
    guiToolFolder.add(p.tools, 'flatness', 0., 100., 0.01);

    guiToolFolder.add(p.tools, 'autoResample');
    guiToolFolder.add(p.tools, 'samples', 2, 1000, 1);

    //guiToolFolder.open();

    //////////////////////////////////////////////
    const guiBrushFolder = gui.addFolder('Brush');
    guiBrushFolder.add(p.brushInterface, 'strokeMethod', ['fixedStroke', 'fixedFill', 'random', 'none', 'paletternd', 'paletteindex']);
    guiBrushFolder.add(p.brushInterface, 'fillMethod', ['fixedStroke', 'fixedFill', 'random', 'none', 'paletternd', 'paletteindex']);
    guiBrushFolder.addColor(p.brushInterface, 'strokeColor');
    guiBrushFolder.add(p.brushInterface, 'updateStrokeColor');
    guiBrushFolder.addColor(p.brushInterface, 'fillColor');
    guiBrushFolder.add(p.brushInterface, 'updateFillColor');
    guiBrushFolder.add(p.brushInterface, 'strokeWidth', 0., 100., 0.1);
    guiBrushFolder.add(p.brushInterface, 'updateStrokeWidth');
    guiBrushFolder.add(p.brushInterface, 'opacity', 0., 1., 0.01);
    guiBrushFolder.add(p.brushInterface, 'updateOpacity');
    guiBrushFolder.add(p.brushInterface, 'blendMode', p.blendModes);
    guiBrushFolder.add(p.brushInterface, 'updateBlendMode');
    guiBrushFolder.add(p.brushInterface, 'palettize');
    //////////////////////////////////////////////

    const guiLayerFolder = gui.addFolder('Layers');
    //add button to add a new layer
    guiLayerFolder.add({
        layerPanel: _ => paperjsLayersPanel.create({
            title: '', draggable: true
        })
    }, 'layerPanel').name('layer panel');

    let guiCurrentLayer = guiLayerFolder
        .add(p.project.layerInterface, 'current',
            p.project.layers.map(l => l.name)).onFinishChange(guiUpdateLayerName).listen();


    function guiUpdateLayerName(name) {
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
    p.project.layerInterface.current = p.project.activeLayer.name;
    p.project.layerInterface.name = p.project.activeLayer.name;

    // guiLayerFolder.add(p.project.layerInterface, 'locked')
    //     .onChange(_ => p.project.activeLayer.locked = _);
    // guiLayerFolder.add(p.project.layerInterface, 'visible')
    //     .onChange(_ => p.project.activeLayer.visible = _);
    // guiLayerFolder.add(p.project.layerInterface, 'selected')
    //     .onChange(_ => p.project.activeLayer.selected = _);

    //guiLayerFolder.open();

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

    ////////////////////////////////////////////////////////////
    const guiPalette = gui.addFolder('Palette');
    guiPalette.add(p.paletteInterface, 'coolors')
        .onChange(_ => {
            let parsed = p.paletteInterface.setCoolors(_);
            console.log(parsed);
            p.paletteInterface.ncolors = Math.min(parsed.length, 6);
            for (let i = 0; i < p.paletteInterface.ncolors; i++) {
                p.paletteInterface[`color${i}`] = parsed[i];
            }
        }).listen();
    guiPalette.addColor(p.paletteInterface, 'color0').listen();
    guiPalette.addColor(p.paletteInterface, 'color1').listen();
    guiPalette.addColor(p.paletteInterface, 'color2').listen();
    guiPalette.addColor(p.paletteInterface, 'color3').listen();
    guiPalette.addColor(p.paletteInterface, 'color4').listen();
    guiPalette.addColor(p.paletteInterface, 'color5').listen();
    guiPalette.add(p.paletteInterface, 'prob0', 0, 1).step(0.01);
    guiPalette.add(p.paletteInterface, 'prob1', 0, 1).step(0.01);
    guiPalette.add(p.paletteInterface, 'prob2', 0, 1).step(0.01);
    guiPalette.add(p.paletteInterface, 'prob3', 0, 1).step(0.01);
    guiPalette.add(p.paletteInterface, 'prob4', 0, 1).step(0.01);
    guiPalette.add(p.paletteInterface, 'prob5', 0, 1).step(0.01);
    guiPalette.add(p.paletteInterface, 'ncolors', 1, 256).step(1).listen();
    guiPalette.add(p.paletteInterface, 'build').name('update');
    guiPalette.add(p.paletteInterface, 'draw').onChange(_ => p.paletteInterface.draw(layer = p.comp.clipboard));
    //  guiPalette.add(p.paletteInterface, 'strokeChoice', ['black', 'white', 'random', 'color0', 'color1', 'color2', 'color3', 'color4', 'color5']);


    gui.remember(p.paletteInterface);

    const guiProcess = gui.addFolder('Process')
    guiProcess.add(p.processInterface, 'boolOp', p.bools);
    guiProcess.add(p.processInterface, 'boolOperate');
    guiProcess.add(p.processInterface, 'bool');
    guiProcess.add(p.processInterface, 'smooth');
    guiProcess.add(p.processInterface, 'smoothness', -10., 10., 0.01);
    guiProcess.add(p.processInterface, 'smoothType', ['geometric', 'catmull-rom', 'continuous', 'asymmetric']);
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
    guiProcess.add(p.processInterface, 'fitToView');
    guiProcess.add(p.processInterface, 'fitToLast');
    guiProcess.add(p.processInterface, 'reverse');
    guiProcess.add(p.processInterface, 'normalGrow');

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
                        let raster = new p.Raster(image);
                        //fit raster inside canvas
                        // raster.position.x = (p.comp.size.width - raster.bounds.width) / 2;
                        // raster.position.y = (p.comp.size.height - raster.bounds.height) / 2;
                        // p.project.addLayer(raster);
                        raster.onLoad = _ => {
                            console.log(raster);
                            raster.fitBounds(p.view.bounds);
                            raster.fitBounds(p.comp.bg.backdrop.bounds);
                            // p.comp.src.addChild(raster);
                        }





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
        canvas2Raster:
            _ => {
                let raster = new p.Raster(canvas.toDataURL('image/png'));
                raster.name = 'canvas2raster';
                raster.onLoad = _ => {
                    raster.fitBounds(p.view.bounds);
                    p.project.addLayer(raster);
                }
            }
    }, 'canvas2Raster').name('canvas to raster');

    guiIOFolder.add({
        selection2Raster:
            _ => {
                let selectionGroup = new p.Group(p.project.selectedItems);
                let raster = selectionGroup.rasterize();
                raster.onLoad = _ => {
                    raster.fitBounds(p.view.bounds);
                    p.project.addLayer(raster);

                }
                if (p.Key.isDown('alt')) {
                    for (let i = p.project.selectedItems.length - 1; i >= 0; i--) {
                        p.project.selectedItems[i].remove();
                    }
                    selectionGroup.remove();
                }
            }
    }, 'selection2Raster').name('selection to raster');


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
    guiActionFolder.add(p.actionInterface, 'select');
    guiActionFolder.add(p.actionInterface, 'selectProbability', 0., 1., 0.01);

    guiActionFolder.add(p.actionInterface, 'visibility');
    guiActionFolder.add(p.actionInterface, 'blendModeRnd');

    ///////////////////////////////////////////
    // const guiColorFlder = gui.addFolder('Colors');
    // guiColorFlder.addColor(p.colorInterface, 'color1');
    // guiColorFlder.addColor(p.colorInterface, 'color2');
    // guiColorFlder.addColor(p.colorInterface, 'color3');
    // guiColorFlder.addColor(p.colorInterface, 'color4');
    // guiColorFlder.add(p.colorInterface, 'removeStroke');
    // guiColorFlder.add(p.colorInterface, 'removeFill');





}