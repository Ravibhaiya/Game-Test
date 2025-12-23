import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class Player {
    constructor(scene, world, camera) {
        this.scene = scene;
        this.world = world;
        this.camera = camera;

        this.height = 1.7;
        this.speed = 3.0;
        this.runSpeed = 6.0;
        this.jumpVelocity = 5;

        // Controls
        this.controls = new PointerLockControls(camera, document.body);
        
        // Physics Body
        const radius = 0.5;
        this.shape = new CANNON.Sphere(radius);
        this.body = new CANNON.Body({
            mass: 70, // kg
            shape: this.shape,
            position: new CANNON.Vec3(0, 5, 0),
            fixedRotation: true,
            material: world.defaultMaterial
        });
        this.body.linearDamping = 0.9;
        this.world.addBody(this.body);

        // Flashlight
        this.flashlight = new THREE.SpotLight(0xffffee, 2, 30, Math.PI / 6, 0.5, 2);
        this.flashlight.position.set(0, 0, 0);
        this.flashlight.target.position.set(0, 0, -1);
        this.camera.add(this.flashlight);
        this.camera.add(this.flashlight.target);
        this.scene.add(this.camera);

        // Interaction Raycaster
        this.raycaster = new THREE.Raycaster();
        this.raycaster.far = 3; // Interaction distance
        this.crosshair = document.getElementById('crosshair');

        // Stats
        this.sanity = 100;
        this.battery = 100;
        this.isFlashlightOn = true;
        this.batteryDrainRate = 1.0; // % per second

        // UI Elements
        this.batteryUI = document.getElementById('battery-indicator');
        this.sanityUI = document.getElementById('sanity-meter');

        // State
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;
        this.isRunning = false;

        this.initInput();
    }

    initInput() {
        const onKeyDown = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = true;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = true;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = true;
                    break;
                case 'Space':
                    if (this.canJump) {
                        this.body.velocity.y = this.jumpVelocity;
                        this.canJump = false;
                    }
                    break;
                case 'ShiftLeft':
                case 'ShiftRight':
                    this.isRunning = true;
                    break;
                case 'KeyE':
                    this.interact();
                    break;
                case 'KeyF':
                    this.toggleFlashlight();
                    break;
            }
        };

        const onKeyUp = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = false;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = false;
                    break;
                case 'ShiftLeft':
                case 'ShiftRight':
                    this.isRunning = false;
                    break;
            }
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
    }

    toggleFlashlight() {
        this.isFlashlightOn = !this.isFlashlightOn;
        this.flashlight.visible = this.isFlashlightOn;
    }

    update(dt) {
        // Battery Logic
        if (this.isFlashlightOn && this.battery > 0) {
            this.battery -= this.batteryDrainRate * dt;
            if (this.battery <= 0) {
                this.battery = 0;
                this.isFlashlightOn = false;
                this.flashlight.visible = false;
            }
        }
        this.batteryUI.innerText = `Battery: ${Math.floor(this.battery)}%`;
        
        // Sanity (Placeholder logic)
        // this.sanityUI.innerText = `Sanity: ${Math.floor(this.sanity)}%`;

        if (this.controls.isLocked) {
            const inputVector = new THREE.Vector3(0, 0, 0);

            if (this.moveForward) inputVector.z -= 1;
            if (this.moveBackward) inputVector.z += 1;
            if (this.moveLeft) inputVector.x -= 1;
            if (this.moveRight) inputVector.x += 1;
            
            if (inputVector.lengthSq() > 0) {
              inputVector.normalize();
            }

            const camDir = new THREE.Vector3();
            this.controls.getObject().getWorldDirection(camDir);
            camDir.y = 0;
            camDir.normalize();

            const camRight = new THREE.Vector3();
            camRight.crossVectors(camDir, new THREE.Vector3(0, 1, 0)).normalize();

            const speed = this.isRunning ? this.runSpeed : this.speed;

            const velocity = new THREE.Vector3()
                .copy(camDir).multiplyScalar(-inputVector.z)
                .add(new THREE.Vector3().copy(camRight).multiplyScalar(inputVector.x));

            if (velocity.length() > 0) velocity.normalize().multiplyScalar(speed);

            this.body.velocity.x = velocity.x;
            this.body.velocity.z = velocity.z;

            // Check interaction
            this.checkInteraction();
        }

        // Sync camera
        this.camera.position.copy(this.body.position);
        this.camera.position.y += this.height * 0.5;
    }

    checkInteraction() {
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true); 

        if (intersects.length > 0) {
            if (intersects[0].distance < 3) {
                 this.crosshair.style.backgroundColor = 'red';
            } else {
                 this.crosshair.style.backgroundColor = 'white';
            }
        } else {
            this.crosshair.style.backgroundColor = 'white';
        }
    }

    interact() {
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        if (intersects.length > 0 && intersects[0].distance < 3) {
            console.log("Interacted with", intersects[0].object);
            
            // Check if it's a battery (simplified)
            // Ideally we'd have a class or userdata on the object
            // For now, if we interact, recharge a bit just for testing
            if (this.battery < 100) {
                this.battery = Math.min(100, this.battery + 20);
                console.log("Battery Recharged");
            }
        }
    }
}
