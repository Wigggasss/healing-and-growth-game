import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';

class Game {
    constructor() {
        // Hide loading screen once the game starts
        document.getElementById('loading').style.display = 'none';
        this.initialize();
    }

    initialize() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // Sky blue background
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 10);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);
        
        // Add lights
        this.addLights();
        
        // Add basic ground
        this.addGround();

        // Add some trees
        this.addTrees();

        // Add player
        this.addPlayer();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
        
        // Start animation loop
        this.animate();
    }

    addLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
    }

    addGround() {
        // Create a large ground plane with a grass-like texture
        const groundGeometry = new THREE.PlaneGeometry(100, 100, 20, 20);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3a7e4f,
            roughness: 0.8,
            metalness: 0.2
        });
        
        // Add some height variation to create a more natural terrain
        const vertices = groundGeometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            if (i !== 0) { // Don't modify the center point
                vertices[i + 1] = Math.random() * 0.5; // Random height between 0 and 0.5
            }
        }
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }

    addPlayer() {
        // Create player group
        this.player = new THREE.Group();
        
        // Create player body
        const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.5;
        body.castShadow = true;
        
        // Create player head
        const headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffccaa });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2.5;
        head.castShadow = true;

        // Add body and head to player group
        this.player.add(body);
        this.player.add(head);
        
        // Position player
        this.player.position.set(0, 0, 0);
        this.scene.add(this.player);

        // Set up camera to follow player
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(this.player.position);

        // Create an invisible target for the camera to follow
        this.cameraTarget = new THREE.Object3D();
        this.cameraTarget.position.copy(this.player.position);
        this.cameraTarget.position.y += 2;
        this.scene.add(this.cameraTarget);

        // Set up camera controls
        this.setupCameraControls();
    }

    setupCameraControls() {
        // Remove orbit controls
        if (this.controls) {
            this.controls.dispose();
        }

        // Set up smooth camera following
        this.cameraOffset = new THREE.Vector3(0, 3, 8);
        this.cameraDamping = 0.1;
        this.rotationDamping = 0.1;
    }

    addTrees() {
        // Simple tree creation function
        const createTree = (x, z) => {
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.2, 2, 8),
                new THREE.MeshStandardMaterial({ color: 0x8b4513 })
            );
            
            const leaves = new THREE.Mesh(
                new THREE.ConeGeometry(1, 2, 8),
                new THREE.MeshStandardMaterial({ color: 0x228b22 })
            );
            
            trunk.position.set(x, 1, z);
            leaves.position.set(x, 2.5, z);
            
            trunk.castShadow = true;
            leaves.castShadow = true;
            
            this.scene.add(trunk);
            this.scene.add(leaves);
        };
        
        // Add some randomly placed trees
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * 40 - 20;
            const z = Math.random() * 40 - 20;
            createTree(x, z);
        }
    }

    updateCamera() {
        // Update camera target position
        this.cameraTarget.position.lerp(
            new THREE.Vector3(
                this.player.position.x,
                this.player.position.y + 2,
                this.player.position.z
            ),
            this.cameraDamping
        );

        // Calculate desired camera position
        const idealOffset = this.cameraOffset.clone();
        idealOffset.applyQuaternion(this.player.quaternion);
        idealOffset.add(this.cameraTarget.position);

        // Smoothly move camera to desired position
        this.camera.position.lerp(idealOffset, this.cameraDamping);
        
        // Make camera look at target
        const lookAtPos = this.cameraTarget.position.clone();
        this.camera.lookAt(lookAtPos);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update camera position
        this.updateCamera();
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Start the game
const game = new Game(); 