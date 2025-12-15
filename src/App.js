import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SceneManager } from './core/Scene.js';
import { CameraManager } from './core/Camera.js';
import { RendererManager } from './core/Render.js';
import { LightManager } from './core/Light.js';
import { ProvinceManager } from './map/ProvinceManager.js';
import { LabelManager } from './map/LabelManager.js';
import { MapLoader } from './map/MapLoader.js';
import { InfoPanel } from './ui/InfoPanel.js';
import { Modal } from './ui/Modal.js';
import { ControlsUI } from './ui/Controls.js';
import { animateCameraToPosition } from './utils/animations.js';
import { TransitionManager } from './utils/TransitionManager.js';
import { CAMERA_CONFIG } from './config/constants.js';
import { AudioManager } from './utils/AudioManager.js';
import { FirstPersonControls } from './core/FirstPersonControls.js';

export class App {
    constructor() {
        this.sceneManager = new SceneManager();
        this.cameraManager = new CameraManager();
        this.rendererManager = new RendererManager(document.getElementById('canvas-container'));

        new LightManager(this.sceneManager.getScene());

        this.provinceManager = new ProvinceManager(this.sceneManager.getScene());
        this.labelManager = new LabelManager(this.sceneManager.getScene());
        this.mapLoader = new MapLoader(this.provinceManager, this.labelManager);
        this.audioManager = new AudioManager();


        this.transitionManager = new TransitionManager(
            this.sceneManager.getScene(),
            this.cameraManager.getCamera(),
            this.rendererManager.getRenderer()
        );

        this.infoPanel = new InfoPanel();
        this.modal = new Modal();
        this.controlsUI = new ControlsUI(
            () => this.resetView(),
            () => this.toggleLabels()
        );

        this.controls = new OrbitControls(
            this.cameraManager.getCamera(),
            this.rendererManager.getRenderer().domElement
        );
        this.setupControls();

        // First person controls (will be activated in province mode)
        this.firstPersonControls = new FirstPersonControls(
            this.cameraManager.getCamera(),
            this.rendererManager.getRenderer().domElement
        );

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.isInProvinceMode = false;
        this.clock = new THREE.Clock();

        this.init();
    }

    setupControls() {
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = CAMERA_CONFIG.minDistance;
        this.controls.maxDistance = CAMERA_CONFIG.maxDistance;
        this.controls.maxPolarAngle = CAMERA_CONFIG.maxPolarAngle;
    }

    async init() {
        try {
            const totalProvinces = await this.mapLoader.loadGeoJson('./indonesia-new.json');
            const totalMeshes = this.provinceManager.getProvinces().length;

            console.log(`Loaded ${totalProvinces} provinces with ${totalMeshes} total meshes`);

            this.infoPanel.updateStatistics(totalProvinces, totalMeshes, null, '0.0');

            document.getElementById('loading').classList.add('opacity-0');
            setTimeout(() => {
                document.getElementById('loading').style.display = 'none';
            }, 500);

        } catch (error) {
            this.showError(error);
        }

        this.setupEventListeners();
        this.animate();
    }

    setupEventListeners() {
        window.addEventListener('mousemove', (event) => this.onMouseMove(event));
        window.addEventListener('click', (event) => this.onClick(event));
        window.addEventListener('resize', () => this.onResize());
    }

    onMouseMove(event) {
        if (this.isInProvinceMode) return;

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.handleHover();
    }

    handleHover() {
        if (this.isInProvinceMode) return;

        this.raycaster.setFromCamera(this.mouse, this.cameraManager.getCamera());
        const intersects = this.raycaster.intersectObjects(this.provinceManager.getProvinces());

        if (intersects.length > 0) {
            const province = intersects[0].object;
            this.provinceManager.setHovered(province);
            document.body.style.cursor = 'pointer';
            this.infoPanel.showProvince(province.userData.name);
        } else {
            this.provinceManager.setHovered(null);
            document.body.style.cursor = 'default';

            if (!this.provinceManager.getSelected()) {
                this.infoPanel.showDefault();
            }
        }
    }

    async onClick(event) {
        const backButton = document.getElementById('back-to-map');
        if (backButton && backButton.contains(event.target)) {
            return;
        }

        if (this.isInProvinceMode) return;

        const hoveredProvince = this.provinceManager.getHovered();

        if (hoveredProvince && !this.transitionManager.isTransitioning) {
            this.provinceManager.setSelected(hoveredProvince);

            this.controls.enabled = false;

            await this.transitionManager.startTransition(
                hoveredProvince,
                () => {
                    this.loadProvinceScene(hoveredProvince);
                }
            );

            this.controls.enabled = true;

            this.modal.show(
                hoveredProvince.userData.name,
                hoveredProvince.userData.provinceIndex,
                () => {
                    this.firstPersonControls.enable();
                }
            );
        }
    }

    loadProvinceScene(province) {
        console.log(`Loading scene for: ${province.userData.name}`);

        this.isInProvinceMode = true;

        this.provinceManager.getProvinces().forEach(p => {
            this.sceneManager.getScene().remove(p);
        });

        this.provinceManager.getBorders().forEach(border => {
            this.sceneManager.getScene().remove(border);
        });

        this.labelManager.labels.forEach(label => {
            this.sceneManager.getScene().remove(label);
        });

        const colors = [0x0f172a, 0x1e1b4b, 0x1e3a8a, 0x581c87];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        this.sceneManager.getScene().background = new THREE.Color(randomColor);

        const provinceIndex = province.userData.provinceIndex;
        this.transitionManager.createProvinceWorld(province.userData.name, provinceIndex);

        // Set platform models for collision detection after world is created
        setTimeout(() => {
            if (this.firstPersonControls) {
                const models = this.transitionManager.getPlatformModels();
                this.firstPersonControls.setModelObjects(models);
                console.log('Set', models.length, 'models for collision detection');
            }
        }, 100);

        if (provinceIndex !== undefined) {
            this.audioManager.playProvinceMusic(provinceIndex);
        }

        // Switch to first person controls
        this.controls.enabled = false;
        this.controls.enableRotate = false;
        this.controls.enableZoom = false;
        this.controls.enablePan = false;
        this.cameraManager.getCamera().position.set(0, 2, 10);
        this.cameraManager.getCamera().lookAt(0, 2, 0);

        const statsPanel = document.querySelector('.absolute.bottom-6.left-6');
        const controlsPanel = document.querySelector('.absolute.bottom-6.right-6');
        if (statsPanel) statsPanel.style.display = 'none';
        if (controlsPanel) controlsPanel.style.display = 'none';

        this.showBackButton();
        this.showControlsHint();


        this.infoPanel.showProvinceMode(province.userData.name);
    }

    showBackButton() {
        let backButton = document.getElementById('back-to-map');

        if (!backButton) {
            backButton = document.createElement('button');
            backButton.id = 'back-to-map';
            backButton.style.cssText = `
            position: fixed;
            top: 6rem;
            right: 1.5rem;
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            background: linear-gradient(to right, #2563eb, #9333ea);
            color: white;
            border-radius: 0.75rem;
            font-weight: 600;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            cursor: pointer;
            border: none;
            transition: all 0.3s;
        `;

            backButton.innerHTML = `
            <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            <span>Back to Map</span>
        `;

            backButton.onmouseenter = () => {
                backButton.style.background = 'linear-gradient(to right, #1d4ed8, #7e22ce)';
                backButton.style.transform = 'scale(1.05)';
            };
            backButton.onmouseleave = () => {
                backButton.style.background = 'linear-gradient(to right, #2563eb, #9333ea)';
                backButton.style.transform = 'scale(1)';
            };

            document.body.appendChild(backButton);

            backButton.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log('Back button clicked!');
                this.backToMap();
            });

            console.log('Back button created and added to body');
        } else {
            backButton.style.display = 'flex';
            console.log('Back button already exists, showing it');
        }

        setTimeout(() => {
            const btn = document.getElementById('back-to-map');
            if (btn) {
                console.log('Button found in DOM:', btn);
                console.log('Button visibility:', window.getComputedStyle(btn).display);
            } else {
                console.error('Button NOT found in DOM!');
            }
        }, 100);
    }

    showControlsHint() {
        let hint = document.getElementById('controls-hint');

        if (!hint) {
            hint = document.createElement('div');
            hint.id = 'controls-hint';
            hint.style.cssText = `
                position: fixed;
                bottom: 2rem;
                left: 50%;
                transform: translateX(-50%);
                z-index: 9999;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 1rem 2rem;
                border-radius: 0.75rem;
                font-weight: 500;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                animation: fadeIn 0.5s ease-in-out;
            `;

            hint.innerHTML = `
                <div style="display: flex; gap: 2rem; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <kbd style="background: rgba(255,255,255,0.1); padding: 0.25rem 0.5rem; border-radius: 0.25rem;">W A S D</kbd>
                        <span>Move</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <kbd style="background: rgba(255,255,255,0.1); padding: 0.25rem 0.5rem; border-radius: 0.25rem;">🖱️ Mouse</kbd>
                        <span>Look</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <kbd style="background: rgba(255,255,255,0.1); padding: 0.25rem 0.5rem; border-radius: 0.25rem;">Space 2x</kbd>
                        <span>Fly</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <kbd style="background: rgba(255,255,255,0.1); padding: 0.25rem 0.5rem; border-radius: 0.25rem;">Space</kbd>
                        <span>Up / Jump</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <kbd style="background: rgba(255,255,255,0.1); padding: 0.25rem 0.5rem; border-radius: 0.25rem;">Shift</kbd>
                        <span>Down / Run</span>
                    </div>
                </div>
            `;

            document.body.appendChild(hint);

            // Auto hide after 5 seconds
            setTimeout(() => {
                hint.style.opacity = '0';
                hint.style.transition = 'opacity 0.5s';
                setTimeout(() => hint.remove(), 500);
            }, 5000);
        }
    }

    hideBackButton() {
        const backButton = document.getElementById('back-to-map');
        if (backButton) {
            backButton.style.display = 'none';
            console.log('Back button hidden');
        }
    }

    async backToMap() {
        console.log('Back to map clicked');

        this.controls.enabled = false;

        await this.transitionManager.startReverseTransition(() => {
            this.exitProvinceScene();
        });

        this.controls.enabled = true;
    }

    exitProvinceScene() {
        console.log('Exiting province scene...');

        this.audioManager.stop();

        this.isInProvinceMode = false;

        // Re-enable orbit controls fully
        this.controls.enabled = true;
        this.controls.enableRotate = true;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;

        this.transitionManager.clearProvinceWorld();

        this.provinceManager.getProvinces().forEach(p => {
            this.sceneManager.getScene().add(p);
        });

        this.provinceManager.getBorders().forEach(border => {
            this.sceneManager.getScene().add(border);
        });

        this.labelManager.labels.forEach(label => {
            this.sceneManager.getScene().add(label);
        });

        this.sceneManager.getScene().background = null;

        const statsPanel = document.querySelector('.absolute.bottom-6.left-6');
        const controlsPanel = document.querySelector('.absolute.bottom-6.right-6');
        if (statsPanel) statsPanel.style.display = 'block';
        if (controlsPanel) controlsPanel.style.display = 'block';

        this.hideBackButton();

        // Disable first person controls (release pointer lock)
        this.firstPersonControls.disable();

        this.resetView();
    }

    resetView() {
        const endPosition = new THREE.Vector3(
            CAMERA_CONFIG.position.x,
            CAMERA_CONFIG.position.y,
            CAMERA_CONFIG.position.z
        );
        const endTarget = new THREE.Vector3(0, 0, 0);

        animateCameraToPosition(
            this.cameraManager.getCamera(),
            this.controls,
            endPosition,
            endTarget,
            0.03
        );

        this.provinceManager.setSelected(null);
        this.infoPanel.showDefault();
    }

    toggleLabels() {
        this.labelManager.toggleVisibility();
    }

    onResize() {
        this.cameraManager.updateAspect();
        this.rendererManager.resize();
    }

    showError(error) {
        document.getElementById('loading').innerHTML = `
            <div class="text-center">
                <div class="text-6xl mb-4">⚠️</div>
                <h2 class="text-3xl font-bold text-white mb-2">Error Loading Map</h2>
                <p class="text-gray-400 mb-4">${error.message}</p>
                <button onclick="location.reload()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold">
                    🔄 Retry
                </button>
            </div>
        `;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();

        if (!this.isInProvinceMode) {
            const camera = this.cameraManager.getCamera();
            const distance = camera.position.distanceTo(this.controls.target);

            this.infoPanel.updateStatistics(
                this.mapLoader.provinceCount,
                this.provinceManager.getProvinces().length,
                this.provinceManager.getSelected()?.userData.name || null,
                distance.toFixed(1)
            );

            this.controls.update();
        } else {
            // Update first person controls in province mode
            this.firstPersonControls.update(delta);
        }

        this.transitionManager.animateProvinceWorld();

        this.rendererManager.render(
            this.sceneManager.getScene(),
            this.cameraManager.getCamera()
        );
    }
}