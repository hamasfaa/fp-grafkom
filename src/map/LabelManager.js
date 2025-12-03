import * as THREE from 'three';

export class LabelManager {
    constructor(scene) {
        this.scene = scene;
        this.labels = [];
        this.visible = true;
    }

    createLabel(text, x, y, z) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;

        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.font = 'Bold 28px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, 256, 64);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });
        const sprite = new THREE.Sprite(material);

        sprite.position.set(x, y, z);
        sprite.scale.set(2, 0.5, 1);

        this.scene.add(sprite);
        this.labels.push(sprite);
        return sprite;
    }

    toggleVisibility() {
        this.visible = !this.visible;
        this.labels.forEach(label => {
            label.visible = this.visible;
        });
    }

    clearAll() {
        this.labels.forEach(label => {
            this.scene.remove(label);
        });
        this.labels = [];
    }
}