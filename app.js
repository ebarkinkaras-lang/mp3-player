/* ============================================================
   FUTURISTIC MP3 PLAYER - APPLICATION LOGIC
   ============================================================ */

class FuturisticPlayer {
    constructor() {
        // Audio context & nodes
        this.audioContext = null;
        this.analyser = null;
        this.gainNode = null;
        this.sourceNode = null;
        this.eqFilters = [];

        // Audio element
        this.audio = new Audio();
        this.audio.crossOrigin = 'anonymous';

        // State
        this.isPlaying = false;
        this.isMuted = false;
        this.volume = 0.7;
        this.playlist = [];
        this.currentTrackIndex = -1;
        this.vizStyle = 'bars';
        this.glowIntensity = 0.7;
        this.autoPlayNext = true;
        this.shuffleMode = false;
        this.repeatMode = 'none';
        this.isAudioContextInitialized = false;
        this.currentTheme = 'blue';

        // Progress blocks count
        this.progressBlockCount = 40;
        this.volumeBlockCount = 20;

        // Bind methods
        this.animate = this.animate.bind(this);

        // Initialize
        this.initDOM();
        this.initEvents();
        this.initBlocks();
        this.initEqualizer();
        this.initTheme();
        this.startIdleAnimation();
    }

    /* ----------------------------------------------------------
       DOM References
    ---------------------------------------------------------- */
    initDOM() {
        // Tabs & panels
        this.tabs = {
            player: document.getElementById('tabPlayer'),
            playlist: document.getElementById('tabPlaylist'),
            equalizer: document.getElementById('tabEqualizer'),
            settings: document.getElementById('tabSettings')
        };
        this.mainDisplay = document.querySelector('.main-display');
        this.playlistPanel = document.getElementById('playlistPanel');
        this.eqPanel = document.getElementById('eqPanel');
        this.settingsPanel = document.getElementById('settingsPanel');

        // Display elements
        this.trackNameEl = document.getElementById('trackName');
        this.currentTimeEl = document.getElementById('currentTime');
        this.elapsedTimeEl = document.getElementById('elapsedTime');
        this.totalTimeEl = document.getElementById('totalTime');
        this.albumArtContainer = document.getElementById('albumArtContainer');
        this.albumArt = document.getElementById('albumArt');
        this.albumImage = document.getElementById('albumImage');

        // Visualizer
        this.canvas = document.getElementById('visualizer');
        this.ctx = this.canvas.getContext('2d');

        // Progress
        this.progressBarContainer = document.getElementById('progressBarContainer');
        this.progressBar = document.getElementById('progressBar');
        this.progressBlocks = document.getElementById('progressBlocks');

        // Controls
        this.playBtn = document.getElementById('playBtn');
        this.playIcon = document.getElementById('playIcon');
        this.pauseIcon = document.getElementById('pauseIcon');
        this.rewindBtn = document.getElementById('rewindBtn');
        this.forwardBtn = document.getElementById('forwardBtn');
        this.muteBtn = document.getElementById('muteBtn');
        this.volumeIcon = document.getElementById('volumeIcon');
        this.muteIcon = document.getElementById('muteIcon');
        this.recBtn = document.getElementById('recBtn');
        this.powerBtn = document.getElementById('powerBtn');

        // Volume
        this.volumeBarContainer = document.getElementById('volumeBarContainer');
        this.volumeBar = document.getElementById('volumeBar');
        this.volumeBlocks = document.getElementById('volumeBlocks');

        // File inputs
        this.fileInput = document.getElementById('fileInput');
        this.folderInput = document.getElementById('folderInput');
        this.dropOverlay = document.getElementById('dropOverlay');

        // Playlist
        this.addFilesBtn = document.getElementById('addFilesBtn');
        this.addFolderBtn = document.getElementById('addFolderBtn');
        this.playlistList = document.getElementById('playlistList');

        // Settings
        this.vizStyleSelect = document.getElementById('vizStyle');
        this.glowIntensitySlider = document.getElementById('glowIntensity');
        this.autoPlayCheckbox = document.getElementById('autoPlay');
        this.shuffleCheckbox = document.getElementById('shuffleMode');
        this.repeatSelect = document.getElementById('repeatMode');
    }

    /* ----------------------------------------------------------
       Events
    ---------------------------------------------------------- */
    initEvents() {
        // Tab navigation
        Object.entries(this.tabs).forEach(([name, btn]) => {
            btn.addEventListener('click', () => this.switchTab(name));
        });

        // Play/Pause
        this.playBtn.addEventListener('click', () => this.togglePlay());

        // Rewind / Forward
        this.rewindBtn.addEventListener('click', () => this.prevTrack());
        this.forwardBtn.addEventListener('click', () => this.nextTrack());

        // Mute
        this.muteBtn.addEventListener('click', () => this.toggleMute());

        // Power
        this.powerBtn.addEventListener('click', () => this.togglePower());

        // Record (visual only)
        this.recBtn.addEventListener('click', () => {
            this.recBtn.classList.toggle('recording');
        });

        // Progress bar click
        this.progressBarContainer.addEventListener('click', (e) => this.seekTo(e));

        // Volume bar click & drag
        this.volumeBarContainer.addEventListener('click', (e) => this.setVolume(e));
        this.volumeBarContainer.addEventListener('mousedown', (e) => {
            const onMove = (ev) => this.setVolume(ev);
            const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });

        // File & Folder input
        this.albumArt.addEventListener('click', () => this.fileInput.click());
        this.addFilesBtn.addEventListener('click', () => this.fileInput.click());
        this.addFolderBtn.addEventListener('click', () => this.folderInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));
        this.folderInput.addEventListener('change', (e) => this.handleFiles(e.target.files));

        // Drag & Drop
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropOverlay.classList.add('active');
        });
        document.addEventListener('dragleave', (e) => {
            if (e.relatedTarget === null) {
                this.dropOverlay.classList.remove('active');
            }
        });
        document.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropOverlay.classList.remove('active');
            if (e.dataTransfer.files.length > 0) {
                this.handleFiles(e.dataTransfer.files);
            }
        });

        // Audio events
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.onMetadataLoaded());
        this.audio.addEventListener('ended', () => this.onTrackEnded());
        this.audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            this.trackNameEl.textContent = 'ERROR LOADING TRACK';
        });

        // Settings
        this.vizStyleSelect.addEventListener('change', (e) => {
            this.vizStyle = e.target.value;
        });
        this.glowIntensitySlider.addEventListener('input', (e) => {
            this.glowIntensity = e.target.value / 100;
        });
        this.autoPlayCheckbox.addEventListener('change', (e) => {
            this.autoPlayNext = e.target.checked;
        });
        this.shuffleCheckbox.addEventListener('change', (e) => {
            this.shuffleMode = e.target.checked;
        });
        this.repeatSelect.addEventListener('change', (e) => {
            this.repeatMode = e.target.value;
        });

        // Resize canvas
        window.addEventListener('resize', () => this.resizeCanvas());
        this.resizeCanvas();

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    this.togglePlay();
                    break;
                case 'ArrowLeft':
                    if (this.audio.src) this.audio.currentTime = Math.max(0, this.audio.currentTime - 5);
                    break;
                case 'ArrowRight':
                    if (this.audio.src) this.audio.currentTime = Math.min(this.audio.duration, this.audio.currentTime + 5);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.volume = Math.min(1, this.volume + 0.05);
                    this.applyVolume();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.volume = Math.max(0, this.volume - 0.05);
                    this.applyVolume();
                    break;
                case 'KeyM':
                    this.toggleMute();
                    break;
                case 'KeyN':
                    this.nextTrack();
                    break;
                case 'KeyP':
                    this.prevTrack();
                    break;
            }
        });
    }

    /* ----------------------------------------------------------
       Audio Context Initialization
    ---------------------------------------------------------- */
    initAudioContext() {
        if (this.isAudioContextInitialized) return;

        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.8;

        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = this.volume;

        // Create EQ filters
        const frequencies = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];
        this.eqFilters = frequencies.map((freq, i) => {
            const filter = this.audioContext.createBiquadFilter();
            filter.type = i === 0 ? 'lowshelf' : i === frequencies.length - 1 ? 'highshelf' : 'peaking';
            filter.frequency.value = freq;
            filter.gain.value = 0;
            filter.Q.value = 1;
            return filter;
        });

        // Connect source -> EQ filters -> gain -> analyser -> destination
        this.sourceNode = this.audioContext.createMediaElementSource(this.audio);

        let lastNode = this.sourceNode;
        this.eqFilters.forEach(filter => {
            lastNode.connect(filter);
            lastNode = filter;
        });
        lastNode.connect(this.gainNode);
        this.gainNode.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        this.isAudioContextInitialized = true;
        this.stopIdleAnimation();
        this.animate();
    }

    /* ----------------------------------------------------------
       Blocks Initialization
    ---------------------------------------------------------- */
    initBlocks() {
        // Progress blocks
        this.progressBlocks.innerHTML = '';
        for (let i = 0; i < this.progressBlockCount; i++) {
            const block = document.createElement('div');
            block.className = 'progress-block';
            this.progressBlocks.appendChild(block);
        }

        // Volume blocks
        this.volumeBlocks.innerHTML = '';
        for (let i = 0; i < this.volumeBlockCount; i++) {
            const block = document.createElement('div');
            block.className = 'volume-block';
            this.volumeBlocks.appendChild(block);
        }
        this.updateVolumeBlocks();
    }

    /* ----------------------------------------------------------
       Equalizer UI
    ---------------------------------------------------------- */
    initEqualizer() {
        const frequencies = ['60', '170', '310', '600', '1K', '3K', '6K', '12K', '14K', '16K'];
        const eqSlidersEl = document.getElementById('eqSliders');
        eqSlidersEl.innerHTML = '';

        frequencies.forEach((freq, i) => {
            const band = document.createElement('div');
            band.className = 'eq-band';
            band.innerHTML = `
                <span class="eq-value" id="eqVal${i}">0</span>
                <input type="range" min="-12" max="12" value="0" step="1" data-index="${i}" id="eqSlider${i}">
                <label>${freq}</label>
            `;
            eqSlidersEl.appendChild(band);
        });

        // EQ slider events
        eqSlidersEl.querySelectorAll('input[type="range"]').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const idx = parseInt(e.target.dataset.index);
                const val = parseFloat(e.target.value);
                document.getElementById(`eqVal${idx}`).textContent = val > 0 ? `+${val}` : val;
                if (this.eqFilters[idx]) {
                    this.eqFilters[idx].gain.value = val;
                }
            });
        });

        // Presets
        const presets = {
            flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            rock: [5, 4, 3, 1, -1, 1, 3, 5, 5, 5],
            pop: [-1, 2, 4, 5, 4, 1, -1, -2, -2, -1],
            jazz: [3, 2, 1, 2, -1, -1, 0, 1, 2, 3],
            classical: [4, 3, 2, 1, -1, -1, 0, 2, 3, 4],
            bass: [8, 6, 4, 2, 0, 0, 0, 0, 0, 0],
            treble: [0, 0, 0, 0, 0, 2, 4, 6, 7, 8]
        };

        document.getElementById('eqPreset').addEventListener('change', (e) => {
            const preset = presets[e.target.value];
            if (preset) {
                preset.forEach((val, i) => {
                    const slider = document.getElementById(`eqSlider${i}`);
                    const valEl = document.getElementById(`eqVal${i}`);
                    if (slider) slider.value = val;
                    if (valEl) valEl.textContent = val > 0 ? `+${val}` : val;
                    if (this.eqFilters[i]) this.eqFilters[i].gain.value = val;
                });
            }
        });
    }

    /* ----------------------------------------------------------
       Theme Switching
    ---------------------------------------------------------- */
    initTheme() {
        const themePicker = document.getElementById('themePicker');
        if (!themePicker) return;

        // Load saved theme
        const savedTheme = localStorage.getItem('mp3player-theme') || 'blue';
        this.setTheme(savedTheme);

        themePicker.addEventListener('click', (e) => {
            const swatch = e.target.closest('.theme-swatch');
            if (!swatch) return;
            const theme = swatch.dataset.theme;
            this.setTheme(theme);
        });
    }

    setTheme(theme) {
        this.currentTheme = theme;

        // Apply to DOM
        document.body.setAttribute('data-theme', theme);
        document.querySelector('.player-container').setAttribute('data-theme', theme);

        // Update swatch active states
        const swatches = document.querySelectorAll('.theme-swatch');
        swatches.forEach(s => {
            s.classList.toggle('active', s.dataset.theme === theme);
        });

        // Save preference
        localStorage.setItem('mp3player-theme', theme);
    }

    getVizColor(alpha = 1) {
        const style = getComputedStyle(document.body);
        const r = style.getPropertyValue('--viz-r').trim() || '0';
        const g = style.getPropertyValue('--viz-g').trim() || '180';
        const b = style.getPropertyValue('--viz-b').trim() || '255';
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /* ----------------------------------------------------------
       Tab Switching
    ---------------------------------------------------------- */
    switchTab(tabName) {
        // Update nav links
        Object.values(this.tabs).forEach(btn => btn.classList.remove('active'));
        this.tabs[tabName].classList.add('active');

        // Show/hide panels
        this.mainDisplay.style.display = tabName === 'player' ? 'flex' : 'none';
        this.playlistPanel.style.display = tabName === 'playlist' ? 'block' : 'none';
        this.eqPanel.style.display = tabName === 'equalizer' ? 'block' : 'none';
        this.settingsPanel.style.display = tabName === 'settings' ? 'block' : 'none';
    }

    /* ----------------------------------------------------------
       File Handling
    ---------------------------------------------------------- */
    handleFiles(files) {
        const audioFiles = Array.from(files).filter(f =>
            f.type.startsWith('audio/') || f.name.match(/\.(mp3|wav|ogg|flac|aac|m4a|wma)$/i)
        );

        if (audioFiles.length === 0) return;

        audioFiles.forEach(file => {
            const url = URL.createObjectURL(file);
            const name = file.name.replace(/\.[^/.]+$/, '');
            this.playlist.push({ name, url, file, duration: 0 });
        });

        this.renderPlaylist();

        // Auto-load first track if nothing is playing
        if (this.currentTrackIndex === -1) {
            this.loadTrack(0);
        }
    }

    /* ----------------------------------------------------------
       Playlist
    ---------------------------------------------------------- */
    renderPlaylist() {
        if (this.playlist.length === 0) {
            this.playlistList.innerHTML = `
                <div class="playlist-empty">
                    <p>No tracks loaded</p>
                    <p class="hint">Drag & drop MP3 files or click ADD FILES</p>
                </div>
            `;
            return;
        }

        this.playlistList.innerHTML = this.playlist.map((track, i) => `
            <div class="playlist-item ${i === this.currentTrackIndex ? 'active' : ''}" data-index="${i}">
                <span class="track-num">${String(i + 1).padStart(2, '0')}</span>
                <span class="track-title">${track.name}</span>
                <span class="track-duration">${track.duration ? this.formatTime(track.duration) : '--:--'}</span>
                <button class="remove-btn" data-index="${i}" title="Remove">✕</button>
            </div>
        `).join('');

        // Click events
        this.playlistList.querySelectorAll('.playlist-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('remove-btn')) return;
                const idx = parseInt(item.dataset.index);
                this.loadTrack(idx);
                this.play();
            });
        });

        // Remove buttons
        this.playlistList.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.index);
                this.removeTrack(idx);
            });
        });
    }

    removeTrack(index) {
        if (index === this.currentTrackIndex) {
            this.audio.pause();
            this.isPlaying = false;
            this.updatePlayButton();
        }

        URL.revokeObjectURL(this.playlist[index].url);
        this.playlist.splice(index, 1);

        if (this.currentTrackIndex >= index) {
            this.currentTrackIndex = Math.max(-1, this.currentTrackIndex - 1);
        }

        if (this.playlist.length === 0) {
            this.currentTrackIndex = -1;
            this.trackNameEl.textContent = 'NO TRACK LOADED';
            this.currentTimeEl.textContent = '00:00';
            this.totalTimeEl.textContent = '00:00';
            this.elapsedTimeEl.textContent = '00:00';
            this.progressBar.style.width = '0%';
            this.resetProgressBlocks();
        }

        this.renderPlaylist();
    }

    /* ----------------------------------------------------------
       Track Loading & Playback
    ---------------------------------------------------------- */
    loadTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;

        this.currentTrackIndex = index;
        const track = this.playlist[index];

        this.audio.src = track.url;
        this.trackNameEl.textContent = track.name.toUpperCase();

        // Update playlist highlighting
        this.renderPlaylist();

        // Reset progress
        this.progressBar.style.width = '0%';
        this.resetProgressBlocks();
        this.currentTimeEl.textContent = '00:00';
        this.elapsedTimeEl.textContent = '00:00';
    }

    togglePlay() {
        if (this.playlist.length === 0) {
            this.fileInput.click();
            return;
        }

        if (!this.isAudioContextInitialized) {
            this.initAudioContext();
        }

        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        if (!this.audio.src && this.playlist.length > 0) {
            this.loadTrack(0);
        }

        if (!this.isAudioContextInitialized) {
            this.initAudioContext();
        }

        this.audio.play().catch(err => console.error('Play error:', err));
        this.isPlaying = true;
        this.updatePlayButton();
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.updatePlayButton();
    }

    updatePlayButton() {
        if (this.isPlaying) {
            this.playIcon.style.display = 'none';
            this.pauseIcon.style.display = 'block';
        } else {
            this.playIcon.style.display = 'block';
            this.pauseIcon.style.display = 'none';
        }
    }

    nextTrack() {
        if (this.playlist.length === 0) return;

        let nextIndex;
        if (this.shuffleMode) {
            nextIndex = Math.floor(Math.random() * this.playlist.length);
        } else {
            nextIndex = (this.currentTrackIndex + 1) % this.playlist.length;
        }

        this.loadTrack(nextIndex);
        if (this.isPlaying) this.play();
    }

    prevTrack() {
        if (this.playlist.length === 0) return;

        // If more than 3 seconds in, restart current track
        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
            return;
        }

        let prevIndex;
        if (this.shuffleMode) {
            prevIndex = Math.floor(Math.random() * this.playlist.length);
        } else {
            prevIndex = this.currentTrackIndex - 1;
            if (prevIndex < 0) prevIndex = this.playlist.length - 1;
        }

        this.loadTrack(prevIndex);
        if (this.isPlaying) this.play();
    }

    onTrackEnded() {
        if (this.repeatMode === 'one') {
            this.audio.currentTime = 0;
            this.play();
        } else if (this.repeatMode === 'all' || this.autoPlayNext) {
            if (this.currentTrackIndex < this.playlist.length - 1 || this.repeatMode === 'all') {
                this.nextTrack();
            } else {
                this.isPlaying = false;
                this.updatePlayButton();
            }
        } else {
            this.isPlaying = false;
            this.updatePlayButton();
        }
    }

    onMetadataLoaded() {
        const duration = this.audio.duration;
        if (this.playlist[this.currentTrackIndex]) {
            this.playlist[this.currentTrackIndex].duration = duration;
        }
        this.totalTimeEl.textContent = this.formatTime(duration);
        this.renderPlaylist();
    }

    /* ----------------------------------------------------------
       Progress & Time
    ---------------------------------------------------------- */
    updateProgress() {
        if (!this.audio.duration) return;

        const progress = this.audio.currentTime / this.audio.duration;
        this.progressBar.style.width = `${progress * 100}%`;

        const timeStr = this.formatTime(this.audio.currentTime);
        this.currentTimeEl.textContent = timeStr;
        this.elapsedTimeEl.textContent = timeStr;

        // Update progress blocks
        const blocks = this.progressBlocks.children;
        const activeCount = Math.floor(progress * this.progressBlockCount);
        for (let i = 0; i < blocks.length; i++) {
            blocks[i].classList.remove('active', 'current');
            if (i < activeCount) {
                blocks[i].classList.add('active');
            } else if (i === activeCount) {
                blocks[i].classList.add('current');
            }
        }
    }

    seekTo(e) {
        if (!this.audio.duration) return;
        const rect = this.progressBarContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const ratio = Math.max(0, Math.min(1, x / rect.width));
        this.audio.currentTime = ratio * this.audio.duration;
    }

    resetProgressBlocks() {
        const blocks = this.progressBlocks.children;
        for (let i = 0; i < blocks.length; i++) {
            blocks[i].classList.remove('active', 'current');
        }
    }

    /* ----------------------------------------------------------
       Volume
    ---------------------------------------------------------- */
    setVolume(e) {
        const rect = this.volumeBarContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        this.volume = Math.max(0, Math.min(1, x / rect.width));
        this.applyVolume();
    }

    applyVolume() {
        if (this.gainNode) {
            this.gainNode.gain.value = this.isMuted ? 0 : this.volume;
        }
        this.audio.volume = this.isMuted ? 0 : this.volume;
        this.volumeBar.style.width = `${this.volume * 100}%`;
        this.updateVolumeBlocks();
    }

    updateVolumeBlocks() {
        const blocks = this.volumeBlocks.children;
        const activeCount = Math.floor(this.volume * this.volumeBlockCount);
        for (let i = 0; i < blocks.length; i++) {
            blocks[i].classList.toggle('active', i < activeCount);
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.volumeIcon.style.display = this.isMuted ? 'none' : 'block';
        this.muteIcon.style.display = this.isMuted ? 'block' : 'none';

        if (this.gainNode) {
            this.gainNode.gain.value = this.isMuted ? 0 : this.volume;
        }
        this.audio.volume = this.isMuted ? 0 : this.volume;
    }

    togglePower() {
        // Toggle player on/off animation
        const container = document.querySelector('.player-container');
        container.style.transition = 'opacity 0.5s, filter 0.5s';

        if (container.style.opacity === '0.3') {
            container.style.opacity = '1';
            container.style.filter = 'none';
            if (this.isPlaying) this.audio.play();
        } else {
            container.style.opacity = '0.3';
            container.style.filter = 'brightness(0.3)';
            this.audio.pause();
        }
    }

    /* ----------------------------------------------------------
       Visualizer
    ---------------------------------------------------------- */
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }

    startIdleAnimation() {
        this.idleAnimFrame = null;
        this.idlePhase = 0;

        const drawIdle = () => {
            this.idlePhase += 0.02;
            const w = this.canvas.width;
            const h = this.canvas.height;
            this.ctx.clearRect(0, 0, w, h);

            const barCount = 32;
            const barWidth = (w / barCount) - 2;
            const gap = 2;

            for (let i = 0; i < barCount; i++) {
                const x = i * (barWidth + gap) + gap;
                const noise = Math.sin(this.idlePhase + i * 0.3) * 0.3 +
                              Math.sin(this.idlePhase * 1.7 + i * 0.5) * 0.2 +
                              0.1;
                const barH = Math.max(4, noise * h * 0.3);

                const gradient = this.ctx.createLinearGradient(x, h, x, h - barH);
                gradient.addColorStop(0, 'rgba(0, 100, 200, 0.2)');
                gradient.addColorStop(1, 'rgba(0, 180, 255, 0.1)');

                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(x, h - barH, barWidth, barH);
            }

            this.idleAnimFrame = requestAnimationFrame(drawIdle);
        };

        drawIdle();
    }

    stopIdleAnimation() {
        if (this.idleAnimFrame) {
            cancelAnimationFrame(this.idleAnimFrame);
            this.idleAnimFrame = null;
        }
    }

    animate() {
        if (!this.analyser) {
            requestAnimationFrame(this.animate);
            return;
        }

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);

        const w = this.canvas.width;
        const h = this.canvas.height;
        this.ctx.clearRect(0, 0, w, h);

        switch (this.vizStyle) {
            case 'bars':
                this.drawBars(dataArray, bufferLength, w, h);
                break;
            case 'wave':
                this.drawWave(w, h);
                break;
            case 'circular':
                this.drawCircular(dataArray, bufferLength, w, h);
                break;
        }

        requestAnimationFrame(this.animate);
    }

    drawBars(dataArray, bufferLength, w, h) {
        const barCount = Math.min(bufferLength, 64);
        const barWidth = (w / barCount) - 2;
        const gap = 2;
        const glow = this.glowIntensity;
        const style = getComputedStyle(document.body);
        const r = parseInt(style.getPropertyValue('--viz-r')) || 0;
        const g = parseInt(style.getPropertyValue('--viz-g')) || 180;
        const b = parseInt(style.getPropertyValue('--viz-b')) || 255;

        for (let i = 0; i < barCount; i++) {
            const dataIndex = Math.floor(i * bufferLength / barCount);
            const value = dataArray[dataIndex];
            const barH = (value / 255) * h * 0.9;
            const x = i * (barWidth + gap) + gap;

            // Main bar gradient
            const gradient = this.ctx.createLinearGradient(x, h, x, h - barH);
            gradient.addColorStop(0, `rgba(${r * 0.3}, ${g * 0.3}, ${b * 0.6}, ${0.6 + glow * 0.3})`);
            gradient.addColorStop(0.5, `rgba(${r * 0.6}, ${g * 0.6}, ${b * 0.8}, ${0.7 + glow * 0.2})`);
            gradient.addColorStop(0.8, `rgba(${r * 0.8}, ${g * 0.85}, ${b * 0.9}, ${0.8 + glow * 0.2})`);
            gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.9)`);

            // Glow effect
            if (glow > 0) {
                this.ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${glow * 0.6})`;
                this.ctx.shadowBlur = 8 * glow;
            }

            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(x, h - barH, barWidth, barH);

            // Top cap
            this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.9)`;
            this.ctx.fillRect(x, h - barH - 2, barWidth, 2);

            // Reflection
            const refGradient = this.ctx.createLinearGradient(x, h, x, h + barH * 0.3);
            refGradient.addColorStop(0, `rgba(${r * 0.5}, ${g * 0.5}, ${b * 0.7}, 0.15)`);
            refGradient.addColorStop(1, `rgba(${r * 0.5}, ${g * 0.5}, ${b * 0.7}, 0)`);
            this.ctx.fillStyle = refGradient;
            this.ctx.fillRect(x, h, barWidth, barH * 0.3);
        }

        this.ctx.shadowBlur = 0;
    }

    drawWave(w, h) {
        const timeData = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteTimeDomainData(timeData);
        const glow = this.glowIntensity;
        const style = getComputedStyle(document.body);
        const r = parseInt(style.getPropertyValue('--viz-r')) || 0;
        const g = parseInt(style.getPropertyValue('--viz-g')) || 180;
        const b = parseInt(style.getPropertyValue('--viz-b')) || 255;

        this.ctx.beginPath();
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.8 + glow * 0.2})`;
        this.ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${glow * 0.8})`;
        this.ctx.shadowBlur = 10 * glow;

        const sliceWidth = w / timeData.length;
        let x = 0;

        for (let i = 0; i < timeData.length; i++) {
            const v = timeData[i] / 128.0;
            const y = v * h / 2;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
            x += sliceWidth;
        }

        this.ctx.stroke();

        // Second thinner line
        this.ctx.beginPath();
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = `rgba(${r * 0.5}, ${g * 0.5}, ${b * 0.8}, 0.4)`;
        x = 0;
        for (let i = 0; i < timeData.length; i++) {
            const v = timeData[i] / 128.0;
            const y = v * h / 2 + 3;
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
            x += sliceWidth;
        }
        this.ctx.stroke();

        this.ctx.shadowBlur = 0;
    }

    drawCircular(dataArray, bufferLength, w, h) {
        const cx = w / 2;
        const cy = h / 2;
        const radius = Math.min(cx, cy) * 0.4;
        const glow = this.glowIntensity;
        const barCount = Math.min(bufferLength, 64);
        const style = getComputedStyle(document.body);
        const r = parseInt(style.getPropertyValue('--viz-r')) || 0;
        const g = parseInt(style.getPropertyValue('--viz-g')) || 180;
        const b = parseInt(style.getPropertyValue('--viz-b')) || 255;

        this.ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${glow * 0.6})`;
        this.ctx.shadowBlur = 8 * glow;

        for (let i = 0; i < barCount; i++) {
            const dataIndex = Math.floor(i * bufferLength / barCount);
            const value = dataArray[dataIndex];
            const barH = (value / 255) * radius * 1.5;

            const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
            const x1 = cx + Math.cos(angle) * radius;
            const y1 = cy + Math.sin(angle) * radius;
            const x2 = cx + Math.cos(angle) * (radius + barH);
            const y2 = cy + Math.sin(angle) * (radius + barH);

            const intensity = value / 255;
            this.ctx.beginPath();
            this.ctx.lineWidth = 3;
            const mr = Math.min(255, r + intensity * (255 - r) * 0.6);
            const mg = Math.min(255, g + intensity * (255 - g) * 0.6);
            const mb = Math.min(255, b + intensity * (255 - b) * 0.6);
            this.ctx.strokeStyle = `rgba(${mr}, ${mg}, ${mb}, ${0.5 + intensity * 0.5})`;
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        }

        // Center circle
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius * 0.3, 0, Math.PI * 2);
        this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        this.ctx.shadowBlur = 0;
    }

    /* ----------------------------------------------------------
       Utilities
    ---------------------------------------------------------- */
    formatTime(seconds) {
        if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.player = new FuturisticPlayer();
});
