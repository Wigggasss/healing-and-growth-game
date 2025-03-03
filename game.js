// Game class definition
class Game {
    constructor() {
        this.initialize();
        this.setupInputs();
        this.health = 100;
        this.energy = 100;
        this.isJumping = false;
        this.velocity = new THREE.Vector3();
        this.moveSpeed = 0.15;
        this.jumpForce = 0.3;
        this.gravity = 0.01;
        this.healingProgress = 0;
        this.meditationTime = 0;
        this.isMeditating = false;
        this.flowers = [];
        this.level = 1;
        this.experience = 0;
        this.maxExperience = 100;
        this.achievements = [];
        this.textureLoader = new THREE.TextureLoader();
    }

    initialize() {
        try {
            // Create scene with a calming sky color
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0xb8e6ff);
            
            // Create camera
            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.camera.position.set(0, 5, 10);
            
            // Create renderer with better quality
            this.renderer = new THREE.WebGLRenderer({ 
                antialias: true,
                alpha: true
            });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            document.body.appendChild(this.renderer.domElement);
            
            // Add lights
            this.addLights();
            
            // Add environment
            this.addGround();
            this.addFlowers();
            this.addMeditationSpots();
            this.addHealingZones();
            this.addNPCs();
            this.addPlayer();
            
            // Handle window resize
            window.addEventListener('resize', () => this.onWindowResize(), false);
            
            // Hide loading screen
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
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // Add a gentle point light for better atmosphere
        const pointLight = new THREE.PointLight(0xffffff, 0.8, 50);
        pointLight.position.set(0, 10, 0);
        this.scene.add(pointLight);

        // Add hemisphere light for better color balance
        const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x3a7e4f, 0.5);
        hemisphereLight.position.set(0, 20, 0);
        this.scene.add(hemisphereLight);
    }

    addGround() {
        // Create a more natural-looking ground with better textures
        const groundGeometry = new THREE.PlaneGeometry(100, 100, 50, 50);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3a7e4f,
            roughness: 0.8,
            metalness: 0.2,
            wireframe: false,
            flatShading: true
        });
        
        // Add more natural terrain variation
        const vertices = groundGeometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            if (i !== 0) {
                const x = vertices[i];
                const z = vertices[i + 2];
                // Create more interesting terrain using multiple sine waves
                vertices[i + 1] = 
                    Math.sin(x * 0.1) * 0.5 + 
                    Math.cos(z * 0.1) * 0.5 +
                    Math.sin((x + z) * 0.05) * 0.3;
            }
        }
        
        // Update normals for better lighting
        groundGeometry.computeVertexNormals();
        
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
    }

    addFlowers() {
        // Create flowers that grow and bloom
        for (let i = 0; i < 50; i++) {
            const flower = new THREE.Group();
            
            // Stem with better material
            const stem = new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.05, 0.5, 12),
                new THREE.MeshStandardMaterial({ 
                    color: 0x2ecc71,
                    roughness: 0.7,
                    metalness: 0.1
                })
            );
            
            // Petals with better materials
            const petals = new THREE.Group();
            for (let j = 0; j < 6; j++) {
                const petal = new THREE.Mesh(
                    new THREE.SphereGeometry(0.1, 12, 12),
                    new THREE.MeshStandardMaterial({ 
                        color: 0xff69b4,
                        emissive: 0xff1493,
                        emissiveIntensity: 0.3,
                        roughness: 0.4,
                        metalness: 0.1
                    })
                );
                const angle = (j / 6) * Math.PI * 2;
                petal.position.set(
                    Math.cos(angle) * 0.1,
                    0.3,
                    Math.sin(angle) * 0.1
                );
                petals.add(petal);
            }
            
            flower.add(stem);
            flower.add(petals);
            
            // Random position on ground
            const x = Math.random() * 80 - 40;
            const z = Math.random() * 80 - 40;
            flower.position.set(x, 0, z);
            
            // Add growth animation properties
            flower.scale.set(0, 0, 0);
            flower.growthProgress = 0;
            flower.isGrowing = true;
            
            this.flowers.push(flower);
            this.scene.add(flower);
        }
    }

    updateFlowers() {
        this.flowers.forEach(flower => {
            if (flower.isGrowing) {
                flower.growthProgress += 0.01;
                flower.scale.set(
                    flower.growthProgress,
                    flower.growthProgress,
                    flower.growthProgress
                );
                
                if (flower.growthProgress >= 1) {
                    flower.isGrowing = false;
                }
            }
            
            // Gentle swaying animation
            flower.rotation.y = Math.sin(Date.now() * 0.001 + flower.position.x) * 0.1;
        });
    }

    addPlayer() {
        // Create player group
        this.player = new THREE.Group();
        
        // Create player body with better materials
        const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 16);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4CAF50,
            roughness: 0.5,
            metalness: 0.2,
            emissive: 0x2E7D32,
            emissiveIntensity: 0.2
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.5;
        body.castShadow = true;
        
        // Create player head with better materials
        const headGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFE0B2,
            roughness: 0.3,
            metalness: 0.1
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2.5;
        head.castShadow = true;

        // Add aura effect
        const auraGeometry = new THREE.SphereGeometry(1.2, 16, 16);
        const auraMaterial = new THREE.MeshStandardMaterial({
            color: 0x4CAF50,
            transparent: true,
            opacity: 0.2,
            emissive: 0x4CAF50,
            emissiveIntensity: 0.5
        });
        const aura = new THREE.Mesh(auraGeometry, auraMaterial);
        aura.position.y = 2;
        this.player.aura = aura;

        // Add body, head, and aura to player group
        this.player.add(body);
        this.player.add(head);
        this.player.add(aura);
        
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
            -cameraDirection.z, // Fixed A/D movement
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

        // Update aura effect
        if (this.player.aura) {
            this.player.aura.material.opacity = 0.2 + Math.sin(Date.now() * 0.003) * 0.1;
            this.player.aura.material.emissiveIntensity = 0.5 + Math.sin(Date.now() * 0.003) * 0.2;
        }
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
        
        for (let i = 0; i < 3; i++) {
            const spot = new THREE.Group();
            
            // Create a more elaborate meditation platform
            const platform = new THREE.Mesh(
                new THREE.CylinderGeometry(3, 3, 0.2, 32),
                new THREE.MeshStandardMaterial({ 
                    color: 0xe6ccff,
                    transparent: true,
                    opacity: 0.6,
                    emissive: 0x9966ff,
                    emissiveIntensity: 0.2
                })
            );
            
            // Add floating crystals with better effects
            for (let j = 0; j < 8; j++) {
                const crystal = new THREE.Mesh(
                    new THREE.OctahedronGeometry(0.3),
                    new THREE.MeshStandardMaterial({ 
                        color: 0x9966ff,
                        emissive: 0x3311aa,
                        emissiveIntensity: 0.5,
                        transparent: true,
                        opacity: 0.8
                    })
                );
                
                const angle = (j / 8) * Math.PI * 2;
                crystal.position.set(
                    Math.cos(angle) * 2,
                    Math.sin(Date.now() * 0.001 + j) * 0.5 + 1,
                    Math.sin(angle) * 2
                );
                spot.add(crystal);
            }
            
            // Add energy particles
            const particles = new THREE.Group();
            for (let j = 0; j < 20; j++) {
                const particle = new THREE.Mesh(
                    new THREE.SphereGeometry(0.05, 8, 8),
                    new THREE.MeshBasicMaterial({ 
                        color: 0x9966ff,
                        transparent: true,
                        opacity: 0.6
                    })
                );
                
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 3;
                particle.position.set(
                    Math.cos(angle) * radius,
                    Math.random() * 2,
                    Math.sin(angle) * radius
                );
                particles.add(particle);
            }
            
            spot.add(platform);
            spot.add(particles);
            spot.particles = particles;
            
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
            // Update crystals
            spot.children.forEach((child, index) => {
                if (index > 0 && index <= 8) { // Crystals
                    child.position.y = Math.sin(Date.now() * 0.001 + index) * 0.5 + 1;
                    child.rotation.y += 0.01;
                }
            });
            
            // Update particles
            if (spot.particles) {
                spot.particles.rotation.y += 0.01;
                spot.particles.children.forEach(particle => {
                    particle.position.y = Math.sin(Date.now() * 0.003 + particle.position.x) * 0.5 + 1;
                });
            }
            
            // Check if player is in meditation spot
            const distance = playerPos.distanceTo(spot.position);
            if (distance < 3) {
                this.isMeditating = true;
                this.meditationTime += 0.01;
                this.heal(0.1);
                this.increaseEnergy(0.2);
                this.healingProgress += 0.005;
                this.addExperience(0.1);
                
                // Update UI
                document.querySelector('#progress-fill').style.width = 
                    (this.healingProgress * 100) + '%';
                
                // Visual feedback
                spot.children[0].material.emissiveIntensity = 0.4;
            } else {
                this.isMeditating = false;
                spot.children[0].material.emissiveIntensity = 0.2;
            }
        });
    }

    increaseEnergy(amount) {
        this.energy = Math.min(100, this.energy + amount);
        document.querySelector('#energy-fill').style.width = this.energy + '%';
    }

    addExperience(amount) {
        this.experience += amount;
        if (this.experience >= this.maxExperience) {
            this.levelUp();
        }
        // Update experience bar
        document.querySelector('#experience-fill').style.width = 
            (this.experience / this.maxExperience * 100) + '%';
    }

    levelUp() {
        this.level++;
        this.experience = 0;
        this.maxExperience *= 1.5;
        this.heal(50);
        this.increaseEnergy(50);
        
        // Update level display
        document.getElementById('level-display').textContent = `Level ${this.level}`;
        
        // Show level up effect
        this.showLevelUpEffect();
        
        // Show level up text
        const levelUpText = document.getElementById('level-up');
        levelUpText.style.opacity = '1';
        setTimeout(() => {
            levelUpText.style.opacity = '0';
        }, 2000);
    }

    showLevelUpEffect() {
        // Create a burst of particles
        const particles = new THREE.Group();
        for (let i = 0; i < 20; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 8, 8),
                new THREE.MeshBasicMaterial({ 
                    color: 0x4CAF50,
                    transparent: true,
                    opacity: 0.8
                })
            );
            
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 2;
            particle.position.set(
                Math.cos(angle) * radius,
                Math.random() * 2,
                Math.sin(angle) * radius
            );
            particles.add(particle);
        }
        
        this.player.add(particles);
        
        // Animate and remove particles
        setTimeout(() => {
            this.player.remove(particles);
        }, 1000);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update game state
        this.movePlayer();
        this.updateCamera();
        this.updateHealingZones();
        this.updateMeditationSpots();
        this.updateFlowers();
        this.updateNPCs();
        
        // Energy management
        if (!this.isMeditating) {
            this.energy = Math.max(0, this.energy - 0.01);
            document.querySelector('#energy-fill').style.width = this.energy + '%';
        }
        
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
