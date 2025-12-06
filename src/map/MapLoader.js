import { GeoJsonConverter } from '../utils/geoJsonToThree.js';
import { COLORS } from '../config/constants.js';

export class MapLoader {
    constructor(provinceManager, labelManager) {
        this.provinceManager = provinceManager;
        this.labelManager = labelManager;
        this.geoConverter = new GeoJsonConverter();
        this.provinceCount = 0;

        this.provinceNames = [
            'Aceh',                    // 0
            'Sumatera Utara',          // 1
            'Sumatera Barat',          // 2
            'Riau',                    // 3
            'Jambi',                   // 4
            'Sumatera Selatan',        // 5
            'Bengkulu',                // 6
            'Lampung',                 // 7
            'Kepulauan Bangka Belitung', // 8
            'Kepulauan Riau',          // 9
            'DKI Jakarta',             // 10
            'Jawa Tengah',             // 12
            'DI Yogyakarta',           // 13
            'Banten',                  // 15
            'Bali',                    // 16
            'Nusa Tenggara Barat',     // 17
            'Nusa Tenggara Timur',     // 18
            'Kalimantan Barat',        // 19
            'Kalimantan Tengah',       // 20
            'Jawa Timur',              // 14
            'Kalimantan Selatan',      // 21
            'Kalimantan Timur',        // 22
            'Kalimantan Utara',        // 23
            'Sulawesi Utara',          // 24
            'Sulawesi Tengah',         // 25
            'Sulawesi Selatan',        // 26
            'Sulawesi Tenggara',       // 27
            'Gorontalo',               // 28
            'Sulawesi Barat',          // 29
            'Maluku',                  // 30
            'Maluku Utara',            // 31
            'Papua Barat',             // 32
            'Papua',                   // 33
            'Jawa Barat',              // 11
        ];
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
        let provinceName = feature.properties.Propinsi ||
            feature.properties.NAME_1 ||
            feature.properties.name ||
            feature.properties.PROV_NAME ||
            feature.properties.provinsi;

        if (!provinceName || provinceName.includes('Province')) {
            provinceName = this.provinceNames[index] || `Province ${index + 1}`;
        }

        console.log(`Index ${index}: ${provinceName}`);

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