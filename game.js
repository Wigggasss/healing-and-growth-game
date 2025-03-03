import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { VignetteShader } from 'three/addons/shaders/VignetteShader.js';

// Game Systems
export class WeatherSystem {
    constructor() {
        this.weatherTypes = ['sunny', 'rainy', 'cloudy', 'stormy', 'foggy'];
        this.currentWeather = 'sunny';
        this.transitionTime = 0;
        this.particles = [];
        this.effects = [];
    }

    initialize(scene) {
        this.scene = scene;
        this.setupWeatherEffects();
        this.startWeatherCycle();
    }

    setupWeatherEffects() {
        // Create rain particles
        this.rainParticles = new THREE.Group();
        for (let i = 0; i < 1000; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0x87CEEB })
            );
            particle.position.set(
                Math.random() * 200 - 100,
                Math.random() * 100,
                Math.random() * 200 - 100
            );
            particle.userData.velocity = new THREE.Vector3(0, -0.1, 0);
            this.rainParticles.add(particle);
        }
        this.scene.add(this.rainParticles);

        // Create fog effect
        this.fog = new THREE.Fog(0x87CEEB, 50, 200);
        this.scene.fog = this.fog;
    }

    startWeatherCycle() {
        setInterval(() => {
            this.changeWeather();
        }, 30000); // Change weather every 30 seconds
    }

    changeWeather() {
        const newWeather = this.weatherTypes[Math.floor(Math.random() * this.weatherTypes.length)];
        this.transitionToWeather(newWeather);
    }

    transitionToWeather(newWeather) {
        this.currentWeather = newWeather;
        document.getElementById('weather').textContent = newWeather.charAt(0).toUpperCase() + newWeather.slice(1);
        
        switch(newWeather) {
            case 'rainy':
                this.startRain();
                break;
            case 'stormy':
                this.startStorm();
                break;
            case 'foggy':
                this.startFog();
                break;
            default:
                this.clearWeatherEffects();
        }
    }

    startRain() {
        this.rainParticles.visible = true;
        this.scene.background = new THREE.Color(0x4a6b8a);
    }

    startStorm() {
        this.startRain();
        this.addLightning();
    }

    startFog() {
        this.fog.density = 0.05;
    }

    clearWeatherEffects() {
        this.rainParticles.visible = false;
        this.scene.background = new THREE.Color(0xb8e6ff);
        this.fog.density = 0;
    }

    addLightning() {
        const flash = new THREE.Mesh(
            new THREE.PlaneGeometry(200, 200),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        flash.position.z = -50;
        this.scene.add(flash);

        setTimeout(() => {
            this.scene.remove(flash);
        }, 100);
    }

    update() {
        if (this.rainParticles.visible) {
            this.rainParticles.children.forEach(particle => {
                particle.position.add(particle.userData.velocity);
                if (particle.position.y < 0) {
                    particle.position.y = 100;
                }
            });
        }
    }
}

export class DayNightCycle {
    constructor() {
        this.time = 0;
        this.dayLength = 300; // 5 minutes per day
        this.sunPosition = new THREE.Vector3();
        this.moonPosition = new THREE.Vector3();
    }

    initialize(scene) {
        this.scene = scene;
        this.setupSunAndMoon();
        this.startCycle();
    }

    setupSunAndMoon() {
        // Create sun
        this.sun = new THREE.Mesh(
            new THREE.SphereGeometry(2, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0xffff00 })
        );
        this.scene.add(this.sun);

        // Create moon
        this.moon = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0xcccccc })
        );
        this.scene.add(this.moon);
    }

    startCycle() {
        setInterval(() => {
            this.updateTime();
        }, 1000);
    }

    updateTime() {
        this.time = (this.time + 1) % this.dayLength;
        this.updateSunAndMoonPositions();
        this.updateLighting();
        this.updateSkyColor();
    }

    updateSunAndMoonPositions() {
        const angle = (this.time / this.dayLength) * Math.PI * 2;
        
        // Update sun position
        this.sunPosition.x = Math.cos(angle) * 100;
        this.sunPosition.y = Math.sin(angle) * 50;
        this.sunPosition.z = Math.sin(angle) * 100;
        this.sun.position.copy(this.sunPosition);

        // Update moon position (opposite to sun)
        this.moonPosition.x = -this.sunPosition.x;
        this.moonPosition.y = -this.sunPosition.y;
        this.moonPosition.z = -this.sunPosition.z;
        this.moon.position.copy(this.moonPosition);
    }

    updateLighting() {
        const timeOfDay = this.time / this.dayLength;
        const intensity = Math.sin(timeOfDay * Math.PI);
        
        // Update directional light intensity
        this.scene.children.forEach(child => {
            if (child instanceof THREE.DirectionalLight) {
                child.intensity = Math.max(0.1, intensity);
            }
        });
    }

    updateSkyColor() {
        const timeOfDay = this.time / this.dayLength;
        let skyColor;
        
        if (timeOfDay < 0.25) { // Dawn
            skyColor = new THREE.Color(0xff9966);
        } else if (timeOfDay < 0.5) { // Day
            skyColor = new THREE.Color(0xb8e6ff);
        } else if (timeOfDay < 0.75) { // Dusk
            skyColor = new THREE.Color(0xff9966);
        } else { // Night
            skyColor = new THREE.Color(0x1a1a2e);
        }
        
        this.scene.background = skyColor;
    }

    getTimeString() {
        const hours = Math.floor((this.time / this.dayLength) * 24);
        const minutes = Math.floor(((this.time / this.dayLength) * 24 - hours) * 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
}

export class Inventory {
    constructor() {
        this.items = [];
        this.maxItems = 20;
    }

    initialize() {
        this.setupUI();
        this.addDefaultItems();
    }

    setupUI() {
        const inventoryContainer = document.getElementById('inventory-items');
        inventoryContainer.innerHTML = '';
        
        for (let i = 0; i < this.maxItems; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            inventoryContainer.appendChild(slot);
        }
    }

    addDefaultItems() {
        this.addItem({
            name: 'Health Potion',
            type: 'consumable',
            effect: { health: 50 },
            icon: '❤️'
        });
        
        this.addItem({
            name: 'Energy Crystal',
            type: 'consumable',
            effect: { energy: 50 },
            icon: '⚡'
        });
    }

    addItem(item) {
        if (this.items.length < this.maxItems) {
            this.items.push(item);
            this.updateUI();
        }
    }

    removeItem(index) {
        if (index >= 0 && index < this.items.length) {
            this.items.splice(index, 1);
            this.updateUI();
        }
    }

    useItem(index) {
        if (index >= 0 && index < this.items.length) {
            const item = this.items[index];
            if (item.type === 'consumable') {
                this.applyItemEffect(item);
                this.removeItem(index);
            }
        }
    }

    applyItemEffect(item) {
        if (item.effect.health) {
            game.heal(item.effect.health);
        }
        if (item.effect.energy) {
            game.increaseEnergy(item.effect.energy);
        }
    }

    updateUI() {
        const slots = document.querySelectorAll('.inventory-slot');
        slots.forEach((slot, index) => {
            if (index < this.items.length) {
                const item = this.items[index];
                slot.innerHTML = `${item.icon} ${item.name}`;
                slot.style.display = 'block';
            } else {
                slot.innerHTML = '';
                slot.style.display = 'none';
            }
        });
    }
}

export class QuestSystem {
    constructor() {
        this.quests = [];
        this.activeQuests = [];
        this.completedQuests = [];
    }

    initialize() {
        this.setupUI();
        this.addDefaultQuests();
    }

    setupUI() {
        const questContainer = document.getElementById('quest-list');
        questContainer.innerHTML = '';
    }

    addDefaultQuests() {
        this.addQuest({
            id: 'quest1',
            title: 'First Steps',
            description: 'Find and meditate at a meditation spot',
            objectives: [
                { type: 'meditate', target: 1, current: 0 }
            ],
            rewards: {
                experience: 50,
                items: [
                    { name: 'Health Potion', type: 'consumable', effect: { health: 50 } }
                ]
            }
        });

        this.addQuest({
            id: 'quest2',
            title: 'Flower Power',
            description: 'Collect 5 flowers',
            objectives: [
                { type: 'collect_flowers', target: 5, current: 0 }
            ],
            rewards: {
                experience: 100,
                items: [
                    { name: 'Energy Crystal', type: 'consumable', effect: { energy: 50 } }
                ]
            }
        });
    }

    addQuest(quest) {
        this.quests.push(quest);
        this.activeQuests.push(quest);
        this.updateUI();
    }

    updateQuestProgress(type, amount = 1) {
        this.activeQuests.forEach(quest => {
            quest.objectives.forEach(objective => {
                if (objective.type === type) {
                    objective.current += amount;
                    if (objective.current >= objective.target) {
                        this.completeQuest(quest);
                    }
                }
            });
        });
        this.updateUI();
    }

    completeQuest(quest) {
        const index = this.activeQuests.indexOf(quest);
        if (index > -1) {
            this.activeQuests.splice(index, 1);
            this.completedQuests.push(quest);
            
            // Give rewards
            if (quest.rewards.experience) {
                game.addExperience(quest.rewards.experience);
            }
            if (quest.rewards.items) {
                quest.rewards.items.forEach(item => {
                    game.inventory.addItem(item);
                });
            }
        }
    }

    updateUI() {
        const questContainer = document.getElementById('quest-list');
        questContainer.innerHTML = '';
        
        this.activeQuests.forEach(quest => {
            const questElement = document.createElement('div');
            questElement.className = 'quest-item';
            questElement.innerHTML = `
                <h4>${quest.title}</h4>
                <p>${quest.description}</p>
                <div class="quest-progress">
                    ${quest.objectives.map(obj => 
                        `${obj.type}: ${obj.current}/${obj.target}`
                    ).join('<br>')}
                </div>
            `;
            questContainer.appendChild(questElement);
        });
    }
}

export class SkillSystem {
    constructor() {
        this.skills = [];
        this.skillPoints = 0;
    }

    initialize() {
        this.setupUI();
        this.addDefaultSkills();
    }

    setupUI() {
        const skillContainer = document.getElementById('skills');
        skillContainer.innerHTML = '<h3>Skills</h3>';
    }

    addDefaultSkills() {
        this.addSkill({
            name: 'Healing',
            level: 1,
            maxLevel: 10,
            description: 'Increases healing effectiveness',
            effect: { healingMultiplier: 1.1 }
        });

        this.addSkill({
            name: 'Energy',
            level: 1,
            maxLevel: 10,
            description: 'Increases energy regeneration',
            effect: { energyMultiplier: 1.1 }
        });

        this.addSkill({
            name: 'Growth',
            level: 1,
            maxLevel: 10,
            description: 'Increases experience gain',
            effect: { experienceMultiplier: 1.1 }
        });
    }

    addSkill(skill) {
        this.skills.push(skill);
        this.updateUI();
    }

    levelUpSkill(skillName) {
        const skill = this.skills.find(s => s.name === skillName);
        if (skill && skill.level < skill.maxLevel && this.skillPoints > 0) {
            skill.level++;
            this.skillPoints--;
            this.updateUI();
        }
    }

    getSkillEffect(skillName) {
        const skill = this.skills.find(s => s.name === skillName);
        return skill ? skill.effect : null;
    }

    updateUI() {
        const skillContainer = document.getElementById('skills');
        skillContainer.innerHTML = `
            <h3>Skills</h3>
            <p>Skill Points: ${this.skillPoints}</p>
            ${this.skills.map(skill => `
                <div class="skill-item">
                    <h4>${skill.name} (Level ${skill.level}/${skill.maxLevel})</h4>
                    <p>${skill.description}</p>
                    <div class="skill-bar">
                        <div class="skill-fill" style="width: ${(skill.level / skill.maxLevel) * 100}%"></div>
                    </div>
                    <button onclick="game.skills.levelUpSkill('${skill.name}')" 
                            ${this.skillPoints <= 0 ? 'disabled' : ''}>
                        Level Up
                    </button>
                </div>
            `).join('')}
        `;
    }
}

export class EffectSystem {
    constructor() {
        this.effects = [];
        this.particleSystems = [];
    }

    initialize(scene) {
        this.scene = scene;
        this.setupParticleSystems();
    }

    setupParticleSystems() {
        // Create particle system for healing effects
        this.healingParticles = new THREE.Group();
        for (let i = 0; i < 20; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0x00ff00 })
            );
            this.healingParticles.add(particle);
        }
        this.scene.add(this.healingParticles);
        this.healingParticles.visible = false;

        // Create particle system for energy effects
        this.energyParticles = new THREE.Group();
        for (let i = 0; i < 20; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0x00ffff })
            );
            this.energyParticles.add(particle);
        }
        this.scene.add(this.energyParticles);
        this.energyParticles.visible = false;
    }

    showHealingEffect(position) {
        this.healingParticles.position.copy(position);
        this.healingParticles.visible = true;
        this.healingParticles.children.forEach(particle => {
            particle.position.set(
                Math.random() * 2 - 1,
                Math.random() * 2,
                Math.random() * 2 - 1
            );
            particle.userData.velocity = new THREE.Vector3(
                Math.random() * 0.1 - 0.05,
                Math.random() * 0.2,
                Math.random() * 0.1 - 0.05
            );
        });

        setTimeout(() => {
            this.healingParticles.visible = false;
        }, 1000);
    }

    showEnergyEffect(position) {
        this.energyParticles.position.copy(position);
        this.energyParticles.visible = true;
        this.energyParticles.children.forEach(particle => {
            particle.position.set(
                Math.random() * 2 - 1,
                Math.random() * 2,
                Math.random() * 2 - 1
            );
            particle.userData.velocity = new THREE.Vector3(
                Math.random() * 0.1 - 0.05,
                Math.random() * 0.2,
                Math.random() * 0.1 - 0.05
            );
        });

        setTimeout(() => {
            this.energyParticles.visible = false;
        }, 1000);
    }

    showLevelUpEffect(position) {
        const particles = new THREE.Group();
        for (let i = 0; i < 30; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.2, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0xffff00 })
            );
            particle.position.copy(position);
            particle.userData.velocity = new THREE.Vector3(
                Math.random() * 0.5 - 0.25,
                Math.random() * 0.5,
                Math.random() * 0.5 - 0.25
            );
            particles.add(particle);
        }
        this.scene.add(particles);

        setTimeout(() => {
            this.scene.remove(particles);
        }, 2000);
    }

    update() {
        if (this.healingParticles.visible) {
            this.healingParticles.children.forEach(particle => {
                particle.position.add(particle.userData.velocity);
            });
        }

        if (this.energyParticles.visible) {
            this.energyParticles.children.forEach(particle => {
                particle.position.add(particle.userData.velocity);
            });
        }
    }
}

export class SoundSystem {
    constructor() {
        this.sounds = {};
        this.music = null;
        this.isMuted = false;
    }

    initialize() {
        this.loadSounds();
        this.setupMusic();
    }

    loadSounds() {
        this.sounds = {
            collect: new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'),
            levelUp: new Audio('https://assets.mixkit.co/active_storage/sfx/1434/1434-preview.mp3'),
            heal: new Audio('https://assets.mixkit.co/active_storage/sfx/1433/1433-preview.mp3'),
            energy: new Audio('https://assets.mixkit.co/active_storage/sfx/1432/1432-preview.mp3')
        };
    }

    setupMusic() {
        this.music = new Audio('https://assets.mixkit.co/music/preview/mixkit-game-level-music-689.mp3');
        this.music.loop = true;
        this.music.volume = 0.5;
    }

    play(soundName) {
        if (!this.isMuted && this.sounds[soundName]) {
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play();
        }
    }

    playMusic() {
        if (!this.isMuted && this.music) {
            this.music.play();
        }
    }

    stopMusic() {
        if (this.music) {
            this.music.pause();
            this.music.currentTime = 0;
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopMusic();
        } else {
            this.playMusic();
        }
    }

    update() {
        // Update sound system state
    }
}

export class AnimationSystem {
    constructor() {
        this.animations = new Map();
        this.currentAnimation = null;
    }

    initialize() {
        this.setupAnimations();
    }

    setupAnimations() {
        // Add default animations
        this.addAnimation('idle', {
            duration: 1000,
            frames: [
                { rotation: { y: 0 } },
                { rotation: { y: 0.1 } },
                { rotation: { y: -0.1 } },
                { rotation: { y: 0 } }
            ]
        });

        this.addAnimation('walk', {
            duration: 500,
            frames: [
                { position: { y: 0 } },
                { position: { y: 0.1 } },
                { position: { y: 0 } }
            ]
        });

        this.addAnimation('jump', {
            duration: 500,
            frames: [
                { position: { y: 0 } },
                { position: { y: 1 } },
                { position: { y: 0 } }
            ]
        });
    }

    addAnimation(name, animation) {
        this.animations.set(name, animation);
    }

    playAnimation(name, target) {
        const animation = this.animations.get(name);
        if (animation) {
            this.currentAnimation = {
                name,
                target,
                frames: animation.frames,
                duration: animation.duration,
                startTime: Date.now(),
                currentFrame: 0
            };
        }
    }

    update() {
        if (this.currentAnimation) {
            const elapsed = Date.now() - this.currentAnimation.startTime;
            const progress = elapsed / this.currentAnimation.duration;

            if (progress >= 1) {
                this.currentAnimation = null;
                return;
            }

            const frameIndex = Math.floor(progress * this.currentAnimation.frames.length);
            const frame = this.currentAnimation.frames[frameIndex];

            // Apply animation frame to target
            if (frame.position) {
                Object.entries(frame.position).forEach(([axis, value]) => {
                    this.currentAnimation.target.position[axis] = value;
                });
            }
            if (frame.rotation) {
                Object.entries(frame.rotation).forEach(([axis, value]) => {
                    this.currentAnimation.target.rotation[axis] = value;
                });
            }
        }
    }
}

export class CollisionSystem {
    constructor() {
        this.colliders = new Map();
    }

    initialize() {
        this.setupColliders();
    }

    setupColliders() {
        // Add default colliders
        this.addCollider('player', {
            type: 'sphere',
            radius: 0.5,
            position: new THREE.Vector3()
        });

        this.addCollider('ground', {
            type: 'plane',
            normal: new THREE.Vector3(0, 1, 0),
            constant: 0
        });
    }

    addCollider(name, collider) {
        this.colliders.set(name, collider);
    }

    checkCollision(collider1, collider2) {
        if (collider1.type === 'sphere' && collider2.type === 'plane') {
            return this.checkSpherePlaneCollision(collider1, collider2);
        }
        return false;
    }

    checkSpherePlaneCollision(sphere, plane) {
        const distance = sphere.position.dot(plane.normal) - plane.constant;
        return distance <= sphere.radius;
    }

    update() {
        // Update collider positions
        const playerCollider = this.colliders.get('player');
        if (playerCollider) {
            playerCollider.position.copy(game.player.position);
        }
    }
}

export class PathfindingSystem {
    constructor() {
        this.grid = [];
        this.paths = new Map();
    }

    initialize() {
        this.setupGrid();
    }

    setupGrid() {
        // Create a grid for pathfinding
        const size = 100;
        const resolution = 1;
        this.grid = Array(size / resolution).fill().map(() => 
            Array(size / resolution).fill(0)
        );
    }

    findPath(start, end) {
        // Simple A* pathfinding implementation
        const path = [];
        let current = start.clone();
        
        while (current.distanceTo(end) > 0.1) {
            const direction = end.clone().sub(current).normalize();
            current.add(direction.multiplyScalar(0.1));
            path.push(current.clone());
        }
        
        return path;
    }

    update() {
        // Update pathfinding grid
    }
}

export class TerrainSystem {
    constructor() {
        this.terrain = null;
        this.heightMap = null;
    }

    initialize(scene) {
        this.scene = scene;
        this.generateTerrain();
    }

    generateTerrain() {
        const size = 100;
        const resolution = 50;
        const geometry = new THREE.PlaneGeometry(size, size, resolution, resolution);
        
        // Generate height map
        const vertices = geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 2];
            vertices[i + 1] = this.generateHeight(x, z);
        }
        
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshStandardMaterial({
            color: 0x3a7e4f,
            roughness: 0.8,
            metalness: 0.2,
            wireframe: false,
            flatShading: true
        });
        
        this.terrain = new THREE.Mesh(geometry, material);
        this.terrain.rotation.x = -Math.PI / 2;
        this.terrain.receiveShadow = true;
        this.scene.add(this.terrain);
    }

    generateHeight(x, z) {
        return Math.sin(x * 0.1) * 0.5 + 
               Math.cos(z * 0.1) * 0.5 +
               Math.sin((x + z) * 0.05) * 0.3;
    }

    getHeightAt(x, z) {
        // Interpolate height from terrain mesh
        return 0; // Placeholder
    }

    update() {
        // Update terrain if needed
    }
}

export class VegetationSystem {
    constructor() {
        this.plants = [];
        this.trees = [];
        this.grass = [];
    }

    initialize(scene) {
        this.scene = scene;
        this.generateVegetation();
    }

    generateVegetation() {
        // Generate trees
        for (let i = 0; i < 20; i++) {
            this.addTree();
        }

        // Generate grass
        for (let i = 0; i < 1000; i++) {
            this.addGrass();
        }
    }

    addTree() {
        const tree = new THREE.Group();
        
        // Tree trunk
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.4, 2, 8),
            new THREE.MeshStandardMaterial({ color: 0x4a2f1c })
        );
        trunk.position.y = 1;
        trunk.castShadow = true;
        
        // Tree crown
        const crown = new THREE.Mesh(
            new THREE.ConeGeometry(1.5, 3, 8),
            new THREE.MeshStandardMaterial({ color: 0x2d5a27 })
        );
        crown.position.y = 2.5;
        crown.castShadow = true;
        
        tree.add(trunk);
        tree.add(crown);
        
        // Random position
        tree.position.set(
            Math.random() * 80 - 40,
            0,
            Math.random() * 80 - 40
        );
        
        this.trees.push(tree);
        this.scene.add(tree);
    }

    addGrass() {
        const grass = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8),
            new THREE.MeshStandardMaterial({ color: 0x2ecc71 })
        );
        
        grass.position.set(
            Math.random() * 80 - 40,
            0.25,
            Math.random() * 80 - 40
        );
        
        this.grass.push(grass);
        this.scene.add(grass);
    }

    update() {
        // Update vegetation animations
        this.grass.forEach(blade => {
            blade.rotation.z = Math.sin(Date.now() * 0.001 + blade.position.x) * 0.1;
        });
    }
}

// Export all systems at the end of the file
export {
    WeatherSystem,
    DayNightCycle,
    Inventory,
    QuestSystem,
    SkillSystem,
    EffectSystem,
    SoundSystem,
    AnimationSystem,
    CollisionSystem,
    PathfindingSystem,
    TerrainSystem,
    VegetationSystem
}; 
