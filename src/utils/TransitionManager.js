import * as THREE from 'three';

export class TransitionManager {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.isTransitioning = false;

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

    createProvinceWorld(provinceName) {
        if (this.provinceWorld) {
            this.clearProvinceWorld();
        }

        this.provinceWorld = new THREE.Group();

        const cubeCount = 20;
        const colors = [0x3b82f6, 0x9333ea, 0xec4899, 0xf59e0b, 0x10b981, 0xef4444];

        for (let i = 0; i < cubeCount; i++) {
            const size = Math.random() * 2 + 0.5;
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

            this.provinceWorld.add(cube);
        }

        const platformGeometry = new THREE.CylinderGeometry(10, 10, 0.5, 32);
        const platformMaterial = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            roughness: 0.8,
            metalness: 0.2,
        });
        const platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.y = -0.5;
        this.provinceWorld.add(platform);

        this.createProvinceText(provinceName);

        this.createParticles();

        this.scene.add(this.provinceWorld);
    }

    createProvinceText(text) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 1024;
        canvas.height = 256;

        context.fillStyle = 'rgba(59, 130, 246, 0.8)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.font = 'Bold 80px Arial';
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
        textMesh.position.y = 5;
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
            positions[i3] = (Math.random() - 0.5) * 20;
            positions[i3 + 1] = Math.random() * 10;
            positions[i3 + 2] = (Math.random() - 0.5) * 20;

            const color = new THREE.Color();
            color.setHSL(Math.random(), 1.0, 0.7);
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
        });

        const particles = new THREE.Points(geometry, material);
        particles.userData.isParticles = true;
        this.provinceWorld.add(particles);
    }

    animateProvinceWorld() {
        if (!this.provinceWorld) return;

        const time = Date.now() * 0.001;

        this.provinceWorld.children.forEach((child) => {
            if (child.geometry instanceof THREE.BoxGeometry) {
                child.rotation.x += child.userData.rotationSpeed.x;
                child.rotation.y += child.userData.rotationSpeed.y;
                child.rotation.z += child.userData.rotationSpeed.z;

                child.position.y += Math.sin(time + child.userData.floatOffset) * child.userData.floatSpeed;
            }

            if (child.userData.isText) {
                child.lookAt(this.camera.position);
                child.position.y = 5 + Math.sin(time) * 0.5;
            }

            if (child.userData.isParticles) {
                child.rotation.y = time * 0.1;
            }
        });
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
        }
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