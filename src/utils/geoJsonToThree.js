import * as THREE from 'three';

export class GeoJsonConverter {
    constructor() {
        this.scale = 0.15;
        this.centerLat = -2.5;
        this.centerLon = 118;
    }

    latLonToVector3(lat, lon, height = 0) {
        const x = (lon - this.centerLon) * this.scale;
        const z = (lat - this.centerLat) * this.scale;
        return new THREE.Vector3(x, height, z);
    }

    coordinatesToShape(coordinates) {
        const shape = new THREE.Shape();

        coordinates[0].forEach((coord, index) => {
            const [lon, lat] = coord;
            const x = (lon - this.centerLon) * this.scale;
            const y = (lat - this.centerLat) * this.scale;

            if (index === 0) {
                shape.moveTo(x, y);
            } else {
                shape.lineTo(x, y);
            }
        });

        return shape;
    }

    createProvinceMesh(feature, color, height = 0.3) {
        const geometry = feature.geometry;
        const meshes = [];

        if (geometry.type === 'Polygon') {
            const mesh = this.createPolygonMesh(geometry.coordinates, color, height);
            if (mesh) meshes.push(mesh);
        } else if (geometry.type === 'MultiPolygon') {
            geometry.coordinates.forEach(polygon => {
                const mesh = this.createPolygonMesh(polygon, color, height);
                if (mesh) meshes.push(mesh);
            });
        }

        return meshes;
    }

    createPolygonMesh(coordinates, color, height) {
        try {
            const shape = this.coordinatesToShape(coordinates);

            const extrudeSettings = {
                depth: height,
                bevelEnabled: true,
                bevelThickness: 0.05,
                bevelSize: 0.05,
                bevelSegments: 2
            };

            const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            const material = new THREE.MeshStandardMaterial({
                color: color,
                roughness: 0.7,
                metalness: 0.2,
                side: THREE.DoubleSide
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.rotation.x = -Math.PI / 2;

            return mesh;
        } catch (error) {
            console.error('Error creating polygon mesh:', error);
            return null;
        }
    }

    getPolygonCenter(geometry) {
        let sumLat = 0, sumLon = 0, count = 0;

        const processCoordinates = (coords) => {
            coords[0].forEach(coord => {
                sumLon += coord[0];
                sumLat += coord[1];
                count++;
            });
        };

        if (geometry.type === 'Polygon') {
            processCoordinates(geometry.coordinates);
        } else if (geometry.type === 'MultiPolygon') {
            geometry.coordinates.forEach(polygon => {
                processCoordinates(polygon);
            });
        }

        const avgLat = sumLat / count;
        const avgLon = sumLon / count;

        return this.latLonToVector3(avgLat, avgLon, 0);
    }
}