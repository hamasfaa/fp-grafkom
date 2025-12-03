export class ControlsUI {
    constructor(onReset, onToggleLabels) {
        this.setupEventListeners(onReset, onToggleLabels);
    }

    setupEventListeners(onReset, onToggleLabels) {
        document.getElementById('reset-view').addEventListener('click', onReset);
        document.getElementById('toggle-labels').addEventListener('click', onToggleLabels);
    }
}