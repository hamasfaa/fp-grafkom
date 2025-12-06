import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class ModelManager {
    constructor() {
        this.loader = new GLTFLoader();
        this.loadedModels = new Map();

        this.floatingModels = {
            // Jawa Timur - 19
            19: [
                {
                    path: './assets/models/jatim/soto.glb',
                    scale: 1.2,
                    name: 'Soto Lamongan'
                },
                {
                    path: './assets/models/jatim/keris.glb',
                    scale: 0.8,
                    name: 'Keris Jawa Timur'
                },
                {
                    path: './assets/models/jatim/reog_ponorogo.glb',
                    scale: 2.5,
                    name: 'Reog Ponorogo'
                },
            ],
        };

        this.platformModels = {
            // Jawa Timur - 19
            19: [
                {
                    path: './assets/models/jatim/suroboyo.glb',
                    scale: 0.35,
                    position: { x: 0, y: 0.1, z: 1.5 },
                    rotation: { x: 0, y: 0, z: 0 },
                    name: 'Tugu Suroboyo'
                },
                {
                    path: './assets/models/jatim/tugu.glb',
                    scale: 7.0,
                    position: { x: 0, y: 0.1, z: -6 },
                    rotation: { x: 0, y: 0, z: 0 },
                    name: 'Tugu Pahlawan'
                },
                {
                    path: './assets/models/jatim/suramadu.glb',
                    scale: 0.2,
                    position: { x: -6, y: 0.1, z: 2 },
                    rotation: { x: 0, y: Math.PI / 2.5, z: 0 },
                    name: 'Jembatan Suramadu'
                },
                {
                    path: './assets/models/jatim/jawa_timur_park_1.glb',
                    scale: 3.5,
                    position: { x: 6, y: 0.4, z: 2 },
                    rotation: { x: 0, y: -Math.PI / 2.5, z: 0 },
                    name: 'Jawa Timur Park'
                },
            ],
        };

        this.fallbackModels = [
            './assets/models/default/cube.glb',
            './assets/models/default/sphere.glb',
            './assets/models/default/cylinder.glb',
        ];
    }

    async loadModel(pathOrConfig) {
        const path = typeof pathOrConfig === 'string' ? pathOrConfig : pathOrConfig.path;
        const customScale = typeof pathOrConfig === 'object' ? pathOrConfig.scale : null;
        const position = typeof pathOrConfig === 'object' ? pathOrConfig.position : null;
        const rotation = typeof pathOrConfig === 'object' ? pathOrConfig.rotation : null;
        const name = typeof pathOrConfig === 'object' ? pathOrConfig.name : null;

        if (this.loadedModels.has(path)) {
            const cloned = this.loadedModels.get(path).clone();
            if (customScale) cloned.userData.customScale = customScale;
            if (position) cloned.userData.customPosition = position;
            if (rotation) cloned.userData.customRotation = rotation;
            if (name) cloned.userData.modelName = name;
            return cloned;
        }

        return new Promise((resolve, reject) => {
            this.loader.load(
                path,
                (gltf) => {
                    this.loadedModels.set(path, gltf.scene);
                    const cloned = gltf.scene.clone();
                    if (customScale) cloned.userData.customScale = customScale;
                    if (position) cloned.userData.customPosition = position;
                    if (rotation) cloned.userData.customRotation = rotation;
                    if (name) cloned.userData.modelName = name;
                    resolve(cloned);
                },
                (progress) => {
                    const percent = (progress.loaded / progress.total) * 100;
                    console.log(`Loading ${path}: ${percent.toFixed(2)}%`);
                },
                (error) => {
                    console.error(`Error loading model ${path}:`, error);
                    reject(error);
                }
            );
        });
    }

    async loadFloatingModels(provinceIndex, count = 12) {
        const models = [];
        const modelConfigs = this.floatingModels[provinceIndex] || this.fallbackModels;

        console.log(`Loading ${count} floating models for province ${provinceIndex}`);

        for (let i = 0; i < count; i++) {
            try {
                const randomConfig = modelConfigs[Math.floor(Math.random() * modelConfigs.length)];
                const model = await this.loadModel(randomConfig);

                if (model) {
                    model.userData.isFloating = true;
                    models.push(model);
                }
            } catch (error) {
                console.warn(`Failed to load floating model, using fallback:`, error);
                const cube = this.createFallbackCube();
                cube.userData.isFloating = true;
                models.push(cube);
            }
        }

        return models;
    }

    async loadPlatformModels(provinceIndex) {
        const models = [];
        const modelConfigs = this.platformModels[provinceIndex];

        if (!modelConfigs || modelConfigs.length === 0) {
            console.log(`No platform models defined for province ${provinceIndex}`);
            return models;
        }

        console.log(`Loading ${modelConfigs.length} platform models for province ${provinceIndex}`);

        for (const config of modelConfigs) {
            try {
                const model = await this.loadModel(config);

                if (model) {
                    model.userData.isPlatform = true;
                    models.push(model);
                }
            } catch (error) {
                console.warn(`Failed to load platform model ${config.name}:`, error);
                const cube = this.createFallbackCube();
                cube.userData.isPlatform = true;
                if (config.position) cube.userData.customPosition = config.position;
                if (config.scale) cube.userData.customScale = config.scale;
                if (config.rotation) cube.userData.customRotation = config.rotation;
                models.push(cube);
            }
        }

        return models;
    }

    createFallbackCube() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({
            color: Math.random() * 0xffffff,
            roughness: 0.5,
            metalness: 0.3,
        });
        return new THREE.Mesh(geometry, material);
    }

    getAvailableProvinces() {
        const floatingProvinces = Object.keys(this.floatingModels).map(Number);
        const platformProvinces = Object.keys(this.platformModels).map(Number);
        return [...new Set([...floatingProvinces, ...platformProvinces])];
    }

    hasFloatingModels(provinceIndex) {
        return this.floatingModels.hasOwnProperty(provinceIndex);
    }

    hasPlatformModels(provinceIndex) {
        return this.platformModels.hasOwnProperty(provinceIndex);
    }

    clearCache() {
        this.loadedModels.forEach((model) => {
            if (model.geometry) model.geometry.dispose();
            if (model.material) {
                if (Array.isArray(model.material)) {
                    model.material.forEach(mat => mat.dispose());
                } else {
                    model.material.dispose();
                }
            }
        });
        this.loadedModels.clear();
    }
}