import * as THREE from 'three';

export class Ghost {
    constructor(scene, world, player) {
        this.scene = scene;
        this.world = world;
        this.player = player;

        // Visuals
        const geometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(0, 2, -10);
        this.scene.add(this.mesh);

        // State
        this.state = 'idle'; // idle, hunt
        this.moveSpeed = 2.0;
        
        // Random patrol points
        this.patrolPoints = [
            new THREE.Vector3(0, 2, -15),
            new THREE.Vector3(0, 2, 15),
            new THREE.Vector3(-5, 2, 0), // Into room?
            new THREE.Vector3(5, 2, 0)
        ];
        this.currentPatrolIndex = 0;
    }

    update(dt) {
        const playerPos = this.player.camera.position;
        const dist = this.mesh.position.distanceTo(playerPos);

        if (this.state === 'idle') {
            // Move towards current patrol point
            const target = this.patrolPoints[this.currentPatrolIndex];
            const dir = new THREE.Vector3().subVectors(target, this.mesh.position);
            
            if (dir.length() < 0.5) {
                // Reached point, pick next
                this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
            } else {
                dir.normalize();
                this.mesh.position.add(dir.multiplyScalar(this.moveSpeed * dt));
            }

            // Check if player is close or flashlight is on it (simplified: just distance)
            if (dist < 10) {
                 // Check visibility (simplified)
                 this.state = 'hunt';
            }
        } else if (this.state === 'hunt') {
            // Move towards player
            const dir = new THREE.Vector3().subVectors(playerPos, this.mesh.position);
            dir.normalize();
            this.mesh.position.add(dir.multiplyScalar(this.moveSpeed * 1.5 * dt));

            if (dist > 20) {
                this.state = 'idle';
            }
        }
        
        // Bobbing effect
        this.mesh.position.y = 2 + Math.sin(Date.now() * 0.002) * 0.2;
    }
}
