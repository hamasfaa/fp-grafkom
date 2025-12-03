export class InfoPanel {
    constructor() {
        this.nameElement = document.getElementById('province-name');
        this.detailElement = document.getElementById('province-detail');
    }

    showDefault() {
        this.nameElement.textContent = 'Indonesia Map';
        this.detailElement.innerHTML = `
            <p class="mb-2">👆 Hover over provinces to highlight</p>
            <p>🖱️ Click on a province to view details</p>
        `;
    }

    showProvince(provinceName) {
        this.nameElement.textContent = provinceName;
        this.detailElement.innerHTML = `
            <p class="text-gray-300">🏛️ <strong>Province:</strong> ${provinceName}</p>
            <p class="text-gray-400 text-xs mt-2">Click to view detailed information</p>
        `;
    }

    updateStatistics(totalProvinces, totalMeshes, selectedProvince, cameraDistance) {
        document.getElementById('total-provinces').textContent = totalProvinces;
        document.getElementById('total-meshes').textContent = totalMeshes;
        document.getElementById('selected-province').textContent = selectedProvince || 'None';
        document.getElementById('camera-distance').textContent = cameraDistance;
    }
}