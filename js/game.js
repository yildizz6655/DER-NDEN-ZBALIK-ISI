
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

// FISHING WORLD GAME ENGINE

let scene, camera, renderer;
let boat;
let speed = 0;
let steering = 0;
let throttle = 0;
let gameStarted = false;
let thirdPerson = true;

const keys = {};
const clock = new THREE.Clock();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x83d5ff);
    scene.fog = new THREE.Fog(0x83d5ff, 80, 350);

    camera = new THREE.PerspectiveCamera(
        70,
        innerWidth / innerHeight,
        0.1,
        1000
    );

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });

    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    document.getElementById("game").appendChild(renderer.domElement);

    // LIGHTING
    const sunlight = new THREE.DirectionalLight(0xffffff, 2);
    sunlight.position.set(50, 100, 30);
    scene.add(sunlight);

    scene.add(new THREE.HemisphereLight(0xaddfff, 0x174b38, 1.5));

    // WATER
    const water = new THREE.Mesh(
        new THREE.PlaneGeometry(1000, 1000),
        new THREE.MeshStandardMaterial({
            color: 0x087eae,
            roughness: 0.25,
            metalness: 0.25
        })
    );

    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.7;
    scene.add(water);

    // ISLANDS
    createIsland(-55, -65, 20);
    createIsland(70, -110, 30);
    createIsland(100, 70, 25);
    createIsland(-100, 100, 35);

    // BOAT
    boat = new THREE.Group();

    const hull = new THREE.Mesh(
        new THREE.BoxGeometry(2.7, 0.8, 6),
        new THREE.MeshStandardMaterial({
            color: 0x172f45
        })
    );
    boat.add(hull);

    const deck = new THREE.Mesh(
        new THREE.BoxGeometry(2.3, 0.3, 4),
        new THREE.MeshStandardMaterial({
            color: 0xf0f4f5
        })
    );
    deck.position.y = 0.5;
    boat.add(deck);

    const seat = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.9, 1),
        new THREE.MeshStandardMaterial({
            color: 0x273849
        })
    );
    seat.position.set(0, 1, 0.5);
    boat.add(seat);

    const windshield = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.7, 0.1),
        new THREE.MeshStandardMaterial({
            color: 0x67c9ed,
            transparent: true,
            opacity: 0.7
        })
    );
    windshield.position.set(0, 1.3, -0.7);
    boat.add(windshield);

    boat.position.set(0, 0, 0);
    scene.add(boat);

    camera.position.set(0, 7, 12);
    camera.lookAt(boat.position);

    setupControls();
    animate();
}

// ISLAND GENERATOR
function createIsland(x, z, size) {
    const island = new THREE.Group();

    const sand = new THREE.Mesh(
        new THREE.CylinderGeometry(size, size + 5, 3, 32),
        new THREE.MeshStandardMaterial({
            color: 0xcdbb79
        })
    );
    sand.position.y = -1;
    island.add(sand);

    const grass = new THREE.Mesh(
        new THREE.CylinderGeometry(size - 3, size, 3, 32),
        new THREE.MeshStandardMaterial({
            color: 0x32934d
        })
    );
    grass.position.y = 0.5;
    island.add(grass);

    for (let i = 0; i < 12; i++) {
        const tree = new THREE.Group();

        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.4, 3),
            new THREE.MeshStandardMaterial({
                color: 0x704321
            })
        );
        trunk.position.y = 1.5;
        tree.add(trunk);

        const leaves = new THREE.Mesh(
            new THREE.ConeGeometry(2, 4, 8),
            new THREE.MeshStandardMaterial({
                color: 0x126b36
            })
        );
        leaves.position.y = 4;
        tree.add(leaves);

        tree.position.set(
            (Math.random() - 0.5) * size * 1.5,
            1,
            (Math.random() - 0.5) * size * 1.5
        );

        island.add(tree);
    }

    island.position.set(x, 0, z);
    scene.add(island);
}

// CONTROLS
function setupControls() {
    bindButton("left", -1);
    bindButton("right", 1);
    bindButton("forward", 2);

    document.getElementById("camera").onclick = () => {
        thirdPerson = !thirdPerson;
    };

    window.addEventListener("keydown", e => {
        keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener("keyup", e => {
        keys[e.key.toLowerCase()] = false;
    });
}

function bindButton(id, value) {
    const button = document.getElementById(id);

    button.addEventListener("pointerdown", e => {
        e.preventDefault();
        button.setPointerCapture(e.pointerId);

        if (value === 2) throttle = 1;
        else steering = value;
    });

    function release() {
        if (value === 2) throttle = 0;
        else steering = 0;
    }

    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
}

// GAME START
window.startGame = function() {
    if (!renderer) init();

    gameStarted = true;
    document.getElementById("menu").style.display = "none";
    document.getElementById("hud").style.display = "block";
};

// UPDATE
function update(delta) {
    if (!gameStarted) return;

    let turn = steering;

    if (keys["arrowleft"] || keys["a"]) turn = -1;
    if (keys["arrowright"] || keys["d"]) turn = 1;

    let power = throttle;

    if (keys["arrowup"] || keys["w"]) power = 1;
    if (keys["arrowdown"] || keys["s"]) power = -1;

    speed += power * 12 * delta;
    speed *= Math.pow(0.985, delta * 60);
    speed = THREE.MathUtils.clamp(speed, -12, 35);

    boat.rotation.y += turn * speed * 0.035 * delta;

    boat.position.x -= Math.sin(boat.rotation.y) * speed * delta;
    boat.position.z -= Math.cos(boat.rotation.y) * speed * delta;

    boat.position.y = Math.sin(clock.elapsedTime * 2) * 0.12;

    // CAMERA
    const distance = thirdPerson ? 12 : 3;
    const height = thirdPerson ? 7 : 2.5;

    const target = new THREE.Vector3(
        boat.position.x + Math.sin(boat.rotation.y) * distance,
        boat.position.y + height,
        boat.position.z + Math.cos(boat.rotation.y) * distance
    );

    camera.position.lerp(target, 0.06);

    camera.lookAt(
        boat.position.x,
        boat.position.y + 0.5,
        boat.position.z
    );

    document.getElementById("money").textContent = "1.000";
    document.getElementById("message").textContent =
        "🚤 Hız: " + Math.abs(Math.round(speed)) + " KM/H";
}

// MAIN LOOP
function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);

    update(delta);

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// RESIZE
window.addEventListener("resize", () => {
    if (!camera || !renderer) return;

    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});
      
