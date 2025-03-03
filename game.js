// Game class definition
class Game {
    constructor() {
        this.initialize();
        this.setupInputs();
        this.health = 100;
        this.energy = 100; // Added energy system for growth mechanics
        this.isJumping = false;
        this.velocity = new THREE.Vector3();
        this.moveSpeed = 0.1;
        this.jumpForce = 0.3;
        this.gravity = 0.01;
        this.healingProgress = 0; // Track overall healing progress
    }

    initialize() {
        try {
            // Create scene with a calming sky color
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0xb8e6ff); // Lighter, more peaceful sky blue
            
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

            // Add environment
            this.addTrees();
            this.addHealingZones();
            this.addMeditationSpots(); // New peaceful areas
            this.addNPCs();

            // Add player
            this.addPlayer();
            
            // Handle window resize
            window.addEventListener('resize', () => this.onWindowResize(), false);
            
            // Hide loading screen once everything is ready
            document.getElementById('loading').style.display = 'none';
            
            // Start animation loop
            this.animate();
        } catch (error) {
            console.error('Error initializing game:', error);
            document.getElementById('loading').textContent = 'Error loading game. Please refresh the page.';
        }
    }

    setupInputs() {
        this.keys = {};
        this.mousePosition = new THREE.Vector2();
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.keys[e.key.toLowerCase()] = true);
        document.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);
        
        // Mouse controls
        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement === this.renderer.domElement) {
                this.player.rotation.y -= e.movementX * 0.002;
                this.camera.rotation.x = THREE.MathUtils.clamp(
                    this.camera.rotation.x - e.movementY * 0.002,
                    -Math.PI / 3,
                    Math.PI / 3
                );
            }
        });

        // Lock pointer for better mouse control
        this.renderer.domElement.addEventListener('click', () => {
            if (document.pointerLockElement !== this.renderer.domElement) {
                this.renderer.domElement.requestPointerLock();
            }
        });
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
        
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
    }

    addPlayer() {
        // Create player group
        this.player = new THREE.Group();
        
        // Create player body (using cylinder instead of capsule since it's more widely supported)
        const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.5;
        body.castShadow = true;
        
        // Create player head
        const headGeometry = new THREE.SphereGeometry(0.5, 16, 16);
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
    }

    addHealingZones() {
        this.healingZones = [];
        
        // Create several healing zones
        for (let i = 0; i < 5; i++) {
            const zoneGeometry = new THREE.CylinderGeometry(2, 2, 0.1, 32);
            const zoneMaterial = new THREE.MeshStandardMaterial({
                color: 0x00ff00,
                transparent: true,
                opacity: 0.3
            });
            
            const zone = new THREE.Mesh(zoneGeometry, zoneMaterial);
            zone.position.set(
                Math.random() * 80 - 40,
                0.05,
                Math.random() * 80 - 40
            );
            
            this.healingZones.push(zone);
            this.scene.add(zone);
            
            // Add particles
            this.addHealingParticles(zone);
        }
    }

    addHealingParticles(zone) {
        const particleCount = 20;
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0x00ff00 })
            );
            
            // Random position within the healing zone
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 2;
            particle.position.x = Math.cos(angle) * radius;
            particle.position.z = Math.sin(angle) * radius;
            particle.position.y = Math.random() * 2;
            
            particles.add(particle);
        }
        
        zone.particles = particles;
        zone.add(particles);
    }

    addNPCs() {
        this.npcs = [];
        
        // Create several NPCs
        for (let i = 0; i < 5; i++) {
            const npc = new THREE.Group();
            
            // NPC body (using cylinder instead of capsule)
            const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
            const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.y = 1.5;
            body.castShadow = true;
            
            // NPC head
            const headGeometry = new THREE.SphereGeometry(0.5, 16, 16);
            const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffccaa });
            const head = new THREE.Mesh(headGeometry, headMaterial);
            head.position.y = 2.5;
            head.castShadow = true;
            
            npc.add(body);
            npc.add(head);
            
            // Position NPC
            npc.position.set(
                Math.random() * 80 - 40,
                0,
                Math.random() * 80 - 40
            );
            
            this.npcs.push(npc);
            this.scene.add(npc);
        }
    }

    addTrees() {
        this.trees = [];
        
        // Simple tree creation function
        const createTree = (x, z) => {
            const tree = new THREE.Group();
            
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.2, 2, 8),
                new THREE.MeshStandardMaterial({ color: 0x8b4513 })
            );
            
            const leaves = new THREE.Mesh(
                new THREE.ConeGeometry(1, 2, 8),
                new THREE.MeshStandardMaterial({ color: 0x228b22 })
            );
            
            trunk.position.y = 1;
            leaves.position.y = 2.5;
            
            trunk.castShadow = true;
            leaves.castShadow = true;
            
            tree.add(trunk);
            tree.add(leaves);
            tree.position.set(x, 0, z);
            
            return tree;
        };
        
        // Add some randomly placed trees
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * 80 - 40;
            const z = Math.random() * 80 - 40;
            const tree = createTree(x, z);
            this.trees.push(tree);
            this.scene.add(tree);
        }
    }

    updateHealingZones() {
        const playerPos = this.player.position.clone();
        playerPos.y = 0;
        
        this.healingZones.forEach(zone => {
            // Rotate particles
            if (zone.particles) {
                zone.particles.rotation.y += 0.01;
                zone.particles.children.forEach(particle => {
                    particle.position.y = Math.sin(Date.now() * 0.003 + particle.position.x) * 0.5 + 1;
                });
            }
            
            // Check if player is in healing zone
            const distance = playerPos.distanceTo(zone.position);
            if (distance < 2) {
                this.heal(0.1);
            }
        });
    }

    updateNPCs() {
        const time = Date.now() * 0.001;
        
        this.npcs.forEach(npc => {
            // Simple wandering behavior
            npc.position.x += Math.sin(time + npc.position.z) * 0.02;
            npc.position.z += Math.cos(time + npc.position.x) * 0.02;
            
            // Keep NPCs within bounds
            npc.position.x = THREE.MathUtils.clamp(npc.position.x, -40, 40);
            npc.position.z = THREE.MathUtils.clamp(npc.position.z, -40, 40);
            
            // Make NPCs face their movement direction
            npc.rotation.y = Math.atan2(
                Math.cos(time + npc.position.x),
                Math.sin(time + npc.position.z)
            );
        });
    }

    heal(amount) {
        this.health = Math.min(100, this.health + amount);
        document.querySelector('#health-fill').style.width = this.health + '%';
    }

    damage(amount) {
        this.health = Math.max(0, this.health - amount);
        document.querySelector('#health-fill').style.width = this.health + '%';
    }

    movePlayer() {
        // Calculate movement based on camera direction
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        cameraDirection.y = 0;
        cameraDirection.normalize();
        
        const sideDirection = new THREE.Vector3(
            -cameraDirection.z, // Fixed A/D movement by inverting the direction
            0,
            cameraDirection.x
        );
        
        // Create a new vector for each movement to prevent accumulation
        if (this.keys['w']) {
            const forward = cameraDirection.clone().multiplyScalar(this.moveSpeed);
            this.player.position.add(forward);
        }
        if (this.keys['s']) {
            const backward = cameraDirection.clone().multiplyScalar(-this.moveSpeed);
            this.player.position.add(backward);
        }
        if (this.keys['a']) {
            const left = sideDirection.clone().multiplyScalar(-this.moveSpeed);
            this.player.position.add(left);
        }
        if (this.keys['d']) {
            const right = sideDirection.clone().multiplyScalar(this.moveSpeed);
            this.player.position.add(right);
        }
        
        // Handle jumping
        if (this.keys[' '] && !this.isJumping) {
            this.velocity.y = this.jumpForce;
            this.isJumping = true;
        }
        
        // Apply gravity
        this.velocity.y -= this.gravity;
        this.player.position.y += this.velocity.y;
        
        // Ground collision
        if (this.player.position.y < 0) {
            this.player.position.y = 0;
            this.velocity.y = 0;
            this.isJumping = false;
        }
        
        // Keep player within bounds
        this.player.position.x = THREE.MathUtils.clamp(this.player.position.x, -40, 40);
        this.player.position.z = THREE.MathUtils.clamp(this.player.position.z, -40, 40);
    }

    updateCamera() {
        // Update camera target position
        const targetPos = this.player.position.clone();
        targetPos.y += 2;
        this.cameraTarget.position.lerp(targetPos, 0.1);
        
        // Calculate ideal camera position
        const cameraOffset = new THREE.Vector3(0, 3, 8);
        cameraOffset.applyQuaternion(this.player.quaternion);
        const idealPos = this.cameraTarget.position.clone().add(cameraOffset);
        
        // Move camera smoothly
        this.camera.position.lerp(idealPos, 0.1);
        this.camera.lookAt(this.cameraTarget.position);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    addMeditationSpots() {
        this.meditationSpots = [];
        
        // Create peaceful meditation areas
        for (let i = 0; i < 3; i++) {
            const spot = new THREE.Group();
            
            // Create a peaceful circle platform
            const platform = new THREE.Mesh(
                new THREE.CylinderGeometry(3, 3, 0.2, 32),
                new THREE.MeshStandardMaterial({ 
                    color: 0xe6ccff, // Soft purple
                    transparent: true,
                    opacity: 0.6
                })
            );
            
            // Add some floating crystals
            for (let j = 0; j < 5; j++) {
                const crystal = new THREE.Mesh(
                    new THREE.OctahedronGeometry(0.3),
                    new THREE.MeshStandardMaterial({ 
                        color: 0x9966ff,
                        emissive: 0x3311aa,
                        emissiveIntensity: 0.5
                    })
                );
                
                const angle = (j / 5) * Math.PI * 2;
                crystal.position.set(
                    Math.cos(angle) * 2,
                    Math.sin(Date.now() * 0.001 + j) * 0.5 + 1,
                    Math.sin(angle) * 2
                );
                spot.add(crystal);
            }
            
            spot.add(platform);
            spot.position.set(
                Math.random() * 60 - 30,
                0.1,
                Math.random() * 60 - 30
            );
            
            this.meditationSpots.push(spot);
            this.scene.add(spot);
        }
    }

    updateMeditationSpots() {
        const playerPos = this.player.position.clone();
        playerPos.y = 0;
        
        this.meditationSpots.forEach(spot => {
            // Rotate crystals
            spot.children.forEach((crystal, index) => {
                if (index > 0) { // Skip the platform (index 0)
                    crystal.position.y = Math.sin(Date.now() * 0.001 + index) * 0.5 + 1;
                    crystal.rotation.y += 0.01;
                }
            });
            
            // Check if player is in meditation spot
            const distance = playerPos.distanceTo(spot.position);
            if (distance < 3) {
                this.heal(0.2);
                this.increaseEnergy(0.3);
                this.healingProgress += 0.01;
                // Update progress display
                document.querySelector('#progress-fill').style.width = 
                    (this.healingProgress * 100) + '%';
            }
        });
    }

    increaseEnergy(amount) {
        this.energy = Math.min(100, this.energy + amount);
        document.querySelector('#energy-fill').style.width = this.energy + '%';
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update game state
        this.movePlayer();
        this.updateCamera();
        this.updateHealingZones();
        this.updateMeditationSpots();
        this.updateNPCs();
        
        // Slowly decrease energy over time
        this.energy = Math.max(0, this.energy - 0.01);
        document.querySelector('#energy-fill').style.width = this.energy + '%';
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}

// Start the game when the page is fully loaded
window.addEventListener('load', () => {
    try {
        const game = new Game();
    } catch (error) {
        console.error('Error starting game:', error);
        document.getElementById('loading').textContent = 'Error loading game. Please refresh the page.';
    }
}); 
