
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

// OYUN DEĞİŞKENLERİ
let scene, camera, renderer, boat, clock;
let speed = 0;
let throttle = 0;
let steering = 0;
let cameraMode = 0;
let started = false;
let islands = [];

const menu = document.getElementById("menu");
const hud = document.getElementById("hud");
const wheel = document.getElementById("steering");
const track = document.getElementById("throttle");
const lever = document.getElementById("lever");
const speedBox = document.getElementById("speedBox");
const mapCanvas = document.getElementById("mapCanvas");
const mapCtx = mapCanvas.getContext("2d");

// OYUNU BAŞLAT
window.startGame = async function () {
    if (started) return;

    try {
        if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
        }
    } catch (e) {
        console.log("Tam ekran desteklenmiyor.");
    }

    try {
        if (screen.orientation?.lock) {
            await screen.orientation.lock("landscape");
        }
    } catch (e) {
        console.log("Yatay ekran kilidi desteklenmiyor.");
    }

    started = true;
    menu.style.display = "none";
    hud.style.display = "block";

    init();
    animate();
};

// KAMERA DEĞİŞTİR
window.changeCamera = function () {
    cameraMode = cameraMode === 0 ? 1 : 0;

    document.getElementById("camera").textContent =
        cameraMode === 0 ? "📷" : "🚤";
};

// SAHNEYİ OLUŞTUR
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x75c9ed);
    scene.fog = new THREE.Fog(0x75c9ed, 100, 500);

    camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.1,
        1500
    );

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.domElement.className = "game3d";

    document.body.appendChild(renderer.domElement);

    clock = new THREE.Clock();

    // IŞIK
    scene.add(
        new THREE.HemisphereLight(0xffffff, 0x31566b, 2)
    );

    const sun = new THREE.DirectionalLight(0xffffff, 2);
    sun.position.set(50, 80, 30);
    scene.add(sun);

    // DENİZ
    const water = new THREE.Mesh(
        new THREE.PlaneGeometry(2000, 2000),
        new THREE.MeshStandardMaterial({
            color: 0x087da9,
            roughness: 0.3,
            metalness: 0.2
        })
    );

    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.5;
    scene.add(water);

    // TEKNE
    boat = new THREE.Group();

    const hull = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 0.8, 7),
        new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.3
        })
    );

    hull.position.y = 0.4;
    boat.add(hull);

    // KABİN
    const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(2.1, 1.3, 2),
        new THREE.MeshStandardMaterial({
            color: 0x087eae
        })
    );

    cabin.position.set(0, 1.35, 0.5);
    boat.add(cabin);

    // ÇATI
    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(2.3, 0.15, 2.2),
        new THREE.MeshStandardMaterial({
            color: 0xffffff
        })
    );

    roof.position.set(0, 2.1, 0.5);
    boat.add(roof);

    // TEKNE BURNU
    const bow = new THREE.Mesh(
        new THREE.ConeGeometry(1.6, 2.2, 4),
        new THREE.MeshStandardMaterial({
            color: 0xffffff
        })
    );

    bow.rotation.x = -Math.PI / 2;
    bow.position.set(0, 0.4, -4);
    boat.add(bow);

    scene.add(boat);

    // ADALAR
    for (let i = 0; i < 15; i++) {
        const x = Math.random() * 500 - 250;
        const z = -80 - Math.random() * 550;

        const island = new THREE.Mesh(
            new THREE.ConeGeometry(
                12 + Math.random() * 15,
                22,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x397b45
            })
        );

        island.position.set(x, 6, z);
        scene.add(island);

        islands.push({ x, z });
    }

    setupControls();
    resizeGame();

    window.addEventListener("resize", resizeGame);
}

// EKRAN BOYUTU
function resizeGame() {
    if (!camera || !renderer) return;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

// KONTROLLER
function setupControls() {

    // DİREKSİYON
    let wheelActive = false;

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

        steering = Math.max(
            -1,
            Math.min(1, (e.clientX - center) / (rect.width * 0.38))
        );

        wheel.style.transform =
            `rotate(${steering * 130}deg)`;
    }

    function stopWheel() {
        wheelActive = false;
        steering = 0;
        wheel.style.transform = "rotate(0deg)";
    }

    wheel.addEventListener("pointerup", stopWheel);
    wheel.addEventListener("pointercancel", stopWheel);

    // GAZ VE GERİ KOLU
    let throttleActive = false;

    track.addEventListener("pointerdown", e => {
        throttleActive = true;
        track.setPointerCapture(e.pointerId);
        moveThrottle(e);
    });

    track.addEventListener("pointermove", e => {
        if (throttleActive) moveThrottle(e);
    });

    function moveThrottle(e) {
        const rect = track.getBoundingClientRect();
        const handleHeight = lever.offsetHeight;
        const usable = rect.height - handleHeight;

        const y = Math.max(
            0,
            Math.min(
                usable,
                e.clientY - rect.top - handleHeight / 2
            )
        );

        lever.style.top = y + "px";
        lever.style.transform = "none";

        const normalized = y / usable;
        throttle = 1 - normalized * 2;
    }

    function stopThrottle() {
        throttleActive = false;
        throttle = 0;

        lever.style.top = "50%";
        lever.style.transform = "translateY(-50%)";
    }

    track.addEventListener("pointerup", stopThrottle);
    track.addEventListener("pointercancel", stopThrottle);
}

// MİNİ HARİTA
function updateMap() {
    const ctx = mapCtx;
    const size = mapCanvas.width;
    const center = size / 2;

    ctx.clearRect(0, 0, size, size);

    ctx.fillStyle = "#07516d";
    ctx.fillRect(0, 0, size, size);

    // HARİTA ÇİZGİLERİ
    ctx.strokeStyle = "#54b9d1";
    ctx.lineWidth = 1;

    for (let i = 20; i < size; i += 35) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, size);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(size, i);
        ctx.stroke();
    }

    // ADALARI GÖSTER
    const angle = boat.rotation.y;

    for (const island of islands) {
        const dx = island.x - boat.position.x;
        const dz = island.z - boat.position.z;

        const localX =
            dx * Math.cos(angle) - dz * Math.sin(angle);

        const localY =
            dx * Math.sin(angle) + dz * Math.cos(angle);

        const mapX = center + localX * 0.35;
        const mapY = center + localY * 0.35;

        if (
            Math.abs(mapX - center) < 100 &&
            Math.abs(mapY - center) < 100
        ) {
            ctx.fillStyle = "#8bc66b";

            ctx.beginPath();
            ctx.arc(mapX, mapY, 7, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // TEKNE YÖNÜ
    ctx.save();
    ctx.translate(center, center);

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(0, -17);
    ctx.lineTo(12, 12);
    ctx.lineTo(0, 7);
    ctx.lineTo(-12, 12);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

// OYUN DÖNGÜSÜ
function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);

    // HIZ
    const targetSpeed = throttle >= 0
        ? throttle * 15
        : throttle * 7;

    speed +=
        (targetSpeed - speed) *
        Math.min(1, delta * 2.5);

    // DİREKSİYON
    boat.rotation.y +=
        steering * 0.8 * delta *
        (speed >= 0 ? 1 : -1);

    // TEKNE HAREKETİ
    boat.position.x -=
        Math.sin(boat.rotation.y) * speed * delta;

    boat.position.z -=
        Math.cos(boat.rotation.y) * speed * delta;

    // DALGA HAREKETİ
    boat.position.y =
        0.1 + Math.sin(performance.now() * 0.0015) * 0.08;

    // ARKA KAMERA
    if (cameraMode === 0) {
        const distance = 13;

        camera.position.set(
            boat.position.x +
                Math.sin(boat.rotation.y) * distance,
            boat.position.y + 6,
            boat.position.z +
                Math.cos(boat.rotation.y) * distance
        );

        camera.lookAt(
            boat.position.x,
            boat.position.y + 1,
            boat.position.z
        );
    }

    // ÖN KAMERA
    else {
        const forwardX = -Math.sin(boat.rotation.y);
        const forwardZ = -Math.cos(boat.rotation.y);

        camera.position.set(
            boat.position.x + forwardX * 1.2,
            boat.position.y + 2.1,
            boat.position.z + forwardZ * 1.2
        );

        camera.lookAt(
            boat.position.x + forwardX * 20,
            boat.position.y + 1.5,
            boat.position.z + forwardZ * 20
        );
    }

    speedBox.textContent =
        Math.round(Math.abs(speed) * 3.6) + " KM/H";

    updateMap();

    renderer.render(scene, camera);
    }
    
