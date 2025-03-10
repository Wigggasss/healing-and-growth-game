import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { VignetteShader } from 'three/addons/shaders/VignetteShader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Game Systems
class WeatherSystem {
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

class DayNightCycle {
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

class Inventory {
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
            name: 'Spiritual Essence',
            type: 'consumable',
            effect: { energy: 50 },
            icon: '✨'
        });
        
        this.addItem({
            name: 'Universal Wisdom',
            type: 'consumable',
            effect: { health: 50 },
            icon: '🌟'
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

class QuestSystem {
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
            title: 'The Path of Letting Go',
            description: 'Begin your journey of healing by meditating at sacred spots and understanding the universal principle of release',
            objectives: [
                { type: 'meditate', target: 3, current: 0 }
            ],
            rewards: {
                experience: 100,
                items: [
                    { name: 'Spiritual Essence', type: 'consumable', effect: { energy: 50 } }
                ]
            }
        });

        this.addQuest({
            id: 'quest2',
            title: 'Manifesting Abundance',
            description: 'Collect sacred flowers while practicing the universal law of attraction',
            objectives: [
                { type: 'collect_flowers', target: 7, current: 0 }
            ],
            rewards: {
                experience: 150,
                items: [
                    { name: 'Universal Wisdom', type: 'consumable', effect: { health: 50 } }
                ]
            }
        });

        this.addQuest({
            id: 'quest3',
            title: 'The Power of Intention',
            description: 'Visit healing zones to strengthen your manifestation abilities',
            objectives: [
                { type: 'heal', target: 5, current: 0 }
            ],
            rewards: {
                experience: 200,
                items: [
                    { name: 'Manifestation Crystal', type: 'consumable', effect: { energy: 75, health: 75 } }
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

class SkillSystem {
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
            name: 'Release & Let Go',
            level: 1,
            maxLevel: 10,
            description: 'Master the universal principle of release to heal from past experiences',
            effect: { healingMultiplier: 1.2 }
        });

        this.addSkill({
            name: 'Law of Attraction',
            level: 1,
            maxLevel: 10,
            description: 'Harness the universal law of attraction to manifest your desires',
            effect: { energyMultiplier: 1.2 }
        });

        this.addSkill({
            name: 'Universal Flow',
            level: 1,
            maxLevel: 10,
            description: 'Align with universal energy flow for enhanced manifestation',
            effect: { experienceMultiplier: 1.2 }
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

class EffectSystem {
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

class SoundSystem {
    constructor() {
        this.isMuted = false;
        this.isInitialized = false;
    }

    initialize() {
        this.setupMuteButton();
    }

    setupMuteButton() {
        // Create mute button if it doesn't exist
        let muteButton = document.getElementById('mute-button');
        if (!muteButton) {
            muteButton = document.createElement('button');
            muteButton.id = 'mute-button';
            muteButton.innerHTML = '🔇';
            muteButton.className = 'mute-button';
            document.body.appendChild(muteButton);
        }

        // Style the mute button
        muteButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
            padding: 10px;
            border-radius: 50%;
            border: none;
            background: rgba(255, 255, 255, 0.8);
            cursor: pointer;
            font-size: 20px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;

        // Add click handler
        muteButton.addEventListener('click', () => {
            this.toggleMute();
            muteButton.innerHTML = this.isMuted ? '🔇' : '🔊';
        });
    }

    play(soundName) {
        // Do nothing
    }

    playMusic() {
        // Do nothing
    }

    stopMusic() {
        // Do nothing
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
    }

    update() {
        // Do nothing
    }
}

class AnimationSystem {
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

class CollisionSystem {
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

class PathfindingSystem {
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

class TerrainSystem {
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

class VegetationSystem {
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

    update() {
        // Update vegetation animations
        this.grass.forEach(blade => {
            blade.rotation.z = Math.sin(Date.now() * 0.001 + blade.position.x) * 0.1;
        });
    }
}

class GrassSystem {
    constructor() {
        this.grassInstances = [];
        this.grassCount = 10000;
        this.grassModel = null;
        this.grassMesh = null;
        this.healingRadius = 5;
        this.growthSpeed = 0.001;
    }

    initialize(scene) {
        this.scene = scene;
        this.loadGrassModel();
    }

    loadGrassModel() {
        const loader = new GLTFLoader();
        console.log('Starting to load grass model...');
        
        // Try loading with different possible URLs
        const urls = [
            'https://wigggasss.github.io/healing-and-growth-game/models/realtime_grass (1).glb',
            'models/realtime_grass (1).glb',
            './models/realtime_grass (1).glb'
        ];

        const tryLoadModel = (urlIndex) => {
            if (urlIndex >= urls.length) {
                console.error('All grass model URLs failed to load');
                this.createFallbackGrass();
                return;
            }

            const url = urls[urlIndex];
            console.log(`Attempting to load grass model from: ${url}`);
            
            loader.load(
                url,
                (gltf) => {
                    console.log('Grass model loaded successfully');
                    try {
                        // Log the model structure for debugging
                        console.log('Model structure:', gltf.scene);
                        
                        // Convert materials to standard Three.js materials
                        gltf.scene.traverse((node) => {
                            if (node.isMesh) {
                                console.log('Found mesh:', node.name);
                                console.log('Mesh geometry:', node.geometry);
                                console.log('Mesh material:', node.material);
                                
                                // Create a new standard material
                                const newMaterial = new THREE.MeshStandardMaterial({
                                    color: 0x3a7e4f,
                                    roughness: 0.8,
                                    metalness: 0.2,
                                    emissive: 0x2d5a27,
                                    emissiveIntensity: 0.2
                                });
                                node.material = newMaterial;
                            }
                        });
                        
                        this.grassModel = gltf.scene;
                        this.createGrass();
                    } catch (error) {
                        console.error('Error processing grass model:', error);
                        console.error('Error details:', {
                            message: error.message,
                            stack: error.stack,
                            type: error.constructor.name
                        });
                        tryLoadModel(urlIndex + 1);
                    }
                },
                (progress) => {
                    console.log(`Loading grass model: ${(progress.loaded / progress.total * 100).toFixed(2)}%`);
                    console.log(`Loaded: ${progress.loaded} bytes, Total: ${progress.total} bytes`);
                },
                (error) => {
                    console.error(`Error loading grass model from ${url}:`, error);
                    console.error('Error details:', {
                        message: error.message,
                        stack: error.stack,
                        type: error.constructor.name
                    });
                    tryLoadModel(urlIndex + 1);
                }
            );
        };

        // Start trying to load the model
        tryLoadModel(0);
    }

    createGrass() {
        if (!this.grassModel) {
            console.error('No grass model available');
            this.createFallbackGrass();
            return;
        }

        console.log('Creating grass instances from 3D model');
        
        // Create instanced mesh using the loaded model's geometry and material
        const firstMesh = this.grassModel.children[0];
        if (!firstMesh || !firstMesh.geometry || !firstMesh.material) {
            console.error('Invalid grass model structure');
            this.createFallbackGrass();
            return;
        }

        this.grassMesh = new THREE.InstancedMesh(
            firstMesh.geometry,
            firstMesh.material,
            this.grassCount
        );

        // Create grass instances with natural distribution
        const matrix = new THREE.Matrix4();
        const color = new THREE.Color();
        const position = new THREE.Vector3();
        const rotation = new THREE.Euler();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();

        // Create clusters of grass for more natural distribution
        const clusterCount = Math.floor(this.grassCount / 100); // 100 blades per cluster
        for (let cluster = 0; cluster < clusterCount; cluster++) {
            // Center of the cluster
            const clusterX = Math.random() * 160 - 80;
            const clusterZ = Math.random() * 160 - 80;
            
            // Create 100 blades in this cluster
            for (let i = 0; i < 100; i++) {
                const index = cluster * 100 + i;
                if (index >= this.grassCount) break;

                // Random position within cluster radius
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 2; // 2 unit radius for each cluster
                position.x = clusterX + Math.cos(angle) * radius;
                position.z = clusterZ + Math.sin(angle) * radius;
                position.y = 0.1; // Slightly above ground

                // Natural random rotation
                rotation.x = Math.random() * 0.3 - 0.15; // Slight tilt forward/backward
                rotation.y = Math.random() * Math.PI * 2; // Random rotation around Y axis
                rotation.z = Math.random() * 0.3 - 0.15; // Slight tilt left/right

                // Varying heights for more natural look
                const height = 0.6 + Math.random() * 0.4; // Height between 0.6 and 1.0
                scale.set(1, height, 1);

                // Set instance matrix
                matrix.compose(position, quaternion.setFromEuler(rotation), scale);
                this.grassMesh.setMatrixAt(index, matrix);

                // Slightly varying colors for more natural look
                const hue = 0.3 + Math.random() * 0.05; // Green hue with slight variation
                const saturation = 0.7 + Math.random() * 0.1; // Saturation variation
                const lightness = 0.4 + Math.random() * 0.1; // Lightness variation
                color.setHSL(hue, saturation, lightness);
                this.grassMesh.setColorAt(index, color);
            }
        }

        // Update instance matrices and colors
        this.grassMesh.instanceMatrix.needsUpdate = true;
        this.grassMesh.instanceColor.needsUpdate = true;

        // Add grass to scene
        this.scene.add(this.grassMesh);
        console.log('3D grass mesh added to scene:', this.grassMesh);
    }

    createFallbackGrass() {
        console.log('Creating fallback grass geometry');
        // ... existing fallback grass code ...
    }

    update() {
        if (!this.grassMesh) return;

        const time = Date.now() * 0.001;
        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const rotation = new THREE.Euler();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();
        const color = new THREE.Color();

        // Get player position for healing effect
        const playerPos = game.player.position;

        // Update each grass blade
        for (let i = 0; i < this.grassCount; i++) {
            this.grassMesh.getMatrixAt(i, matrix);
            matrix.decompose(position, quaternion, scale);

            // Ensure grass stays above ground
            position.y = Math.max(0.1, position.y);

            // Calculate distance to player
            const distanceToPlayer = position.distanceTo(playerPos);

            // Add wind effect with more natural movement
            rotation.setFromQuaternion(quaternion);
            const windStrength = Math.sin(time + position.x) * 0.1;
            rotation.x = windStrength;
            rotation.z = Math.cos(time + position.z) * 0.05;
            quaternion.setFromEuler(rotation);

            // Growth effect based on player proximity and meditation
            if (distanceToPlayer < this.healingRadius) {
                // Increase growth speed when player is meditating
                const growthMultiplier = game.isMeditating ? 2 : 1;
                scale.y = Math.min(1.2, scale.y + this.growthSpeed * growthMultiplier);

                // Add healing glow effect
                const glowIntensity = (1 - distanceToPlayer / this.healingRadius) * 0.5;
                color.setHSL(0.3, 0.8, 0.5 + glowIntensity);
                this.grassMesh.setColorAt(i, color);
            }

            // Rebuild matrix
            matrix.compose(position, quaternion, scale);
            this.grassMesh.setMatrixAt(i, matrix);
        }

        // Update instance matrices and colors
        this.grassMesh.instanceMatrix.needsUpdate = true;
        this.grassMesh.instanceColor.needsUpdate = true;
    }
}

// Game class definition
class Game {
    constructor() {
        try {
            // Initialize UI elements first
            this.initializeUI();
            
            // Initialize all arrays and collections
            this.flowers = [];
            this.healingZones = [];
            this.meditationSpots = [];
            this.npcs = [];
            this.achievements = [];
            this.particles = [];
            this.effects = [];
            this.sounds = {};
            this.animations = new Map();
            this.colliders = new Map();
            this.paths = new Map();

            // Initialize basic properties
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
            this.level = 1;
            this.experience = 0;
            this.maxExperience = 100;
            this.time = 0;
            this.gameState = 'playing';
            this.lastUpdate = Date.now();
            this.fps = 60;
            this.frameTime = 1000 / this.fps;

            // Create scene first
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0xb8e6ff);
            
            // Create camera
            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.camera.position.set(0, 5, 10);
            
            // Create renderer
            this.renderer = new THREE.WebGLRenderer({ 
                antialias: true,
                alpha: true
            });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            document.body.appendChild(this.renderer.domElement);

            // Initialize texture loader
            this.textureLoader = new THREE.TextureLoader();
            
            // Load textures with error handling
            this.textures = {};
            const textureUrls = {
                grass: 'https://wigggasss.github.io/healing-and-growth-game/textures/grass.png',
                dirt: 'https://wigggasss.github.io/healing-and-growth-game/textures/dirt.png',
                rock: 'https://wigggasss.github.io/healing-and-growth-game/textures/rock_round.png',
                flower: 'https://wigggasss.github.io/healing-and-growth-game/textures/rose.png',
                meditation: 'https://wigggasss.github.io/healing-and-growth-game/textures/meditation.png',
                healing: 'https://wigggasss.github.io/healing-and-growth-game/textures/spiritual-awakening-concept.jpg'
            };

            // Load textures with promises
            const texturePromises = Object.entries(textureUrls).map(([key, url]) => {
                return new Promise((resolve, reject) => {
                    console.log(`Attempting to load texture: ${key} from ${url}`);
                    this.textureLoader.load(
                        url,
                        (texture) => {
                            console.log(`Successfully loaded texture: ${key}`);
                            this.textures[key] = texture;
                            resolve();
                        },
                        (progress) => {
                            console.log(`Loading progress for ${key}: ${(progress.loaded / progress.total * 100).toFixed(2)}%`);
                        },
                        (error) => {
                            console.error(`Error loading texture ${key}:`, error);
                            console.error(`Failed URL: ${url}`);
                            reject(error);
                        }
                    );
                });
            });

            // Wait for all textures to load before proceeding
            Promise.all(texturePromises)
                .then(() => {
                    // Set up inputs
                    this.setupInputs();
                    
                    // Add game elements
                    this.addLights();
                    this.addGround();
                    this.addFlowers();
                    this.addMeditationSpots();
                    this.addHealingZones();
                    this.addNPCs();
                    this.addPlayer();
                    
                    // Handle window resize
                    window.addEventListener('resize', () => this.onWindowResize(), false);
                    
                    // Initialize all game systems
                    this.initializeSystems();
                    
                    // Hide loading screen
                    const loadingScreen = document.getElementById('loading');
                    if (loadingScreen) {
                        loadingScreen.style.display = 'none';
                    }
                    
                    // Start animation loop only after everything is initialized
                    this.isInitialized = true;
                    this.animate();
                })
                .catch(error => {
                    console.error('Error loading textures:', error);
                    const loadingScreen = document.getElementById('loading');
                    if (loadingScreen) {
                        loadingScreen.textContent = 'Error loading game textures. Please refresh the page.';
                    }
                });

        } catch (error) {
            console.error('Error in Game constructor:', error);
            const loadingScreen = document.getElementById('loading');
            if (loadingScreen) {
                loadingScreen.textContent = 'Error loading game. Please refresh the page.';
            }
        }
    }

    initializeUI() {
        // Create UI elements if they don't exist
        const uiElements = {
            'progress-fill': 'div',
            'health-fill': 'div',
            'energy-fill': 'div',
            'experience-fill': 'div',
            'level-display': 'div',
            'level-up': 'div',
            'loading': 'div'
        };

        Object.entries(uiElements).forEach(([id, elementType]) => {
            if (!document.getElementById(id)) {
                const element = document.createElement(elementType);
                element.id = id;
                element.className = id;
                document.body.appendChild(element);
            }
        });

        // Add click handler for audio initialization
        document.addEventListener('click', () => {
            if (this.sounds && !this.sounds.isInitialized) {
                this.sounds.playMusic();
                this.sounds.isInitialized = true;
            }
        }, { once: true });
    }

    initializeSystems() {
        try {
            // Initialize all game systems in the correct order
            this.weather = new WeatherSystem();
            this.dayNightCycle = new DayNightCycle();
            this.inventory = new Inventory();
            this.quests = new QuestSystem();
            this.skills = new SkillSystem();
            this.effects = new EffectSystem();
            this.sounds = new SoundSystem();
            this.animations = new AnimationSystem();
            this.collisions = new CollisionSystem();
            this.pathfinding = new PathfindingSystem();
            this.terrain = new TerrainSystem();
            this.vegetation = new VegetationSystem();
            this.grass = new GrassSystem();

            // Initialize each system with proper error handling
            try {
                this.weather.initialize(this.scene);
            } catch (error) {
                console.error('Error initializing weather system:', error);
            }

            try {
                this.dayNightCycle.initialize(this.scene);
            } catch (error) {
                console.error('Error initializing day/night cycle:', error);
            }

            try {
                this.inventory.initialize();
            } catch (error) {
                console.error('Error initializing inventory:', error);
            }

            try {
                this.quests.initialize();
            } catch (error) {
                console.error('Error initializing quests:', error);
            }

            try {
                this.skills.initialize();
            } catch (error) {
                console.error('Error initializing skills:', error);
            }

            try {
                this.effects.initialize(this.scene);
            } catch (error) {
                console.error('Error initializing effects:', error);
            }

            try {
                this.sounds.initialize();
            } catch (error) {
                console.error('Error initializing sounds:', error);
            }

            try {
                this.animations.initialize();
            } catch (error) {
                console.error('Error initializing animations:', error);
            }

            try {
                this.collisions.initialize();
            } catch (error) {
                console.error('Error initializing collisions:', error);
            }

            try {
                this.pathfinding.initialize();
            } catch (error) {
                console.error('Error initializing pathfinding:', error);
            }

            try {
                this.terrain.initialize(this.scene);
            } catch (error) {
                console.error('Error initializing terrain:', error);
            }

            try {
                this.vegetation.initialize(this.scene);
            } catch (error) {
                console.error('Error initializing vegetation:', error);
            }

            try {
                this.grass.initialize(this.scene);
            } catch (error) {
                console.error('Error initializing grass system:', error);
            }

            // Start background music after all systems are initialized
            if (this.sounds) {
                this.sounds.playMusic();
            }
        } catch (error) {
            console.error('Error initializing game systems:', error);
            throw error;
        }
    }

    setupInputs() {
        this.keys = {};
        this.mousePosition = new THREE.Vector2();
        this.isPointerLocked = false;
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.keys[e.key.toLowerCase()] = true);
        document.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);
        
        // Mouse controls with improved pointer lock
        document.addEventListener('mousemove', (e) => {
            if (this.isPointerLocked) {
                this.player.rotation.y -= e.movementX * 0.002;
                this.camera.rotation.x = THREE.MathUtils.clamp(
                    this.camera.rotation.x - e.movementY * 0.002,
                    -Math.PI / 3,
                    Math.PI / 3
                );
            }
        });

        // Improved pointer lock handling
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === this.renderer.domElement;
        });

        // Handle pointer lock errors
        document.addEventListener('pointerlockerror', () => {
            console.warn('Pointer lock error occurred');
            this.isPointerLocked = false;
        });

        // Lock pointer for better mouse control
        this.renderer.domElement.addEventListener('click', () => {
            if (!this.isPointerLocked) {
                this.renderer.domElement.requestPointerLock().catch(error => {
                    console.warn('Pointer lock request failed:', error);
                });
            }
        });

        // Add escape key handler to exit pointer lock
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isPointerLocked) {
                document.exitPointerLock();
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
        // Create a larger ground plane
        const groundGeometry = new THREE.PlaneGeometry(200, 200, 100, 100);
        
        // Create a material with multiple textures
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            map: this.textures.grass,
            normalMap: this.textures.grass,
            normalScale: new THREE.Vector2(1, 1),
            roughness: 0.8,
            metalness: 0.2,
            wireframe: false,
            flatShading: true,
            color: 0x3a7e4f,
            emissive: 0x2d5a27,
            emissiveIntensity: 0.2
        });
        
        // Add more natural terrain variation for larger world
        const vertices = groundGeometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            if (i !== 0) {
                const x = vertices[i];
                const z = vertices[i + 2];
                // Create more interesting terrain using multiple sine waves
                vertices[i + 1] = 
                    Math.sin(x * 0.05) * 1.0 + 
                    Math.cos(z * 0.05) * 1.0 +
                    Math.sin((x + z) * 0.025) * 0.6;
            }
        }
        
        // Update normals for better lighting
        groundGeometry.computeVertexNormals();
        
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);

        // Add healing aura effect to ground
        const auraGeometry = new THREE.PlaneGeometry(200, 200);
        const auraMaterial = new THREE.MeshStandardMaterial({
            color: 0x2ecc71,
            transparent: true,
            opacity: 0.1,
            emissive: 0x27ae60,
            emissiveIntensity: 0.2,
            side: THREE.DoubleSide
        });
        this.groundAura = new THREE.Mesh(auraGeometry, auraMaterial);
        this.groundAura.rotation.x = -Math.PI / 2;
        this.groundAura.position.y = 0.01; // Slightly above ground
        this.scene.add(this.groundAura);
    }

    addFlowers() {
        // Create more flowers for larger world
        for (let i = 0; i < 100; i++) {
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
            
            // Petals with texture
            const petals = new THREE.Group();
            for (let j = 0; j < 6; j++) {
                const petal = new THREE.Mesh(
                    new THREE.SphereGeometry(0.1, 12, 12),
                    new THREE.MeshStandardMaterial({ 
                        map: this.textures.flower,
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
            
            // Random position on larger ground
            const x = Math.random() * 160 - 80;
            const z = Math.random() * 160 - 80;
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
            
            // Check if player is near flower
            const distance = this.player.position.distanceTo(flower.position);
            if (distance < 1) {
                // Collect flower
                this.heal(5);
                this.increaseEnergy(5);
                this.addExperience(10);
                
                // Play collect sound
                if (this.sounds) {
                    this.sounds.play('collect');
                }
                
                // Remove flower
                this.scene.remove(flower);
                this.flowers = this.flowers.filter(f => f !== flower);
                
                // Update quest progress
                if (this.quests) {
                    this.quests.updateQuestProgress('collect_flowers');
                }
            }
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
        
        // Create more healing zones for larger world
        for (let i = 0; i < 10; i++) {
            const zoneGeometry = new THREE.CylinderGeometry(2, 2, 0.1, 32);
            const zoneMaterial = new THREE.MeshStandardMaterial({
                map: this.textures.healing,
                color: 0x00ff00,
                transparent: true,
                opacity: 0.3,
                emissive: 0x00ff00,
                emissiveIntensity: 0.5
            });
            
            const zone = new THREE.Mesh(zoneGeometry, zoneMaterial);
            zone.position.set(
                Math.random() * 160 - 80,
                0.05,
                Math.random() * 160 - 80
            );
            
            this.healingZones.push(zone);
            this.scene.add(zone);
            
            // Add spiritual healing particles
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
        
        // Create more NPCs for larger world
        for (let i = 0; i < 10; i++) {
            const npc = new THREE.Group();
            
            // NPC body
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
            
            // Position NPC in larger world
            npc.position.set(
                Math.random() * 160 - 80,
                0,
                Math.random() * 160 - 80
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
                this.healingProgress += 0.005;
                this.addExperience(0.05);
                
                // Update UI
                document.querySelector('#progress-fill').style.width = 
                    (this.healingProgress * 100) + '%';
                
                // Visual feedback
                zone.material.emissiveIntensity = 0.8;
            } else {
                zone.material.emissiveIntensity = 0.5;
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
            npc.position.x = THREE.MathUtils.clamp(npc.position.x, -80, 80);
            npc.position.z = THREE.MathUtils.clamp(npc.position.z, -80, 80);
            
            // Make NPCs face their movement direction
            npc.rotation.y = Math.atan2(
                Math.cos(time + npc.position.x),
                Math.sin(time + npc.position.z)
            );
        });
    }

    heal(amount) {
        const healingEffect = amount * (1 + this.skills.getSkillEffect('Healing')?.healingMultiplier || 1);
        this.health = Math.min(100, this.health + healingEffect);
        document.querySelector('#health-fill').style.width = this.health + '%';
        
        // Show healing effect
        if (this.effects) {
            this.effects.showHealingEffect(this.player.position);
        }
        
        // Play healing sound
        if (this.sounds) {
            this.sounds.play('heal');
        }
        
        // Add experience for healing
        this.addExperience(amount * 0.1);
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
            -cameraDirection.z,
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
        
        // Keep player within larger bounds
        this.player.position.x = THREE.MathUtils.clamp(this.player.position.x, -80, 80);
        this.player.position.z = THREE.MathUtils.clamp(this.player.position.z, -80, 80);

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
        
        // Create more meditation spots for larger world
        for (let i = 0; i < 6; i++) {
            const spot = new THREE.Group();
            
            // Create a sacred meditation platform
            const platform = new THREE.Mesh(
                new THREE.CylinderGeometry(3, 3, 0.2, 32),
                new THREE.MeshStandardMaterial({ 
                    map: this.textures.meditation,
                    color: 0xe6ccff,
                    transparent: true,
                    opacity: 0.6,
                    emissive: 0x9966ff,
                    emissiveIntensity: 0.2
                })
            );
            
            // Add sacred crystals with spiritual effects
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
            
            // Add spiritual energy particles
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
            
            // Random position on larger ground
            spot.position.set(
                Math.random() * 120 - 60,
                0.1,
                Math.random() * 120 - 60
            );
            
            this.meditationSpots.push(spot);
            this.scene.add(spot);
        }
    }

    updateMeditationSpots() {
        const playerPos = this.player.position.clone();
        playerPos.y = 0;
        
        this.meditationSpots.forEach(spot => {
            // Update sacred crystals
            spot.children.forEach((child, index) => {
                if (index > 0 && index <= 8) { // Crystals
                    child.position.y = Math.sin(Date.now() * 0.001 + index) * 0.5 + 1;
                    child.rotation.y += 0.01;
                }
            });
            
            // Update spiritual energy particles
            if (spot.particles) {
                spot.particles.rotation.y += 0.01;
                spot.particles.children.forEach(particle => {
                    particle.position.y = Math.sin(Date.now() * 0.003 + particle.position.x) * 0.5 + 1;
                });
            }
            
            // Check if player is in sacred meditation spot
            const distance = playerPos.distanceTo(spot.position);
            if (distance < 3) {
                this.isMeditating = true;
                this.meditationTime += 0.01;
                this.heal(0.1);
                this.increaseEnergy(0.2);
                this.healingProgress += 0.01;
                this.addExperience(0.1);
                
                // Update UI
                const progressFill = document.querySelector('#progress-fill');
                if (progressFill) {
                    progressFill.style.width = (this.healingProgress * 100) + '%';
                }
                
                // Visual feedback
                spot.children[0].material.emissiveIntensity = 0.4;
            } else {
                this.isMeditating = false;
                spot.children[0].material.emissiveIntensity = 0.2;
            }
        });
    }

    increaseEnergy(amount) {
        const energyEffect = amount * (1 + this.skills.getSkillEffect('Energy')?.energyMultiplier || 1);
        this.energy = Math.min(100, this.energy + energyEffect);
        document.querySelector('#energy-fill').style.width = this.energy + '%';
        
        // Show energy effect
        if (this.effects) {
            this.effects.showEnergyEffect(this.player.position);
        }
        
        // Play energy sound
        if (this.sounds) {
            this.sounds.play('energy');
        }
    }

    addExperience(amount) {
        const experienceEffect = amount * (1 + this.skills.getSkillEffect('Universal Flow')?.experienceMultiplier || 1);
        this.experience += experienceEffect;
        
        // Level up check
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
        
        // Heal and restore energy on level up
        this.heal(50);
        this.increaseEnergy(50);
        
        // Add skill point
        this.skills.skillPoints++;
        
        // Update level display
        document.getElementById('level-display').textContent = `Level ${this.level}`;
        
        // Show level up effect
        if (this.effects) {
            this.effects.showLevelUpEffect(this.player.position);
        }
        
        // Play level up sound
        if (this.sounds) {
            this.sounds.play('levelUp');
        }
        
        // Show level up text
        const levelUpText = document.getElementById('level-up');
        levelUpText.style.opacity = '1';
        setTimeout(() => {
            levelUpText.style.opacity = '0';
        }, 2000);
    }

    animate() {
        // Only proceed with animation if game is initialized
        if (!this.isInitialized) {
            console.log('Game not yet initialized, skipping animation frame');
            return;
        }

        requestAnimationFrame(() => this.animate());
        
        try {
            // Update game state with proper checks
            if (typeof this.movePlayer === 'function') {
                this.movePlayer();
            }
            
            if (typeof this.updateCamera === 'function') {
                this.updateCamera();
            }
            
            if (typeof this.updateHealingZones === 'function') {
                this.updateHealingZones();
            }
            
            if (typeof this.updateMeditationSpots === 'function') {
                this.updateMeditationSpots();
            }
            
            if (typeof this.updateFlowers === 'function') {
                this.updateFlowers();
            }
            
            if (typeof this.updateNPCs === 'function') {
                this.updateNPCs();
            }
            
            // Update ground aura effect
            if (this.groundAura) {
                const time = Date.now() * 0.001;
                this.groundAura.material.opacity = 0.1 + Math.sin(time) * 0.05;
                this.groundAura.material.emissiveIntensity = 0.2 + Math.sin(time) * 0.1;
            }
            
            // Update all game systems with proper checks
            if (this.weather && typeof this.weather.update === 'function') {
                this.weather.update();
            }
            
            if (this.dayNightCycle && typeof this.dayNightCycle.update === 'function') {
                this.dayNightCycle.update();
            }
            
            if (this.effects && typeof this.effects.update === 'function') {
                this.effects.update();
            }
            
            if (this.animations && typeof this.animations.update === 'function') {
                this.animations.update();
            }
            
            if (this.collisions && typeof this.collisions.update === 'function') {
                this.collisions.update();
            }
            
            if (this.pathfinding && typeof this.pathfinding.update === 'function') {
                this.pathfinding.update();
            }
            
            if (this.terrain && typeof this.terrain.update === 'function') {
                this.terrain.update();
            }
            
            if (this.vegetation && typeof this.vegetation.update === 'function') {
                this.vegetation.update();
            }
            
            if (this.grass && typeof this.grass.update === 'function') {
                this.grass.update();
            }
            
            // Energy management with proper checks
            if (!this.isMeditating) {
                this.energy = Math.max(0, this.energy - 0.01);
                const energyFill = document.querySelector('#energy-fill');
                if (energyFill) {
                    energyFill.style.width = this.energy + '%';
                }
            }
            
            // Render scene with proper checks
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            } else {
                console.warn('Renderer, scene, or camera not properly initialized');
            }
        } catch (error) {
            console.error('Error in animation loop:', error);
            // Optionally stop the animation loop if there's a critical error
            // this.isInitialized = false;
        }
    }
}

// Export all systems at the end
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
    VegetationSystem,
    GrassSystem,
    Game
}; 
