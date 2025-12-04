import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class ModelManager {
    constructor() {
        this.loader = new GLTFLoader();
        this.loadedModels = new Map();

        this.provinceModels = {
            // Jatim - 20
            19: [
                {
                    path: './assets/models/jatim/suramadu.glb',
                    scale: 0.1
                },
                {
                    path: './assets/models/jatim/suroboyo.glb',
                    scale: 0.1
                },
                {
                    path: './assets/models/jatim/soto.glb',
                    scale: 0.5
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

        if (this.loadedModels.has(path)) {
            const cloned = this.loadedModels.get(path).clone();
            if (customScale) {
                cloned.userData.customScale = customScale;
            }
            return cloned;
        }

        return new Promise((resolve, reject) => {
            this.loader.load(
                path,
                (gltf) => {
                    this.loadedModels.set(path, gltf.scene);
                    const cloned = gltf.scene.clone();
                    if (customScale) {
                        cloned.userData.customScale = customScale;
                    }
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

    async loadProvinceModels(provinceIndex, count = 15) {
        const models = [];

        const modelConfigs = this.provinceModels[provinceIndex] || this.fallbackModels;

        console.log(`Loading ${count} models for province ${provinceIndex}`);

        for (let i = 0; i < count; i++) {
            try {
                const randomConfig = modelConfigs[Math.floor(Math.random() * modelConfigs.length)];
                const model = await this.loadModel(randomConfig);

                if (model) {
                    models.push(model);
                }
            } catch (error) {
                console.warn(`Failed to load model, using fallback:`, error);
                const geometry = new THREE.BoxGeometry(1, 1, 1);
                const material = new THREE.MeshStandardMaterial({
                    color: Math.random() * 0xffffff,
                });
                const cube = new THREE.Mesh(geometry, material);
                models.push(cube);
            }
        }

        return models;
    }

    getAvailableProvinces() {
        return Object.keys(this.provinceModels).map(Number);
    }

    hasModels(provinceIndex) {
        return this.provinceModels.hasOwnProperty(provinceIndex);
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