import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class GameMap {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        
        // Materials
        this.floorMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
        this.wallMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });
        this.ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.9 });
        
        // Physics Material
        this.physicsMaterial = new CANNON.Material('wall');
        
        this.generateMap();
    }

    generateMap() {
        // Hallway (Center at 0, 0)
        // Dimensions: Width 4, Length 40
        // We need to create gaps in the hallway walls where rooms are.
        
        const hallwayWidth = 4;
        const hallwayLength = 40;
        
        // Floor & Ceiling for Hallway
        this.createPlane(0, 0, hallwayWidth, hallwayLength, this.floorMaterial, false); // Floor
        this.createPlane(0, 0, hallwayWidth, hallwayLength, this.ceilingMaterial, true); // Ceiling
        
        // Hallway End Walls (Front/Back)
        this.createWall(0, -hallwayLength/2, hallwayWidth, 4, false);
        this.createWall(0, hallwayLength/2, hallwayWidth, 4, false);

        // Room parameters
        const roomWidth = 6;
        const roomDepth = 6;
        const roomZStart = -15;
        const roomSpacing = 8;
        const numRoomsPerSide = 5; // Total 10 rooms

        // We will build the side walls of the hallway segment by segment to create doorways.
        // Or simpler: Build the full wall but skip segments where doors are?
        // Let's iterate through the length of the hallway and place wall segments.
        
        // Let's define the layout first.
        // Rooms at z = -15, -7, 1, 9, 17. (approx)
        
        // Left Rooms (Classrooms/Bathrooms)
        // x = - (hallwayWidth/2 + roomWidth/2) = -(2 + 3) = -5
        
        for (let i = 0; i < numRoomsPerSide; i++) {
            const z = roomZStart + (i * roomSpacing);
            const type = (i === 2) ? "bathroom" : "classroom"; // Middle one is bathroom
            
            // Left Room
            this.createRoom(-5, z, roomWidth, roomDepth, type, "right"); // Connection is on the right of the room
            
            // Right Room
            this.createRoom(5, z, roomWidth, roomDepth, type, "left");
        }
        
        // Principal Office at the end (behind the hallway start?)
        // Let's put it at Z=25
        this.createRoom(0, 25, 8, 6, "office", "front"); // Connection is on the front (towards negative Z)

        // Now, fill in the hallway walls.
        // We have doors at specific Z locations on Left (x=-2) and Right (x=2).
        // Door width = 1.5.
        // Center of doors matches room Z centers.
        
        const doorZPositions = [];
        for (let i = 0; i < numRoomsPerSide; i++) {
            doorZPositions.push(roomZStart + (i * roomSpacing));
        }
        
        // Create Hallway Side Walls with gaps
        this.createWallWithDoors(-2, hallwayLength, doorZPositions); // Left Wall
        this.createWallWithDoors(2, hallwayLength, doorZPositions);  // Right Wall
        
    }

    createPlane(x, z, width, depth, material, isCeiling) {
        const y = isCeiling ? 4 : 0;
        const geo = new THREE.PlaneGeometry(width, depth);
        const mesh = new THREE.Mesh(geo, material);
        mesh.rotation.x = isCeiling ? Math.PI / 2 : -Math.PI / 2;
        mesh.position.set(x, y, z);
        mesh.receiveShadow = !isCeiling;
        this.scene.add(mesh);

        if (!isCeiling) {
            const shape = new CANNON.Box(new CANNON.Vec3(width / 2, 0.1, depth / 2));
            const body = new CANNON.Body({ mass: 0, material: this.physicsMaterial });
            body.addShape(shape, new CANNON.Vec3(0, -0.1, 0));
            body.position.set(x, y, z);
            this.world.addBody(body);
        }
    }

    createRoom(x, z, width, depth, type, doorSide) {
        // Floor & Ceiling
        this.createPlane(x, z, width, depth, this.floorMaterial, false);
        this.createPlane(x, z, width, depth, this.ceilingMaterial, true);

        // Walls
        // We need 4 walls, but one has a door.
        // doorSide: 'left', 'right', 'front', 'back' (relative to room center)
        // Actually, let's just use createWall logic.
        
        const hW = width / 2;
        const hD = depth / 2;
        
        // Left Wall (x - hW)
        if (doorSide === 'left') {
            // Wall with door
            this.createWallWithDoorOnAxis(x - hW, z, depth, true);
        } else {
            this.createWall(x - hW, z, depth, 4, true);
        }
        
        // Right Wall (x + hW)
        if (doorSide === 'right') {
            this.createWallWithDoorOnAxis(x + hW, z, depth, true);
        } else {
            this.createWall(x + hW, z, depth, 4, true);
        }
        
        // Front Wall (z - hD)
        if (doorSide === 'front') {
             this.createWallWithDoorOnAxis(x, z - hD, width, false);
        } else {
             this.createWall(x, z - hD, width, 4, false);
        }
        
        // Back Wall (z + hD)
        if (doorSide === 'back') {
             this.createWallWithDoorOnAxis(x, z + hD, width, false);
        } else {
             this.createWall(x, z + hD, width, 4, false);
        }

        // Room Contents
        this.furnishRoom(x, z, type);
    }

    furnishRoom(x, z, type) {
        if (type === 'classroom') {
            // Desks
            const deskGeo = new THREE.BoxGeometry(1, 0.8, 0.6);
            const deskMat = new THREE.MeshStandardMaterial({ color: 0x553311 });
            
            for(let dx = -1.5; dx <= 1.5; dx += 1.5) {
                for(let dz = -1.5; dz <= 1.5; dz += 1.5) {
                     const desk = new THREE.Mesh(deskGeo, deskMat);
                     desk.position.set(x + dx, 0.4, z + dz);
                     this.scene.add(desk);
                     
                     const shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.4, 0.3));
                     const body = new CANNON.Body({ mass: 10 });
                     body.addShape(shape);
                     body.position.copy(desk.position);
                     this.world.addBody(body);
                }
            }
        } else if (type === 'bathroom') {
            // Stalls (Simple walls)
            const stallGeo = new THREE.BoxGeometry(0.1, 2, 1.5);
            const stallMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
            const stall = new THREE.Mesh(stallGeo, stallMat);
            stall.position.set(x, 1, z);
            this.scene.add(stall);
            // Physics...
             const shape = new CANNON.Box(new CANNON.Vec3(0.05, 1, 0.75));
             const body = new CANNON.Body({ mass: 0 });
             body.addShape(shape);
             body.position.copy(stall.position);
             this.world.addBody(body);
        } else if (type === 'office') {
             // Desk
            const deskGeo = new THREE.BoxGeometry(2, 0.8, 1);
            const deskMat = new THREE.MeshStandardMaterial({ color: 0x331100 });
            const desk = new THREE.Mesh(deskGeo, deskMat);
            desk.position.set(x, 0.4, z);
            this.scene.add(desk);
            
            const shape = new CANNON.Box(new CANNON.Vec3(1, 0.4, 0.5));
            const body = new CANNON.Body({ mass: 50 });
            body.addShape(shape);
            body.position.copy(desk.position);
            this.world.addBody(body);
        }
    }

    createWall(x, z, width, height, isRotated) {
        const thickness = 0.2;
        const geometry = new THREE.BoxGeometry(width, height, thickness);
        const mesh = new THREE.Mesh(geometry, this.wallMaterial);
        
        mesh.position.set(x, height / 2, z);
        if (isRotated) mesh.rotation.y = Math.PI / 2;
        
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        let shape;
        if (isRotated) {
             shape = new CANNON.Box(new CANNON.Vec3(thickness / 2, height / 2, width / 2));
        } else {
             shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, thickness / 2));
        }
        
        const body = new CANNON.Body({ mass: 0, material: this.physicsMaterial });
        body.addShape(shape);
        body.position.copy(mesh.position);
        this.world.addBody(body);
    }
    
    // Create a wall along Z axis (if rot=true, simulates wall along Z, so its width is along Z)
    // or along X axis (if rot=false, width is along X)
    // WITH a door gap in the middle.
    createWallWithDoorOnAxis(x, z, length, isRotated) {
         const doorWidth = 1.5;
         const doorHeight = 2.2;
         const wallHeight = 4;
         const thickness = 0.2;
         
         const sideWidth = (length - doorWidth) / 2;
         
         // Left side
         // If rotated (along Z), 'left' means -Z.
         // If not rotated (along X), 'left' means -X.
         
         // We construct 3 pieces: Left Panel, Right Panel, Top Panel (above door)
         
         // Helper to place box
         const placeBox = (bx, by, bz, bw, bh, bd) => {
             const geo = new THREE.BoxGeometry(bw, bh, bd);
             const mesh = new THREE.Mesh(geo, this.wallMaterial);
             mesh.position.set(bx, by, bz);
             this.scene.add(mesh);
             
             const shape = new CANNON.Box(new CANNON.Vec3(bw/2, bh/2, bd/2));
             const body = new CANNON.Body({ mass: 0 });
             body.addShape(shape);
             body.position.copy(mesh.position);
             this.world.addBody(body);
         };

         if (isRotated) {
             // Wall runs along Z. Width is thickness. Depth is length.
             // X is constant.
             
             // Segment 1 (Low Z)
             const z1 = z - (doorWidth/2 + sideWidth/2);
             placeBox(x, wallHeight/2, z1, thickness, wallHeight, sideWidth);
             
             // Segment 2 (High Z)
             const z2 = z + (doorWidth/2 + sideWidth/2);
             placeBox(x, wallHeight/2, z2, thickness, wallHeight, sideWidth);
             
             // Top (Above door)
             const hTop = wallHeight - doorHeight;
             const yTop = doorHeight + hTop/2;
             placeBox(x, yTop, z, thickness, hTop, doorWidth);
             
         } else {
             // Wall runs along X.
             // Segment 1 (Low X)
             const x1 = x - (doorWidth/2 + sideWidth/2);
             placeBox(x1, wallHeight/2, z, sideWidth, wallHeight, thickness);
             
             // Segment 2 (High X)
             const x2 = x + (doorWidth/2 + sideWidth/2);
             placeBox(x2, wallHeight/2, z, sideWidth, wallHeight, thickness);
             
             // Top
             const hTop = wallHeight - doorHeight;
             const yTop = doorHeight + hTop/2;
             placeBox(x, yTop, z, doorWidth, hTop, thickness);
         }
    }

    // Special helper for the long hallway walls with multiple doors
    createWallWithDoors(x, length, doorZPositions) {
        // Wall runs along Z axis (constant X).
        // Total length centered at Z=0.
        // Start Z = -length/2, End Z = length/2.
        
        // We sort door positions just in case.
        doorZPositions.sort((a, b) => a - b);
        
        let currentZ = -length / 2;
        const doorWidth = 1.5;
        const wallHeight = 4;
        const doorHeight = 2.2;
        const thickness = 0.2;
        
        const placeBox = (bx, by, bz, bw, bh, bd) => {
             const geo = new THREE.BoxGeometry(bw, bh, bd);
             const mesh = new THREE.Mesh(geo, this.wallMaterial);
             mesh.position.set(bx, by, bz);
             this.scene.add(mesh);
             
             const shape = new CANNON.Box(new CANNON.Vec3(bw/2, bh/2, bd/2));
             const body = new CANNON.Body({ mass: 0 });
             body.addShape(shape);
             body.position.copy(mesh.position);
             this.world.addBody(body);
         };
         
         for (const doorZ of doorZPositions) {
             const doorStart = doorZ - doorWidth/2;
             const doorEnd = doorZ + doorWidth/2;
             
             // Wall segment before door
             if (doorStart > currentZ) {
                 const segLength = doorStart - currentZ;
                 const segCenter = currentZ + segLength/2;
                 placeBox(x, wallHeight/2, segCenter, thickness, wallHeight, segLength);
             }
             
             // Top of door
             const hTop = wallHeight - doorHeight;
             const yTop = doorHeight + hTop/2;
             placeBox(x, yTop, doorZ, thickness, hTop, doorWidth);
             
             currentZ = doorEnd;
         }
         
         // Final segment
         const endZ = length / 2;
         if (currentZ < endZ) {
             const segLength = endZ - currentZ;
             const segCenter = currentZ + segLength/2;
             placeBox(x, wallHeight/2, segCenter, thickness, wallHeight, segLength);
         }
    }

    update(dt) {
    }
}
