import * as THREE from 'three';

export class ProvinceManager {
    constructor(scene) {
        this.scene = scene;
        this.provinces = [];
        this.borders = [];
        this.hoveredProvince = null;
        this.selectedProvince = null;
    }

    addProvince(mesh) {
        this.provinces.push(mesh);
        this.scene.add(mesh);
    }

    addBorder(mesh) {
        const edges = new THREE.EdgesGeometry(mesh.geometry);
        const line = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({
                color: 0x000000,
                linewidth: 1,
                opacity: 0.5,
                transparent: true
            })
        );
        line.position.copy(mesh.position);
        line.rotation.copy(mesh.rotation);

        this.borders.push(line);
        this.scene.add(line);
    }

    getProvinces() {
        return this.provinces;
    }

    getBorders() {
        return this.borders;
    }

    setHovered(province) {
        if (this.hoveredProvince && this.hoveredProvince !== this.selectedProvince) {
            this.hoveredProvince.material.color.setHex(this.hoveredProvince.userData.originalColor);
            this.hoveredProvince.material.emissive.setHex(0x000000);
        }

        this.hoveredProvince = province;

        if (province) {
            province.material.emissive.setHex(0x555555);
        }
    }

    setSelected(province) {
        this.selectedProvince = province;
    }

    getHovered() {
        return this.hoveredProvince;
    }

    getSelected() {
        return this.selectedProvince;
    }

    clearAll() {
        this.provinces.forEach(province => {
            this.scene.remove(province);
        });
        this.borders.forEach(border => {
            this.scene.remove(border);
        });
        this.provinces = [];
        this.borders = [];
    }
}