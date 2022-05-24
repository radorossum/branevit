const state = {
    points: 5,
    animate: true,
    options: ['a', 'b', 'c'],
    layer: [1, 2, 3, 4, 5],
    radio: ['a', 'b', 'c'],
    scheme: [
        'ffffff-000000',
        'https://coolors.co/002626-0e4749-95c623-e55812-efe7da',
        'https://coolors.co/003049-d62828-f77f00-fcbf49-eae2b7',
        'https://coolors.co/20bf55-0b4f6c-01baef-fbfbff-757575',
        'https://coolors.co/1a535c-4ecdc4-f7fff7-ff6b6b-ffe66d',
        'https://coolors.co/cc211a-234ec3-f6dc28-e8ebf7-acbed8',
        'https://coolors.co/5d737e-64b6ac-c0fdfb-daffef-fcfffd',
        'https://coolors.co/ff9f1c-ffbf69-ffffff-cbf3f0-2ec4b6',
        'https://coolors.co/50514f-f25f5c-ffe066-247ba0-70c1b3'
    ]
};

const buildGui = () => {
    const url2c = url =>
        url.split('/').pop().split('-').map(c => '#' + c);

    const gui = new dat.GUI();


    //create gui buttons
    gui.add(state, 'points', 0, 4).step(.1).onChange(() => {
        console.log(state.points);
    });
    gui.add(state, 'animate').onChange(() => {
        console.log(state.animate);
    });

    //add folder for options
    const optionsFolder = gui.addFolder('Options');
    optionsFolder.add(state, 'options', ['a', 'b', 'c']).onChange(() => {
        console.log(state.options);
    });
    gui.add(state, 'scheme', state.scheme.map(c => url2c(c)));
    //add radio buttons
    gui.add(state, 'radio', {
        'a': 1,
        'b': 2,
        'c': 3
    }).onChange(() => {
        console.log(state.radio);
    }
    );

    gui.hide();
    //add document keybindings to toggle gui with alt+g
    document.addEventListener('keydown', (e) => {
        if (e.keyCode == 71 && e.altKey) {

            gui.domElement.style.display === 'none' ? gui.domElement.style.display = 'block' : gui.domElement.style.display = 'none';
        }
        // close the gui with alt+shift+uparrow
        if (e.keyCode == 38 && e.altKey && e.shiftKey) {
            gui.close()
        }
        // open the gui with alt+shift+downarrow
        if (e.keyCode == 40 && e.altKey && e.shiftKey) {
            gui.open()
        }

    });
}

//when the window is loaded, call the buildGui function
window.onload = buildGui;