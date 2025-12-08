import { GeoJsonConverter } from '../utils/geoJsonToThree.js';
import { COLORS } from '../config/constants.js';

export class MapLoader {
    constructor(provinceManager, labelManager) {
        this.provinceManager = provinceManager;
        this.labelManager = labelManager;
        this.geoConverter = new GeoJsonConverter();
        this.provinceCount = 0;

        this.provinceNames = [
            'Sulawesi Tengah',      // 0
            'Sulawesi Barat',                 // 1
            'Sulawesi Selatan',         // 2
            'Papua Tengah',             // 3
            'Papua Batar',               // 4
            'Gorontalo',                    // 5
            'Riau',                // 6
            'Papua Selatan',              // 7
            'DI Yogyakarta',                    // 8
            'Sumatera Barat',          // 9
            'DKI Jakarta',               // 10
            'Maluku',                // 11
            'Bengkulu',                     // 12
            'Lampung',       // 13
            'Papua',                      // 14
            'Kepulauan Riau',                      // 15
            'Nusa Tenggara Barat',            // 16
            'Jambi',            // 17
            'Bali',           // 18
            'Jawa Timur',            // 19
            'Papua Barat Daya',               // 20
            'Sumatera Utara',            // 21
            'Sulawesi Tenggara', // 22
            'Nusa Tenggara Timur',            // 23
            'Kalimantan Selatan',          // 24
            'Aceh',                     // 25
            'Kalimantan Tengah',                   // 26
            'Papua Pegunungan',                  // 27
            'Bangka Belitung',                      // 28
            'Sumatera Selatan',          // 29
            'Banten',         // 30
            'Sulawesi Utara',        // 31
            'Kalimantan Utara',          // 32
            'Kalimantan Timur',          // 33
            'Jawa Tengah', // 34
            'Maluku Utara', // 35
            'Kalimantan Barat', // 36
            'Jawa Barat', // 37
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
        // Get province name from GeoJSON properties
        let rawName = feature.properties.Propinsi ||
            feature.properties.NAME_1 ||
            feature.properties.name ||
            feature.properties.PROV_NAME ||
            feature.properties.provinsi;

        // Always use our predefined name array for consistency
        const provinceName = this.provinceNames[index] || rawName || `Province ${index + 1}`;

        console.log(`Index ${index}: ${provinceName} (GeoJSON: ${rawName})`);

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