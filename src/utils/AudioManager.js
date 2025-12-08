export class AudioManager {
    constructor() {
        this.currentAudio = null;
        this.isPlaying = false;
        this.volume = 0.5;
        this.currentProvinceIndex = null;

        this.provincialMusic = [
            './assets/music/sulteng.mp3',        // 0 - Sulawesi Tengah
            './assets/music/sulbar.mp3',         // 1 - Sulawesi Barat
            './assets/music/sulsel.mp3',         // 2 - Sulawesi Selatan
            './assets/music/papua.mp3',          // 3 - Papua Tengah
            './assets/music/pabar.mp3',          // 4 - Papua Barat
            './assets/music/gorontalo.mp3',      // 5 - Gorontalo
            './assets/music/riau.mp3',           // 6 - Riau
            './assets/music/papua.mp3',          // 7 - Papua Selatan
            './assets/music/diy.mp3',            // 8 - DI Yogyakarta
            './assets/music/sumbar.mp3',         // 9 - Sumatera Barat
            './assets/music/dki.mp3',            // 10 - DKI Jakarta
            './assets/music/maluku.mp3',         // 11 - Maluku
            './assets/music/bengkulu.mp3',       // 12 - Bengkulu
            './assets/music/lampung.mp3',        // 13 - Lampung
            './assets/music/papua.mp3',          // 14 - Papua
            './assets/music/kepri.mp3',          // 15 - Kepulauan Riau
            './assets/music/ntb.mp3',            // 16 - Nusa Tenggara Barat
            './assets/music/jambi.mp3',          // 17 - Jambi
            './assets/music/bali.mp3',           // 18 - Bali
            './assets/music/jatim.mp3',          // 19 - Jawa Timur
            './assets/music/pabar.mp3',          // 20 - Papua Barat Daya
            './assets/music/sumut.mp3',          // 21 - Sumatera Utara
            './assets/music/sultra.mp3',         // 22 - Sulawesi Tenggara
            './assets/music/ntt.mp3',            // 23 - Nusa Tenggara Timur
            './assets/music/kalsel.mp3',         // 24 - Kalimantan Selatan
            './assets/music/aceh.mp3',           // 25 - Aceh
            './assets/music/kalteng.mp3',        // 26 - Kalimantan Tengah
            './assets/music/papua.mp3',          // 27 - Papua Pegunungan
            './assets/music/babel.mp3',          // 28 - Bangka Belitung
            './assets/music/sumsel.mp3',         // 29 - Sumatera Selatan
            './assets/music/banten.mp3',         // 30 - Banten
            './assets/music/sulut.mp3',          // 31 - Sulawesi Utara
            './assets/music/kaltara.mp3',        // 32 - Kalimantan Utara
            './assets/music/kaltim.mp3',         // 33 - Kalimantan Timur
            './assets/music/jateng.mp3',         // 34 - Jawa Tengah
            './assets/music/malut.mp3',          // 35 - Maluku Utara
            './assets/music/kalbar.mp3',         // 36 - Kalimantan Barat
            './assets/music/jabar.mp3',          // 37 - Jawa Barat
        ];

        this.fallbackMusic = './assets/music/default.mp3';

        this.createAudioControls();
        this.createMusicControlPanel();
    }

    createAudioControls() {
        this.audioElement = new Audio();
        this.audioElement.volume = this.volume;
        this.audioElement.loop = true;
        this.audioElement.preload = 'metadata';
    }

    createMusicControlPanel() {
        const panel = document.createElement('div');
        panel.id = 'music-control-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            z-index: 1000;
            background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(51, 65, 85, 0.95));
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 1rem;
            padding: 1.25rem;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
            min-width: 280px;
            display: none;
            animation: slideInUp 0.5s ease-out;
        `;

        panel.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                <div style="font-size: 2rem; animation: pulse 2s infinite;">🎵</div>
                <div style="flex: 1;">
                    <div id="music-title" style="color: white; font-weight: 600; font-size: 0.875rem; margin-bottom: 0.25rem;">
                        Traditional Music
                    </div>
                    <div id="music-province" style="color: rgba(255, 255, 255, 0.7); font-size: 0.75rem;">
                        Loading...
                    </div>
                </div>
            </div>

            <!-- Play/Pause Buttons -->
            <div style="display: flex; gap: 0.75rem; margin-bottom: 1rem;">
                <button id="music-play-btn" style="
                    flex: 1;
                    background: linear-gradient(135deg, #10b981, #059669);
                    border: none;
                    border-radius: 0.5rem;
                    padding: 0.75rem;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    transition: all 0.3s;
                    box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);
                ">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                    <span>Play</span>
                </button>

                <button id="music-pause-btn" style="
                    flex: 1;
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    border: none;
                    border-radius: 0.5rem;
                    padding: 0.75rem;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    transition: all 0.3s;
                    box-shadow: 0 4px 6px rgba(245, 158, 11, 0.3);
                ">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                    </svg>
                    <span>Pause</span>
                </button>
            </div>

            <!-- Volume Control -->
            <div style="margin-bottom: 0.75rem;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="color: rgba(255, 255, 255, 0.7); font-size: 0.75rem;">Volume</span>
                    <span id="volume-value" style="color: white; font-size: 0.75rem; font-weight: 600;">50%</span>
                </div>
                <input type="range" id="volume-slider" min="0" max="100" value="50" style="
                    width: 100%;
                    height: 6px;
                    border-radius: 3px;
                    background: linear-gradient(to right, #3b82f6 50%, rgba(255, 255, 255, 0.2) 50%);
                    outline: none;
                    -webkit-appearance: none;
                ">
            </div>

            <!-- Mute Button -->
            <button id="music-mute-btn" style="
                width: 100%;
                background: rgba(239, 68, 68, 0.2);
                border: 1px solid rgba(239, 68, 68, 0.5);
                border-radius: 0.5rem;
                padding: 0.5rem;
                color: #ef4444;
                font-size: 0.75rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
            ">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                </svg>
                <span id="mute-text">Mute</span>
            </button>
        `;

        document.body.appendChild(panel);

        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInUp {
                from {
                    transform: translateY(100%);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            #music-play-btn:hover, #music-pause-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
            }
            #music-mute-btn:hover {
                background: rgba(239, 68, 68, 0.3);
            }
            #volume-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: #3b82f6;
                cursor: pointer;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            }
            #volume-slider::-moz-range-thumb {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: #3b82f6;
                cursor: pointer;
                border: none;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            }
        `;
        document.head.appendChild(style);

        this.setupControlListeners();
    }

    setupControlListeners() {
        const playBtn = document.getElementById('music-play-btn');
        const pauseBtn = document.getElementById('music-pause-btn');
        const muteBtn = document.getElementById('music-mute-btn');
        const volumeSlider = document.getElementById('volume-slider');
        const volumeValue = document.getElementById('volume-value');

        // Play button
        playBtn.addEventListener('click', () => {
            this.resume();
            playBtn.style.display = 'none';
            pauseBtn.style.display = 'flex';
        });

        // Pause button
        pauseBtn.addEventListener('click', () => {
            this.pause();
            pauseBtn.style.display = 'none';
            playBtn.style.display = 'flex';
        });

        // Mute button
        muteBtn.addEventListener('click', () => {
            const isMuted = this.toggleMute();
            if (isMuted) {
                muteBtn.querySelector('#mute-text').textContent = 'Unmute';
                muteBtn.querySelector('svg').innerHTML = `
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                `;
            } else {
                muteBtn.querySelector('#mute-text').textContent = 'Mute';
                muteBtn.querySelector('svg').innerHTML = `
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                `;
            }
        });

        volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            this.setVolume(volume);
            volumeValue.textContent = `${e.target.value}%`;

            e.target.style.background = `linear-gradient(to right, #3b82f6 ${e.target.value}%, rgba(255, 255, 255, 0.2) ${e.target.value}%)`;
        });
    }

    playProvinceMusic(provinceIndex) {
        this.stop();

        this.currentProvinceIndex = provinceIndex;
        const musicPath = this.provincialMusic[provinceIndex] || this.fallbackMusic;
        const provinceName = this.getProvinceMusicInfo(provinceIndex);

        console.log(`Playing music for province index ${provinceIndex}: ${musicPath}`);

        document.getElementById('music-province').textContent = provinceName;
        document.getElementById('music-title').textContent = 'Traditional Music';

        const panel = document.getElementById('music-control-panel');
        panel.style.display = 'block';

        document.getElementById('music-play-btn').style.display = 'flex';
        document.getElementById('music-pause-btn').style.display = 'none';

        this.audioElement.src = musicPath;
        this.audioElement.volume = 0;
        this.audioElement.play()
            .then(() => {
                this.isPlaying = true;
                this.fadeIn();
                document.getElementById('music-play-btn').style.display = 'none';
                document.getElementById('music-pause-btn').style.display = 'flex';
            })
            .catch(error => {
                console.warn('Audio playback failed:', error);
                if (musicPath !== this.fallbackMusic) {
                    this.audioElement.src = this.fallbackMusic;
                    this.audioElement.play().catch(e => console.error('Fallback audio failed:', e));
                }
            });
    }

    fadeIn(duration = 1000) {
        const steps = 20;
        const stepDuration = duration / steps;
        const volumeStep = this.volume / steps;
        let currentStep = 0;

        const fadeInterval = setInterval(() => {
            if (currentStep >= steps) {
                clearInterval(fadeInterval);
                return;
            }
            this.audioElement.volume = Math.min(volumeStep * currentStep, this.volume);
            currentStep++;
        }, stepDuration);
    }

    fadeOut(duration = 1000) {
        return new Promise((resolve) => {
            const steps = 20;
            const stepDuration = duration / steps;
            const volumeStep = this.audioElement.volume / steps;
            let currentStep = 0;

            const fadeInterval = setInterval(() => {
                if (currentStep >= steps) {
                    clearInterval(fadeInterval);
                    this.audioElement.pause();
                    resolve();
                    return;
                }
                this.audioElement.volume = Math.max(this.audioElement.volume - volumeStep, 0);
                currentStep++;
            }, stepDuration);
        });
    }

    async stop() {
        if (this.isPlaying) {
            await this.fadeOut(500);
            this.isPlaying = false;
        }
        const panel = document.getElementById('music-control-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    }

    pause() {
        if (this.isPlaying) {
            this.audioElement.pause();
            this.isPlaying = false;
        }
    }

    resume() {
        if (!this.isPlaying) {
            this.audioElement.play();
            this.isPlaying = true;
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (!this.audioElement.muted) {
            this.audioElement.volume = this.volume;
        }
    }

    toggleMute() {
        this.audioElement.muted = !this.audioElement.muted;
        return this.audioElement.muted;
    }

    getProvinceMusicInfo(index) {
        const provinceNames = [
            'Sulawesi Tengah', 'Sulawesi Barat', 'Sulawesi Selatan', 'Papua Tengah', 'Papua Batar',
            'Gorontalo', 'Riau', 'Papua Selatan', 'DI Yogyakarta', 'Sumatera Barat',
            'DKI Jakarta', 'Maluku', 'Bengkulu', 'Lampung', 'Papua',
            'Kepulauan Riau', 'Nusa Tenggara Barat', 'Jambi', 'Bali', 'Jawa Timur',
            'Papua Barat Daya', 'Sumatera Utara', 'Sulawesi Tenggara', 'Nusa Tenggara Timur', 'Kalimantan Selatan',
            'Aceh', 'Kalimantan Tengah', 'Papua Pegunungan', 'Bangka Belitung', 'Sumatera Selatan',
            'Banten', 'Sulawesi Utara', 'Kalimantan Utara', 'Kalimantan Timur', 'Jawa Tengah',
            'Maluku Utara', 'Kalimantan Barat', 'Jawa Barat'
        ];
        return provinceNames[index] || 'Unknown Province';
    }
}