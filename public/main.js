import * as THREE from './libs/three.js';
import { OrbitControls } from './libs/three-orbitcontrols.js';
import { GLTFLoader } from './libs/three-gltfloader.js';

const minussize = 200;

const renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight - minussize);
document.getElementById('renderer').appendChild(renderer.domElement);
//renderer.shadowMap.enabled = true;
//renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / (window.innerHeight - minussize), 0.1, 1000);
camera.position.set(0, 3, 3);
camera.lookAt(new THREE.Vector3(0, 0, 0));

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(-1, -1);

// Mouse event for finder
function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / (window.innerHeight - minussize)) * 2 + 1;
}

document.addEventListener('mousemove', onMouseMove);
window.addEventListener('resize', onWindowResize, false);

// Fix Camera
function onWindowResize() {
    camera.aspect = window.innerWidth / (window.innerHeight - minussize);
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight - minussize);
}

// Setup Lights
[[5, 5, 5], [5, 5, -5], [-5, 5, 5], [-5, 5, -5]].forEach(coords => {
    const light = new THREE.PointLight(0xffffff, 1);
    light.position.set(...coords);

    light.castShadow = false; // default false
    light.shadow.mapSize.width = 10;
    light.shadow.mapSize.height = 10;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 10;

    scene.add(light);
})

const loader = new GLTFLoader();
loader.load('stern.glb', function (gltf) {
    console.log('loaded')
    gltf.scene.children.forEach((child) => {
        child.material = new THREE.MeshStandardMaterial({
            color: '',
            side: THREE.DoubleSide,
        });
        //child.receiveShadow = true;
    });
    const model = gltf.scene;
    scene.add(model);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.autoRotate = true;
    controls.enableDamping = true;

    camera.position.z = 40;
    console.log(camera.position);

    // on f press
    document.addEventListener('keydown', (event) => {
        const keyName = event.key;
        if (keyName === 'f') {
            params.finder = !params.finder;
        }
    });


    function findHoveredChildren() {
        if (params.finder) {
            // update the picking ray with the camera and mouse position
            raycaster.setFromCamera(mouse, camera);

            // calculate objects intersecting the picking ray
            const intersects = raycaster.intersectObjects(model.children);
            drawColors()
            advanced.children.forEach((child) => {
                child.domElement.style.backgroundColor = '';
            });

            if (intersects.length > 0) {
                intersects[0].object.material.color.set(0xff0000);
                advanced.children.find((child) => child._name === intersects[0].object.name).domElement.style.backgroundColor = 'red'
            }
        }
    }

    const params = {
        finder: false,
        wishlist: false,
        color1: 'No Color',
        color2: 'No Color',
        color3: 'No Color',
        advanced: {},
    };

    model.children.forEach((child, index) => {
        params.advanced[child.name] = 'No Color';
    });

    const coloroptions = {
        'No Color': '',
        Rot: '#ff0000',
        Blau: '#006fff',
        Grün: '#00ff00',
        Gelb: '#ffcc00',
        Weiß: '#ffffff',
        'Violett 2015': '#A020F0',
        'Orange 2016': '#ff3800',
        'Türkis 2017': '#00ffff',
        'Magenta 2018': '#ff00ff',
        'Limone 2019': '#ddff00',
        'Mint 2020': '#00ff80',
        'Rosa 2021': '#ff0080',
        'Silber 2022': '#cecfd2',
        'Gold': '#ffd700',
    }

    const gui = new lil.GUI();
    gui.add({
        save: () => {
            // copy camera position
            const camerapos = camera.position.clone();
            camera.position.set(-15, 3, 37);
            controls.update();
            findHoveredChildren();
            renderer.render(scene, camera);
            const dataURL = renderer.domElement.toDataURL();
            // send to params to api without finder
            const data = { ...params };
            delete data.finder;
            data.img = dataURL;
            fetch('/api', {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(async (res) => {
                camera.position.set(camerapos.x, camerapos.y, camerapos.z);
                loadStars(await res.json())
            });
        }
    }, 'save')
    gui.add(params, 'finder').name('Finder (toggle with F)').listen();
    gui.add(params, 'wishlist').name('Wishlist').listen();
    gui.add(params, 'color1', Object.keys(coloroptions)).listen().onChange(() => updateColors())
    gui.add(params, 'color2', Object.keys(coloroptions)).listen().onChange(() => updateColors())
    gui.add(params, 'color3', Object.keys(coloroptions)).listen().onChange(() => updateColors())
    const advanced = gui.addFolder('Advanced', {
        collapsed: true
    });
    model.children.forEach(child => {
        advanced.add(params.advanced, child.name, Object.keys(coloroptions)).listen().onChange((_) => drawColors());
    });
    advanced.close();

    const coloringrules = {
        1: [model.children.map((child) => child.name)],
        2: [
            ['top', 'bottom', 'topbackleft', 'bottombackleft', 'topbackright', 'bottombackright', 'right', 'left', 'back', 'front', 'topfrontleft', 'bottomfrontleft', 'topfrontright', 'bottomfrontright'],
            ['topright', 'bottomright', 'topleft', 'bottomleft', 'topback', 'bottomback', 'topfront', 'bottomfront', 'backleft', 'backright', 'frontleft', 'frontright'],
        ],
        3: [
            ['top', 'bottom', 'left', 'right', 'back', 'front'],
            ['topright', 'bottomright', 'topleft', 'bottomleft', 'topback', 'bottomback', 'topfront', 'bottomfront', 'backleft', 'backright', 'frontleft', 'frontright'],
            ['topfrontleft', 'bottomfrontleft', 'topfrontright', 'bottomfrontright', 'topbackleft', 'bottombackleft', 'topbackright', 'bottombackright']
        ]
    }

    function updateColors() {
        const colorlist = [...Object.entries(params).filter(entry => entry[0].startsWith('color')).map(entry => entry[1])].filter((color) => color !== 'No Color');
        if (colorlist.length === 0) {
            Object.keys(params.advanced).forEach((key) => {
                params.advanced[key] = '';
            });
        } else {
            coloringrules[colorlist.length].forEach((rule, index) => {
                rule.forEach((part) => {
                    params.advanced[part] = colorlist[index];
                });
            });
        }
        drawColors();
    }

    function drawColors() {
        model.children.forEach((child) => {
            child.material.color = new THREE.Color(coloroptions[params.advanced[child.name]]);
        });
    }

    function animate() {
        requestAnimationFrame(animate);

        controls.update();
        findHoveredChildren();
        renderer.render(scene, camera);
    }
    animate();

    function loadStars(stars) {
        stars.reverse();
        document.getElementById('inventory').innerHTML = '';
        stars.forEach((star) => {
            const div = document.createElement('div');
            div.className = 'star';
            const button = document.createElement('button');
            button.className = 'deletebutton';
            button.innerText = 'delete';
            button.addEventListener('click', () => {
                fetch('/api/' + star.id, {
                    method: 'DELETE'
                }).then(async (res) => {
                    loadStars(await res.json());
                });
            });
            div.appendChild(button);
            const img = document.createElement('img');
            img.src = star.img;
            div.onclick = () => {
                Object.entries(star).forEach((entry) => {
                    if (entry[0] === 'img') return;
                    if (entry[0] === 'finder') return;
                    if (entry[0] === 'advanced') {
                        Object.entries(entry[1]).forEach((advancedentry) => {
                            params.advanced[advancedentry[0]] = advancedentry[1];
                        });
                    } else {
                        params[entry[0]] = entry[1];
                    }
                });
                drawColors();
            };
            div.style.borderColor = star.wishlist ? 'red' : 'white';
            div.appendChild(img);
            document.getElementById('inventory').appendChild(div);
        });
    }
    fetch('/api').then(res => res.json()).then(stars => {
        loadStars(stars);
    });
}, undefined, function (error) {
    console.error(error);
});