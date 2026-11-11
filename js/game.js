
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

let scene, camera, renderer, boat;
let speed = 0;
let throttle = 0;
let steering = 0;
let cameraMode = 0;
let started = false;

const menu = document.getElementById("menu");
const hud = document.getElementById("hud");
const wheel = document.getElementById("steering");
const lever = document.getElementById("lever");

window.startGame = function () {
    if (started) return;

    started = true;
    menu.style.display = "none";
    hud.style.display = "block";

    init();
    animate();
};

window.changeCamera = function () {
    cameraMode = cameraMode === 0 ? 1 : 0;
};

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x75c9ed);
    scene.fog = new THREE.Fog(0x75c9ed, 50, 350);

    camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(renderer.domElement);

    const light = new THREE.HemisphereLight(0xffffff, 0x31566b, 2);
    scene.add(light);

    const sun = new THREE.DirectionalLight(0xffffff, 2);
    sun.position.set(30, 50, 20);
    scene.add(sun);

    // DENİZ
    const water = new THREE.Mesh(
        new THREE.PlaneGeometry(1000, 1000, 100, 100),
        new THREE.MeshStandardMaterial({
            color: 0x087da9,
            roughness: 0.35,
            metalness: 0.25
        })
    );

    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.5;
    scene.add(water);

    // TEKNE
    boat = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.8, 7),
        new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.3
        })
    );
    body.position.y = 0.4;
    boat.add(body);

    const front = new THREE.Mesh(
        new THREE.ConeGeometry(1.5, 2, 4),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    front.rotation.x = -Math.PI / 2;
    front.position.set(0, 0.4, -4);
    boat.add(front);

    const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(2, 1.2, 2),
        new THREE.MeshStandardMaterial({ color: 0x1684b4 })
    );
    cabin.position.set(0, 1.3, 0.5);
    boat.add(cabin);

    scene.add(boat);

    // UZAK ADALAR
    for (let i = 0; i < 8; i++) {
        const island = new THREE.Mesh(
            new THREE.ConeGeometry(12 + Math.random() * 10, 18, 7),
            new THREE.MeshStandardMaterial({ color: 0x397b45 })
        );

        island.position.set(
            Math.random() * 250 - 125,
            5,
            -70 - Math.random() * 250
        );

        scene.add(island);
    }

    camera.position.set(0, 6, 12);

    setupControls();

    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

function setupControls() {
    let wheelActive = false;
    let lastX = 0;

    wheel.addEventListener("pointerdown", e => {
        wheelActive = true;
        lastX = e.clientX;
        wheel.setPointerCapture(e.pointerId);
    });

    wheel.addEventListener("pointermove", e => {
        if (!wheelActive) return;

        const difference = e.clientX - lastX;
        steering = Math.max(-1, Math.min(1, difference / 35));
        lastX = e.clientX;

        wheel.style.transform = `rotate(${steering * 120}deg)`;
    });

    wheel.addEventListener("pointerup", () => {
        wheelActive = false;
        steering = 0;
    });

    let throttleActive = false;

    lever.addEventListener("pointerdown", e => {
        throttleActive = true;
        lever.setPointerCapture(e.pointerId);
        moveLever(e);
    });

    lever.addEventListener("pointermove", e => {
        if (throttleActive) moveLever(e);
    });

    function moveLever(e) {
        const rect = document.getElementById("throttle").getBoundingClientRect();
        const y = e.clientY - rect.top;

        const position = Math.max(5, Math.min(115, y - 12));
        lever.style.top = position + "px";

        throttle = 1 - (position - 5) / 110 * 2;
    }

    function releaseThrottle() {
        throttleActive = false;
        throttle = 0;
        lever.style.top = "60px";
    }

    lever.addEventListener("pointerup", releaseThrottle);
    lever.addEventListener("pointercancel", releaseThrottle);
}

function animate() {
    requestAnimationFrame(animate);

    const delta = 0.016;

    speed += (throttle * 12 - speed) * 0.025;

    boat.rotation.y += steering * speed * 0.035;

    boat.position.x -= Math.sin(boat.rotation.y) * speed * delta;
    boat.position.z -= Math.cos(boat.rotation.y) * speed * delta;

    if (cameraMode === 0) {
        camera.position.set(
            boat.position.x + Math.sin(boat.rotation.y) * 12,
            boat.position.y + 6,
            boat.position.z + Math.cos(boat.rotation.y) * 12
        );
    } else {
        camera.position.set(
            boat.position.x,
            boat.position.y + 2.5,
            boat.position.z - 1
        );
    }

    camera.lookAt(
        boat.position.x,
        boat.position.y,
        boat.position.z
    );

    renderer.render(scene, camera);
        }
            
