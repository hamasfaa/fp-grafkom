import * as THREE from 'three';
import { ModelManager } from './ModelManager';

export class TransitionManager {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.isTransitioning = false;
        this.provinceWorld = null;
        this.platformModels = []; // Store platform models for collision
        this.modelManager = new ModelManager();

        this.createPortalEffect();
    }

    createPortalEffect() {
        this.portalGeometry = new THREE.RingGeometry(0.5, 5, 64);

        this.portalMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                progress: { value: 0 },
                color1: { value: new THREE.Color(0x3b82f6) },
                color2: { value: new THREE.Color(0x9333ea) },
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float progress;
                uniform vec3 color1;
                uniform vec3 color2;
                varying vec2 vUv;
                
                void main() {
                    vec2 center = vec2(0.5, 0.5);
                    float dist = distance(vUv, center);
                    
                    float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
                    float spiral = sin(dist * 10.0 - time * 2.0 + angle * 3.0);
                    
                    vec3 color = mix(color1, color2, spiral * 0.5 + 0.5);
                    
                    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
                    alpha *= progress;
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
        });

        this.portalMesh = new THREE.Mesh(this.portalGeometry, this.portalMaterial);
        this.portalMesh.visible = false;
    }

    async createProvinceWorld(provinceName, provinceIndex) {
        if (this.provinceWorld) {
            this.clearProvinceWorld();
        }

        this.provinceWorld = new THREE.Group();
        this.platformModels = []; // Reset platform models
        this.showLoadingIndicator();

        try {
            // Load floating models (makanan, keris, reog dll yang melayang di sekitar)
            const floatingModels = await this.modelManager.loadFloatingModels(provinceIndex, 12);

            floatingModels.forEach((model, i) => {
                // Gunakan scale dari config
                let scale = model.userData.customScale || 0.8;
                model.scale.setScalar(scale);

                // Posisi melingkar di luar platform - 2 layer
                const layer = Math.floor(i / 6);
                const indexInLayer = i % 6;
                const radius = 11 + layer * 4;
                const angle = (indexInLayer / 6) * Math.PI * 2 + (layer * Math.PI / 6);
                const heightVariation = (i % 3) * 1.5;

                model.position.x = Math.cos(angle) * radius;
                model.position.y = 3 + heightVariation;
                model.position.z = Math.sin(angle) * radius;

                // Rotasi awal
                model.rotation.x = 0;
                model.rotation.y = angle + Math.PI;
                model.rotation.z = 0;

                model.userData.isFloating = true;
                model.userData.rotationSpeed = {
                    x: 0.003 + Math.random() * 0.002,
                    y: 0.006 + Math.random() * 0.004,
                    z: 0.002 + Math.random() * 0.003,
                };
                model.userData.floatSpeed = 0.8 + Math.random() * 0.4;
                model.userData.floatOffset = (i / floatingModels.length) * Math.PI * 2;
                model.userData.initialY = model.position.y;
                model.userData.floatAmplitude = 0.5;
                
                // Orbit data for revolving around center (flat circle, no up/down)
                model.userData.orbitRadius = radius;
                model.userData.orbitAngle = angle;
                model.userData.orbitHeight = model.position.y; // Keep constant height during orbit

                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;

                        if (child.material) {
                            child.material.needsUpdate = true;
                            if (child.material.emissive) {
                                child.material.emissive.setHex(0x111111);
                            }
                        }
                    }
                });

                this.provinceWorld.add(model);
            });

            // Load platform models (model utama di atas platform)
            const platformModels = await this.modelManager.loadPlatformModels(provinceIndex);

            platformModels.forEach((model, index) => {
                let scale = model.userData.customScale || 1.0;
                model.scale.setScalar(scale);
                model.userData.originalScale = scale; // Store for collision radius calculation

                if (model.userData.customPosition) {
                    model.position.set(
                        model.userData.customPosition.x,
                        model.userData.customPosition.y,
                        model.userData.customPosition.z
                    );
                } else {
                    model.position.set(0, 0.2, 0);
                }

                if (model.userData.customRotation) {
                    model.rotation.set(
                        model.userData.customRotation.x,
                        model.userData.customRotation.y,
                        model.userData.customRotation.z
                    );
                }

                // Semua model platform tidak berputar agar stabil
                model.userData.rotationSpeed = {
                    x: 0,
                    y: 0,
                    z: 0,
                };

                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;

                        if (child.material) {
                            child.material.needsUpdate = true;
                        }
                    }
                });

                this.provinceWorld.add(model);
                this.platformModels.push(model); // Store for collision detection
            });

            console.log(`Loaded ${floatingModels.length} floating + ${platformModels.length} platform models for ${provinceName}`);
            console.log(`Platform models for collision:`, this.platformModels.length);

        } catch (error) {
            console.error('Error loading province models:', error);
            this.createFallbackCubes();
        }

        // Platform utama - lingkaran besar
        const platformGeometry = new THREE.CylinderGeometry(12, 12.5, 0.4, 64);
        const platformMaterial = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            roughness: 0.8,
            metalness: 0.3,
        });
        const platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.y = -0.2;
        platform.receiveShadow = true;
        this.provinceWorld.add(platform);

        // Ring dekoratif di tepi platform
        const ringGeometry = new THREE.RingGeometry(11.8, 12.3, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x3b82f6,
            side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.01;
        this.provinceWorld.add(ring);

        this.createProvinceText(provinceName);

        this.createParticles();

        this.addModelLighting();

        this.scene.add(this.provinceWorld);
        this.hideLoadingIndicator();
    }

    createFallbackCubes() {
        const cubeCount = 15;
        const colors = [0x3b82f6, 0x9333ea, 0xec4899, 0xf59e0b, 0x10b981, 0xef4444];

        for (let i = 0; i < cubeCount; i++) {
            const size = Math.random() * 1.5 + 0.5;
            const geometry = new THREE.BoxGeometry(size, size, size);
            const color = colors[Math.floor(Math.random() * colors.length)];
            const material = new THREE.MeshStandardMaterial({
                color: color,
                roughness: 0.5,
                metalness: 0.3,
            });

            const cube = new THREE.Mesh(geometry, material);

            const radius = 8;
            const angle = (i / cubeCount) * Math.PI * 2;
            cube.position.x = Math.cos(angle) * radius + (Math.random() - 0.5) * 3;
            cube.position.y = Math.random() * 5 + 1;
            cube.position.z = Math.sin(angle) * radius + (Math.random() - 0.5) * 3;

            cube.rotation.x = Math.random() * Math.PI;
            cube.rotation.y = Math.random() * Math.PI;
            cube.rotation.z = Math.random() * Math.PI;

            cube.userData.rotationSpeed = {
                x: (Math.random() - 0.5) * 0.02,
                y: (Math.random() - 0.5) * 0.02,
                z: (Math.random() - 0.5) * 0.02,
            };
            cube.userData.floatSpeed = Math.random() * 0.02 + 0.01;
            cube.userData.floatOffset = Math.random() * Math.PI * 2;
            cube.userData.initialY = cube.position.y;
            cube.userData.floatAmplitude = 0.5;

            this.provinceWorld.add(cube);
        }
    }

    addModelLighting() {
        const colors = [0x3b82f6, 0x9333ea, 0xec4899, 0xf59e0b];

        for (let i = 0; i < 4; i++) {
            const light = new THREE.PointLight(colors[i], 0.5, 20);
            const angle = (i / 4) * Math.PI * 2;
            light.position.x = Math.cos(angle) * 10;
            light.position.y = 3;
            light.position.z = Math.sin(angle) * 10;
            this.provinceWorld.add(light);
        }
    }

    showLoadingIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'model-loading';
        indicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1000;
            background: rgba(0, 0, 0, 0.8);
            padding: 2rem;
            border-radius: 1rem;
            color: white;
            text-align: center;
        `;
        indicator.innerHTML = `
            <div style="font-size: 2rem; margin-bottom: 1rem;">📦</div>
            <div style="font-weight: 600; margin-bottom: 0.5rem;">Loading Models...</div>
            <div style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.7);">Please wait</div>
        `;
        document.body.appendChild(indicator);
    }

    hideLoadingIndicator() {
        const indicator = document.getElementById('model-loading');
        if (indicator) {
            indicator.remove();
        }
    }

    createProvinceText(text) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 1024;
        canvas.height = 256;

        // Background dengan gradient
        const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.9)');
        gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.9)');
        gradient.addColorStop(1, 'rgba(147, 51, 234, 0.9)');
        
        // Rounded rectangle
        const radius = 30;
        context.beginPath();
        context.roundRect(10, 10, canvas.width - 20, canvas.height - 20, radius);
        context.fillStyle = gradient;
        context.fill();

        // Text dengan shadow
        context.shadowColor = 'rgba(0, 0, 0, 0.5)';
        context.shadowBlur = 10;
        context.shadowOffsetX = 3;
        context.shadowOffsetY = 3;
        context.font = 'Bold 72px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, 512, 128);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
        });

        const geometry = new THREE.PlaneGeometry(8, 2);
        const textMesh = new THREE.Mesh(geometry, material);
        textMesh.position.y = 8;
        textMesh.userData.isText = true;

        this.provinceWorld.add(textMesh);
    }

    createParticles() {
        const particleCount = 100;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            // Distribusi partikel dalam bentuk silinder di sekitar platform
            const angle = Math.random() * Math.PI * 2;
            const radius = 6 + Math.random() * 10;
            
            positions[i3] = Math.cos(angle) * radius;
            positions[i3 + 1] = Math.random() * 10 + 0.5;
            positions[i3 + 2] = Math.sin(angle) * radius;

            // Warna gradasi biru-ungu
            const color = new THREE.Color();
            color.setHSL(0.6 + Math.random() * 0.2, 0.8, 0.6);
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.15,
            vertexColors: true,
            transparent: true,
            opacity: 0.7,
        });

        const particles = new THREE.Points(geometry, material);
        particles.userData.isParticles = true;
        this.provinceWorld.add(particles);
    }

    clearProvinceWorld() {
        if (this.provinceWorld) {
            this.provinceWorld.children.forEach((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            this.scene.remove(this.provinceWorld);
            this.provinceWorld = null;
            this.platformModels = []; // Clear platform models
        }
    }
    
    getPlatformModels() {
        return this.platformModels;
    }

    animateProvinceWorld() {
        if (!this.provinceWorld) return;

        const time = Date.now() * 0.001;

        this.provinceWorld.children.forEach((child) => {
            if (child.userData.isFloating && child.userData.rotationSpeed) {
                // Self rotation on all axes (xyz)
                child.rotation.x += child.userData.rotationSpeed.x;
                child.rotation.y += child.userData.rotationSpeed.y;
                child.rotation.z += child.userData.rotationSpeed.z;
                
                // Orbit around center (horizontal circle only, no vertical movement)
                if (child.userData.orbitRadius !== undefined && child.userData.orbitAngle !== undefined) {
                    const orbitSpeed = 0.15; // Rotation speed around center
                    child.userData.orbitAngle += orbitSpeed * 0.016; // Approximate delta time
                    
                    // Update X and Z for circular orbit
                    child.position.x = Math.cos(child.userData.orbitAngle) * child.userData.orbitRadius;
                    child.position.z = Math.sin(child.userData.orbitAngle) * child.userData.orbitRadius;
                    
                    // Keep Y at orbit height (no up/down during revolution)
                    child.position.y = child.userData.orbitHeight;
                }
            }

            if (child.userData.isPlatform && child.userData.rotationSpeed) {
                child.rotation.y += child.userData.rotationSpeed.y;
            }

            if (child.userData.isText) {
                child.lookAt(this.camera.position);
                child.position.y = 8 + Math.sin(time * 0.5) * 0.2;
            }

            if (child.userData.isParticles) {
                child.rotation.y = time * 0.02;
            }
        });
    }

    async startTransition(targetProvince, onComplete) {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        const targetPos = targetProvince.position.clone();
        this.portalMesh.position.copy(targetPos);
        this.portalMesh.position.y = 1;
        this.portalMesh.lookAt(this.camera.position);

        this.scene.add(this.portalMesh);
        this.portalMesh.visible = true;

        await this.animatePortalOpen();

        await this.animateZoomIn(targetPos);

        await this.animateScreenFlash();

        if (onComplete) onComplete();

        await this.animateFadeIn();

        await this.animatePortalClose();

        this.portalMesh.visible = false;
        this.scene.remove(this.portalMesh);
        this.isTransitioning = false;
    }

    async startReverseTransition(onComplete) {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        this.portalMesh.position.set(0, 3, 8);
        this.portalMesh.lookAt(this.camera.position);

        this.scene.add(this.portalMesh);
        this.portalMesh.visible = true;

        await this.animatePortalOpen();

        await this.animateZoomIn(new THREE.Vector3(0, 3, 8));

        await this.animateScreenFlash();

        if (onComplete) onComplete();

        await this.animateFadeIn();

        await this.animatePortalClose();

        this.portalMesh.visible = false;
        this.scene.remove(this.portalMesh);
        this.isTransitioning = false;
    }

    animatePortalOpen() {
        return new Promise((resolve) => {
            const duration = 1000;
            const startTime = Date.now();

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                const eased = 1 - Math.pow(1 - progress, 3);

                this.portalMaterial.uniforms.progress.value = eased;
                this.portalMaterial.uniforms.time.value = elapsed * 0.001;

                this.portalMesh.scale.setScalar(eased);

                this.portalMesh.rotation.z = eased * Math.PI * 2;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            animate();
        });
    }

    animateZoomIn(targetPos) {
        return new Promise((resolve) => {
            const duration = 1500;
            const startTime = Date.now();
            const startPosition = this.camera.position.clone();
            const endPosition = targetPos.clone().add(new THREE.Vector3(0, 2, 0));

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                const eased = progress * progress * progress;

                this.camera.position.lerpVectors(startPosition, endPosition, eased);
                this.camera.lookAt(targetPos);

                const scale = 1 + eased * 3;
                this.portalMesh.scale.setScalar(scale);
                this.portalMesh.rotation.z += 0.1 * (1 + eased * 2);

                this.portalMaterial.uniforms.time.value = elapsed * 0.001;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            animate();
        });
    }

    animateScreenFlash() {
        return new Promise((resolve) => {
            const flash = document.createElement('div');
            flash.style.cssText = `
                position: fixed;
                inset: 0;
                background: white;
                z-index: 9999;
                opacity: 0;
                transition: opacity 0.3s ease-in;
            `;
            document.body.appendChild(flash);

            setTimeout(() => {
                flash.style.opacity = '1';
            }, 10);

            setTimeout(() => {
                resolve();
                this.flashElement = flash;
            }, 300);
        });
    }

    animateFadeIn() {
        return new Promise((resolve) => {
            setTimeout(() => {
                if (this.flashElement) {
                    this.flashElement.style.transition = 'opacity 0.5s ease-out';
                    this.flashElement.style.opacity = '0';

                    setTimeout(() => {
                        this.flashElement.remove();
                        this.flashElement = null;
                        resolve();
                    }, 500);
                } else {
                    resolve();
                }
            }, 100);
        });
    }

    animatePortalClose() {
        return new Promise((resolve) => {
            const duration = 800;
            const startTime = Date.now();

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                const eased = 1 - progress;

                this.portalMaterial.uniforms.progress.value = eased;
                this.portalMesh.scale.setScalar(eased);
                this.portalMesh.rotation.z += 0.05;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            animate();
        });
    }

    createVortexTunnel() {
        const geometry = new THREE.CylinderGeometry(5, 0.1, 20, 32, 1, true);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                progress: { value: 0 },
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float progress;
                varying vec2 vUv;
                
                void main() {
                    float angle = vUv.x * 3.14159 * 2.0;
                    float spiral = sin(angle * 5.0 - vUv.y * 10.0 + time * 3.0);
                    
                    vec3 color1 = vec3(0.2, 0.5, 1.0);
                    vec3 color2 = vec3(0.6, 0.2, 1.0);
                    vec3 color = mix(color1, color2, spiral * 0.5 + 0.5);
                    
                    float alpha = (1.0 - vUv.y) * progress;
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            side: THREE.BackSide,
        });

        return new THREE.Mesh(geometry, material);
    }
}