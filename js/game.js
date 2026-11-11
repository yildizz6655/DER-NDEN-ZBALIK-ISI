
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

let scene, camera, renderer, boat;
let speed = 0;
let throttle = 0;
let steering = 0;
let thirdPerson = true;
let started = false;
let animationStarted = false;

const clock = new THREE.Clock();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x83d5ff);
    scene.fog = new THREE.Fog(0x83d5ff, 100, 450);

    camera = new THREE.PerspectiveCamera(
        70, innerWidth / innerHeight, 0.1, 1000
    );

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    document.getElementById("game").appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xbdeaff, 0x285b39, 2));

    const sun = new THREE.DirectionalLight(0xffffff, 2);
    sun.position.set(50, 100, 30);
    scene.add(sun);

    // DENİZ
    const waterGeometry = new THREE.PlaneGeometry(1200, 1200, 100, 100);
    const waterMaterial = new THREE.MeshStandardMaterial({
        color: 0x087eae,
        roughness: 0.25,
        metalness: 0.25,
        flatShading: true
    });

    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.7;
    scene.add(water);

    // ADALAR
    createIsland(-65, -75, 23);
    createIsland(85, -120, 30);
    createIsland(120, 80, 27);
    createIsland(-110, 115, 35);

    // TEKNE
    boat = new THREE.Group();

    const hull = new THREE.Mesh(
        new THREE.BoxGeometry(2.7, 0.8, 6),
        new THREE.MeshStandardMaterial({ color: 0x172f45 })
    );
    boat.add(hull);

    const deck = new THREE.Mesh(
        new THREE.BoxGeometry(2.3, 0.3, 4),
        new THREE.MeshStandardMaterial({ color: 0xf4f4f4 })
    );
    deck.position.y = 0.5;
    boat.add(deck);

    const seat = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.9, 1),
        new THREE.MeshStandardMaterial({ color: 0x293d50 })
    );
    seat.position.set(0, 1, 0.5);
    boat.add(seat);

    const windshield = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.7, 0.1),
        new THREE.MeshStandardMaterial({
            color: 0x66cfff,
            transparent: true,
            opacity: 0.7
        })
    );
    windshield.position.set(0, 1.3, -0.7);
    boat.add(windshield);

    scene.add(boat);

    camera.position.set(0, 7, 12);
    camera.lookAt(boat.position);

    setupControls();
    animationStarted = true;
    animate();
}

// ADA OLUŞTURMA
function createIsland(x, z, size) {
    const island = new THREE.Group();

    const sand = new THREE.Mesh(
        new THREE.CylinderGeometry(size, size + 5, 3, 32),
        new THREE.MeshStandardMaterial({ color: 0xcdbb79 })
    );
    sand.position.y = -1;
    island.add(sand);

    const grass = new THREE.Mesh(
        new THREE.CylinderGeometry(size - 3, size, 3, 32),
        new THREE.MeshStandardMaterial({ color: 0x32934d })
    );
    grass.position.y = 0.5;
    island.add(grass);

    for (let i = 0; i < 12; i++) {
        const tree = new THREE.Group();

        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.4, 3),
            new THREE.MeshStandardMaterial({ color: 0x704321 })
        );
        trunk.position.y = 1.5;
        tree.add(trunk);

        const leaves = new THREE.Mesh(
            new THREE.ConeGeometry(2, 4, 8),
            new THREE.MeshStandardMaterial({ color: 0x126b36 })
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

// KONTROLLER
function setupControls() {
    const wheel = document.getElementById("steering-wheel");
    const throttleArea = document.getElementById("throttle");
    const handle = document.getElementById("throttle-handle");

    let wheelActive = false;
    let leverActive = false;

    wheel.addEventListener("pointerdown", e => {
        wheelActive = true;
        wheel.setPointerCapture(e.pointerId);
        moveWheel(e);
    });

    wheel.addEventListener("pointermove", e => {
        if (wheelActive) moveWheel(e);
    });

    function moveWheel(e) {
        const rect = wheel.getBoundingClientRect();
        const center = rect.left + rect.width / 2;

        steering = THREE.MathUtils.clamp(
            (e.clientX - center) / (rect.width * 0.42),
            -1, 1
        );

        wheel.style.transform = `rotate(${steering * 135}deg)`;
    }

    function releaseWheel() {
        wheelActive = false;
        steering = 0;
        wheel.style.transform = "rotate(0deg)";
    }

    wheel.addEventListener("pointerup", releaseWheel);
    wheel.addEventListener("pointercancel", releaseWheel);

    throttleArea.addEventListener("pointerdown", e => {
        leverActive = true;
        throttleArea.setPointerCapture(e.pointerId);
        moveLever(e);
    });

    throttleArea.addEventListener("pointermove", e => {
        if (leverActive) moveLever(e);
    });

    function moveLever(e) {
        const rect = throttleArea.getBoundingClientRect();

        const y = THREE.MathUtils.clamp(
            (e.clientY - rect.top - 20) / (rect.height - 40),
            0, 1
        );

        throttle = 1 - y * 2;
        handle.style.top = `${15 + y * 70}%`;
    }

    function releaseLever() {
        leverActive = false;
        throttle = 0;
        handle.style.top = "50%";
    }

    throttleArea.addEventListener("pointerup", releaseLever);
    throttleArea.addEventListener("pointercancel", releaseLever);

    // KLAVYE
    window.addEventListener("keydown", e => {
        keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener("keyup", e => {
        keys[e.key.toLowerCase()] = false;
    });

    document.getElementById("camera").onclick = () => {
        thirdPerson = !thirdPerson;
    };
}

const keys = {};

// OYUNU BAŞLAT
window.startGame = function() {
    if (!animationStarted) init();

    started = true;
    document.getElementById("menu").style.display = "none";
    document.getElementById("hud").style.display = "block";
};

// OYUN GÜNCELLEME
function update(delta) {
    if (!started) return;

    let power = throttle;
    let turn = steering;

    if (keys["w"] || keys["arrowup"]) power = 1;
    if (keys["s"] || keys["arrowdown"]) power = -1;
    if (keys["a"] || keys["arrowleft"]) turn = -1;
    if (keys["d"] || keys["arrowright"]) turn = 1;

    speed += power * 15 * delta;
    speed *= Math.pow(0.985, delta * 60);
    speed = THREE.MathUtils.clamp(speed, -12, 35);

    boat.rotation.y += turn * speed * 0.035 * delta;

    boat.position.x -= Math.sin(boat.rotation.y) * speed * delta;
    boat.position.z -= Math.cos(boat.rotation.y) * speed * delta;

    boat.position.y = Math.sin(clock.elapsedTime * 2) * 0.12;

    // KAMERA
    const distance = thirdPerson ? 12 : 3;
    const height = thirdPerson ? 7 : 2.5;

    const target = new THREE.Vector3(
        boat.position.x + Math.sin(boat.rotation.y) * distance,
        boat.position.y + height,
        boat.position.z + Math.cos(boat.rotation.y) * distance
    );

    camera.position.lerp(target, 0.07);

    camera.lookAt(
        boat.position.x,
        boat.position.y + 0.5,
        boat.position.z
    );

    document.getElementById("speed").textContent =
        Math.abs(Math.round(speed)) + " KM/H";
}

// ANA DÖNGÜ
function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);

    update(delta);
    renderer.render(scene, camera);
}

// EKRAN BOYUTU
window.addEventListener("resize", () => {
    if (!camera || !renderer) return;

    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});
        
