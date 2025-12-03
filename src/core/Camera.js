import * as THREE from 'three';
import { CAMERA_CONFIG } from '../config/constants.js';

export class CameraManager {
    constructor() {
        this.camera = new THREE.PerspectiveCamera(
            CAMERA_CONFIG.fov,
            window.innerWidth / window.innerHeight,
            CAMERA_CONFIG.near,
            CAMERA_CONFIG.far
        );

        this.camera.position.set(
            CAMERA_CONFIG.position.x,
            CAMERA_CONFIG.position.y,
            CAMERA_CONFIG.position.z
        );
        this.camera.lookAt(0, 0, 0);
    }

    getCamera() {
        return this.camera;
    }

    updateAspect() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }
}