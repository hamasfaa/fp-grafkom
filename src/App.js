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

export class App {
    constructor() {
        this.sceneManager = new SceneManager();
        this.cameraManager = new CameraManager();
        this.rendererManager = new RendererManager(document.getElementById('canvas-container'));

        new LightManager(this.sceneManager.getScene());

        this.provinceManager = new ProvinceManager(this.sceneManager.getScene());
        this.labelManager = new LabelManager(this.sceneManager.getScene());
        this.mapLoader = new MapLoader(this.provinceManager, this.labelManager);

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

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

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
            const totalProvinces = await this.mapLoader.loadGeoJson('./indonesia-prov.geojson');
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
        window.addEventListener('click', () => this.onClick());
        window.addEventListener('resize', () => this.onResize());
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.handleHover();
    }

    handleHover() {
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

    async onClick() {
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

            this.modal.show(hoveredProvince.userData.name);
        }
    }

    loadProvinceScene(province) {
        console.log(`Loading scene for: ${province.userData.name}`);

        this.provinceManager.getProvinces().forEach(p => {
            p.visible = false;
        });

        const colors = [0x0f172a, 0x1e1b4b, 0x1e3a8a, 0x581c87];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        this.sceneManager.getScene().background = new THREE.Color(randomColor);

        this.transitionManager.createProvinceWorld(province.userData.name);

        this.cameraManager.getCamera().position.set(0, 8, 12);
        this.controls.target.set(0, 3, 0);
    }

    zoomToProvince(province) {
        const targetPosition = province.position.clone();
        targetPosition.y = 0;

        const offset = new THREE.Vector3(0, 3, 4);
        const endPosition = targetPosition.clone().add(offset);

        animateCameraToPosition(
            this.cameraManager.getCamera(),
            this.controls,
            endPosition,
            targetPosition
        );
    }

    resetView() {
        this.transitionManager.clearProvinceWorld();

        this.provinceManager.getProvinces().forEach(p => {
            p.visible = true;
        });

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

        this.sceneManager.getScene().background = null;
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

        const camera = this.cameraManager.getCamera();
        const distance = camera.position.distanceTo(this.controls.target);

        this.infoPanel.updateStatistics(
            this.mapLoader.provinceCount,
            this.provinceManager.getProvinces().length,
            this.provinceManager.getSelected()?.userData.name || null,
            distance.toFixed(1)
        );

        this.transitionManager.animateProvinceWorld();

        this.controls.update();
        this.rendererManager.render(
            this.sceneManager.getScene(),
            camera
        );
    }
}