import * as THREE from 'three';

export class RendererManager {
    constructor(container) {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 0);
        container.appendChild(this.renderer.domElement);
    }

    getRenderer() {
        return this.renderer;
    }

    render(scene, camera) {
        this.renderer.render(scene, camera);
    }

    resize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}