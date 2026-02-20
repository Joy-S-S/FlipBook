// Premium PDF Flipbook Logic

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Icons
    lucide.createIcons();

    // Elements
    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const uploadSection = document.getElementById('upload-section');
    const viewerSection = document.getElementById('viewer-section');
    const newUploadBtn = document.getElementById('new-upload');
    const newUploadBtnMobile = document.getElementById('new-upload-mobile');

    // --- Theme Management ---
    const savedTheme = localStorage.getItem('theme') || 'dark';
    html.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        const icon = theme === 'dark' ? 'sun' : 'moon';
        themeToggle.innerHTML = `<i data-lucide="${icon}"></i>`;
        lucide.createIcons();
    }

    const effectSelector = document.getElementById('page-effect');
    const soundToggle = document.getElementById('sound-toggle');
    let currentSource = null;
    let soundEnabled = true;

    // --- File Handling ---

    // Handle Effect Change
    effectSelector.addEventListener('change', () => {
        if (currentSource) {
            initFlipbook(currentSource);
        }
    });

    // Handle Sound Toggle
    soundToggle.addEventListener('click', () => {
        // Find internal DFlip sound button and click it to toggle
        const internalSoundBtn = document.querySelector('.df-ui-sound');
        if (internalSoundBtn) {
            internalSoundBtn.click();

            // Toggle the muted class for the line animation
            soundEnabled = !soundEnabled;
            soundToggle.classList.toggle('muted');
        }
    });

    // Drag and Drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    dropZone.addEventListener('dragover', () => dropZone.classList.add('glass-active'));
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('glass-active'));

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        handleFile(file);
    });

    fileInput.addEventListener('change', (e) => {
        handleFile(e.target.files[0]);
    });

    function handleFile(file) {
        if (file && file.type === 'application/pdf') {
            currentSource = URL.createObjectURL(file);
            initFlipbook(currentSource);
        } else {
            alert('Please upload a valid PDF file.');
        }
    }

    // --- Flipbook Initialization ---

    function initFlipbook(source) {
        // Hide upload, show viewer
        uploadSection.style.display = 'none';
        viewerSection.style.display = 'flex';
        soundToggle.style.display = 'flex';
        if (newUploadBtnMobile) newUploadBtnMobile.style.display = 'flex';

        // Get hard setting from selector
        const hardSetting = effectSelector.value;

        // Initialize DFlip
        const options = {
            height: 800,
            duration: 800,
            backgroundColor: "transparent",
            hard: hardSetting,
            soundEnable: soundEnabled,
            direction: 2,
            webgl: true,
            autoEnableOutline: true,
            enableDownload: true,
            // Mobile & Touch Optimizations
            enableControlTouch: true,
            enablePan: true,
            zoomForce: 1,
            touchAction: "none",       // Forces browser to let DFlip handle touches
            // Allow page turning with a generic swipe over the whole edge instead of just corner holding
            enableSwipe: true,
            swipeDistance: 30          // Minimum drag to trigger a page turn
        };

        // Create the flipbook using the Global DFLIP object
        $(document).ready(function () {
            if (window.DFLIP) {
                // To re-init, we need to completely empty the container
                $("#df_book_viewer").empty();

                // DFlip plugin initialization
                const flipBook = $("#df_book_viewer").flipBook(source, options);
            }
        });
    }

    // --- Touch & Pointer Interceptor for Rotated View ---
    // Modern devices often use PointerEvents or MouseEvents instead of pure TouchEvents.
    // We override coordinate logic on all of them so DFlip calculates the rotated corner grabs correctly.
    (function fixCoordinates() {
        function swapProperty(proto, propX, propY, useInnerWidth) {
            if (!proto) return;
            const origX = Object.getOwnPropertyDescriptor(proto, propX);
            const origY = Object.getOwnPropertyDescriptor(proto, propY);

            if (origX && origY) {
                Object.defineProperty(proto, propX, {
                    get: function () {
                        if (window.innerWidth <= 768 && window.innerHeight > window.innerWidth) {
                            return origY.get.call(this); // X becomes Y
                        }
                        return origX.get.call(this);
                    }
                });
                Object.defineProperty(proto, propY, {
                    get: function () {
                        if (window.innerWidth <= 768 && window.innerHeight > window.innerWidth) {
                            // Y becomes ScreenWidth - X (or just swapping)
                            return useInnerWidth ? (window.innerWidth - origX.get.call(this)) : origX.get.call(this);
                        }
                        return origY.get.call(this);
                    }
                });
            }
        }

        function applySwaps(proto) {
            swapProperty(proto, 'clientX', 'clientY', true);
            swapProperty(proto, 'pageX', 'pageY', true);
            swapProperty(proto, 'screenX', 'screenY', true);
            swapProperty(proto, 'x', 'y', true);
        }

        if (typeof Touch !== 'undefined') applySwaps(Touch.prototype);
        if (typeof MouseEvent !== 'undefined') applySwaps(MouseEvent.prototype);
        if (typeof PointerEvent !== 'undefined') applySwaps(PointerEvent.prototype);
    })();

    // --- New Upload ---
    [newUploadBtn, newUploadBtnMobile].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                location.reload();
            });
        }
    });
});
