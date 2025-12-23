import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Player } from './player.js';
import { GameMap } from './map.js';
import { Ghost } from './ghost.js';

// Scene Setup
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.05);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Physics Setup
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
// Default material
const defaultMaterial = new CANNON.Material('default');
const defaultContactMaterial = new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, {
    friction: 0.0,
    restitution: 0.0,
});
world.addContactMaterial(defaultContactMaterial);


// Game Components
const player = new Player(scene, world, camera);
const gameMap = new GameMap(scene, world);
const ghost = new Ghost(scene, world, player);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 0.2); // Dim ambient light
scene.add(ambientLight);

// Handle Window Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Game Loop
const clock = new THREE.Clock();
const timeStep = 1 / 60;

function animate() {
    requestAnimationFrame(animate);

    const dt = clock.getDelta();

    // Update Physics
    world.step(timeStep, dt, 3);

    // Update Game Logic
    player.update(dt);
    gameMap.update(dt);
    ghost.update(dt);

    renderer.render(scene, camera);
}

// Start Game Interaction
const instructions = document.getElementById('instructions');
instructions.addEventListener('click', () => {
    player.controls.lock();
});

player.controls.addEventListener('lock', () => {
    instructions.style.display = 'none';
});

player.controls.addEventListener('unlock', () => {
    instructions.style.display = 'flex';
});

animate();
