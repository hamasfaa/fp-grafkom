export class Modal {
    constructor() {
        this.modal = document.getElementById('province-modal');
        this.nameElement = document.getElementById('modal-province-name');
        this.contentElement = document.getElementById('modal-content');

        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('close-modal').addEventListener('click', () => {
            this.close();
        });
    }

    show(provinceName) {
        this.nameElement.textContent = provinceName;
        this.contentElement.innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-slate-700/50 p-4 rounded-lg">
                    <div class="text-gray-400 text-sm mb-1">Population</div>
                    <div class="text-2xl font-bold">~5,000,000</div>
                </div>
                <div class="bg-slate-700/50 p-4 rounded-lg">
                    <div class="text-gray-400 text-sm mb-1">Area</div>
                    <div class="text-2xl font-bold">10,000 km²</div>
                </div>
                <div class="bg-slate-700/50 p-4 rounded-lg">
                    <div class="text-gray-400 text-sm mb-1">Capital</div>
                    <div class="text-xl font-bold">Capital City</div>
                </div>
                <div class="bg-slate-700/50 p-4 rounded-lg">
                    <div class="text-gray-400 text-sm mb-1">GDP</div>
                    <div class="text-xl font-bold">$XX Billion</div>
                </div>
            </div>
            <div class="mt-4 bg-slate-700/50 p-4 rounded-lg">
                <h4 class="font-semibold mb-2">About ${provinceName}</h4>
                <p class="text-gray-300 text-sm leading-relaxed">
                    This is a placeholder description for ${provinceName}. Add detailed information about the province's history, culture, and notable features here.
                </p>
            </div>
        `;

        this.modal.classList.remove('hidden');
        this.modal.classList.add('flex');
    }

    close() {
        this.modal.classList.add('hidden');
        this.modal.classList.remove('flex');
    }
}