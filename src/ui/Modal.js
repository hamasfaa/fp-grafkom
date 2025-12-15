export class Modal {
    constructor() {
        this.modal = document.getElementById('province-modal');
        this.nameElement = document.getElementById('modal-province-name');
        this.contentElement = document.getElementById('modal-content');
        this.provinceData = null;
        this.onCloseCallback = null;

        this.loadProvinceData();
        this.setupEventListeners();
    }

    async loadProvinceData() {
        try {
            const response = await fetch('./src/data/provinceData.json');
            const data = await response.json();
            this.provinceData = data.provinces;
            console.log('Province data loaded:', this.provinceData.length, 'provinces');
        } catch (error) {
            console.error('Error loading province data:', error);
        }
    }

    setupEventListeners() {
        document.getElementById('close-modal').addEventListener('click', () => {
            this.close();
        });
    }

    show(provinceName, provinceId, onCloseCallback = null) {
        this.nameElement.textContent = provinceName;
        this.onCloseCallback = onCloseCallback;

        let provinceInfo = null;
        if (this.provinceData) {
            if (provinceId !== undefined) {
                provinceInfo = this.provinceData.find(p => p.id === provinceId);
            }
            if (!provinceInfo) {
                provinceInfo = this.provinceData.find(p => p.name === provinceName);
            }
        }

        if (provinceInfo) {
            this.contentElement.innerHTML = `
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-slate-700/50 p-4 rounded-lg">
                        <div class="text-gray-400 text-sm mb-1">Population</div>
                        <div class="text-2xl font-bold">${provinceInfo.population}</div>
                    </div>
                    <div class="bg-slate-700/50 p-4 rounded-lg">
                        <div class="text-gray-400 text-sm mb-1">Area</div>
                        <div class="text-2xl font-bold">${provinceInfo.area}</div>
                    </div>
                    <div class="bg-slate-700/50 p-4 rounded-lg">
                        <div class="text-gray-400 text-sm mb-1">Capital</div>
                        <div class="text-xl font-bold">${provinceInfo.capital}</div>
                    </div>
                    <div class="bg-slate-700/50 p-4 rounded-lg">
                        <div class="text-gray-400 text-sm mb-1">GDP</div>
                        <div class="text-xl font-bold">${provinceInfo.gdp}</div>
                    </div>
                </div>
                <div class="mt-4 bg-slate-700/50 p-4 rounded-lg">
                    <h4 class="font-semibold mb-2">About ${provinceName}</h4>
                    <p class="text-gray-300 text-sm leading-relaxed">
                        ${provinceInfo.description}
                    </p>
                </div>
            `;
        } else {
            this.contentElement.innerHTML = `
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-slate-700/50 p-4 rounded-lg">
                        <div class="text-gray-400 text-sm mb-1">Population</div>
                        <div class="text-2xl font-bold">Loading...</div>
                    </div>
                    <div class="bg-slate-700/50 p-4 rounded-lg">
                        <div class="text-gray-400 text-sm mb-1">Area</div>
                        <div class="text-2xl font-bold">Loading...</div>
                    </div>
                    <div class="bg-slate-700/50 p-4 rounded-lg">
                        <div class="text-gray-400 text-sm mb-1">Capital</div>
                        <div class="text-xl font-bold">Loading...</div>
                    </div>
                    <div class="bg-slate-700/50 p-4 rounded-lg">
                        <div class="text-gray-400 text-sm mb-1">GDP</div>
                        <div class="text-xl font-bold">Loading...</div>
                    </div>
                </div>
                <div class="mt-4 bg-slate-700/50 p-4 rounded-lg">
                    <h4 class="font-semibold mb-2">About ${provinceName}</h4>
                    <p class="text-gray-300 text-sm leading-relaxed">
                        Loading province information...
                    </p>
                </div>
            `;
        }

        this.modal.classList.remove('hidden');
        this.modal.classList.add('flex');
    }

    close() {
        this.modal.classList.add('hidden');
        this.modal.classList.remove('flex');

        if (this.onCloseCallback) {
            this.onCloseCallback();
            this.onCloseCallback = null;
        }
    }
}