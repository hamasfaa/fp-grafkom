import { GeoJsonConverter } from '../utils/geoJsonToThree.js';
import { COLORS } from '../config/constants.js';

export class MapLoader {
    constructor(provinceManager, labelManager) {
        this.provinceManager = provinceManager;
        this.labelManager = labelManager;
        this.geoConverter = new GeoJsonConverter();
        this.provinceCount = 0;
    }

    async loadGeoJson(url) {
        try {
            const response = await fetch(url);
            const geoJsonData = await response.json();

            console.log('Loaded GeoJSON:', geoJsonData);

            geoJsonData.features.forEach((feature, index) => {
                this.processFeature(feature, index);
            });

            return this.provinceCount;
        } catch (error) {
            console.error('Error loading GeoJSON:', error);
            throw error;
        }
    }

    processFeature(feature, index) {
        const provinceName = feature.properties.Propinsi ||
            feature.properties.NAME_1 ||
            feature.properties.name ||
            `Province ${index + 1}`;

        const color = COLORS[index % COLORS.length];
        const meshes = this.geoConverter.createProvinceMesh(feature, color, 0.3);

        meshes.forEach(mesh => {
            mesh.userData = {
                name: provinceName,
                originalColor: color,
                isProvince: true,
                properties: feature.properties,
                provinceIndex: index
            };

            this.provinceManager.addProvince(mesh);
            this.provinceManager.addBorder(mesh);
        });

        this.provinceCount++;

        /*
        if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
            const center = this.geoConverter.getPolygonCenter(feature.geometry);
            this.labelManager.createLabel(provinceName, center.x, 0.8, center.z);
        }
        */
    }
}