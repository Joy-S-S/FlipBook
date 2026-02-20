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
    const mainHeader = document.getElementById('main-header');
    const headerNewUpload = document.getElementById('header-new-upload');

    // Rotate prompt
    const rotatePrompt = document.getElementById('rotate-prompt');

    // FAB elements
    const mobileFab = document.getElementById('mobile-fab');
    const fabToggle = document.getElementById('fab-toggle');
    const fabMenu = document.getElementById('fab-menu');
    const fabTheme = document.getElementById('fab-theme');
    const fabSound = document.getElementById('fab-sound');
    const fabEffect = document.getElementById('fab-effect');
    const fabUpload = document.getElementById('fab-upload');

    const effectSelector = document.getElementById('page-effect');
    const soundToggle = document.getElementById('sound-toggle');
    let currentSource = null;
    let soundEnabled = true;
    let bookLoaded = false;
    let fabAutoHideTimer = null;

    // --- Theme Management ---
    const savedTheme = localStorage.getItem('theme') || 'dark';
    html.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        toggleTheme();
    });

    function toggleTheme() {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    }

    function updateThemeIcon(theme) {
        const icon = theme === 'dark' ? 'sun' : 'moon';
        themeToggle.innerHTML = `<i data-lucide="${icon}"></i>`;
        // Update FAB theme icon too
        if (fabTheme) {
            fabTheme.innerHTML = `<i data-lucide="${icon}"></i>`;
        }
        lucide.createIcons();
    }

    // --- File Handling ---

    // Handle Effect Change (both header and FAB selectors)
    effectSelector.addEventListener('change', () => {
        if (currentSource) {
            // Sync FAB selector
            fabEffect.value = effectSelector.value;
            initFlipbook(currentSource);
        }
    });

    fabEffect.addEventListener('change', () => {
        if (currentSource) {
            // Sync header selector
            effectSelector.value = fabEffect.value;
            initFlipbook(currentSource);
        }
    });

    // Handle Sound Toggle (both header and FAB)
    soundToggle.addEventListener('click', () => {
        toggleSound();
    });

    function toggleSound() {
        const internalSoundBtn = document.querySelector('.df-ui-sound');
        if (internalSoundBtn) {
            internalSoundBtn.click();
            soundEnabled = !soundEnabled;
            soundToggle.classList.toggle('muted');
            fabSound.classList.toggle('muted');
        }
    }

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
        headerNewUpload.style.display = 'flex';
        bookLoaded = true;

        // Add viewer-active class to body to prevent pull-to-refresh
        document.body.classList.add('viewer-active');

        // Get hard setting from selector
        const hardSetting = effectSelector.value;

        // Check if mobile
        const isMobile = window.innerWidth <= 932;

        // Initialize DFlip
        const options = {
            height: 800,
            duration: 800,
            backgroundColor: "transparent",
            hard: hardSetting,
            soundEnable: soundEnabled,
            direction: 2,
            webgl: true,
            autoEnableOutline: !isMobile, // Hide outline on mobile to save space
            enableDownload: true,
            // Mobile & Touch Optimizations
            enableControlTouch: true,
            enablePan: true,
            zoomForce: isMobile ? 0.9 : 1,
            scrollWheel: !isMobile, // Prevent accidental zoom on mobile
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

        // Check orientation after book load
        setTimeout(() => {
            checkOrientation();
            updateMobileUI();
        }, 100);
    }

    // --- Orientation Management ---

    function isMobileDevice() {
        return window.innerWidth <= 932 || window.innerHeight <= 932;
    }

    function isLandscape() {
        return window.matchMedia("(orientation: landscape)").matches;
    }

    function checkOrientation() {
        if (!bookLoaded || !isMobileDevice()) {
            // Not mobile or no book — hide everything
            rotatePrompt.classList.remove('visible');
            return;
        }

        if (!isLandscape()) {
            // Portrait + mobile + book loaded → show rotate prompt
            rotatePrompt.classList.add('visible');
        } else {
            // Landscape → hide rotate prompt
            rotatePrompt.classList.remove('visible');
        }
    }

    let needsFullscreen = false;

    function updateMobileUI() {
        if (!bookLoaded) {
            mobileFab.classList.remove('visible');
            return;
        }

        if (isMobileDevice() && isLandscape()) {
            // Show FAB in landscape
            mobileFab.classList.add('visible');
            // Flag that we want fullscreen — will enter on next user tap
            needsFullscreen = true;
        } else {
            // Hide FAB in portrait / desktop
            mobileFab.classList.remove('visible');
            closeFabMenu();
            needsFullscreen = false;
            exitFullscreen();
        }
    }

    // --- Fullscreen API ---

    function enterFullscreen() {
        const el = document.documentElement;
        if (document.fullscreenElement) return; // Already fullscreen

        const request = el.requestFullscreen
            || el.webkitRequestFullscreen
            || el.msRequestFullscreen;

        if (request) {
            request.call(el).catch(() => {
                // Fullscreen may be blocked if not triggered by user gesture
                // That's ok, CSS will still handle the layout
            });
        }
    }

    function exitFullscreen() {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) return;

        const exit = document.exitFullscreen
            || document.webkitExitFullscreen
            || document.msExitFullscreen;

        if (exit) {
            exit.call(document).catch(() => { });
        }
    }

    // Listen for orientation and resize changes
    let resizeDebounce = null;
    function onOrientationResize() {
        clearTimeout(resizeDebounce);
        resizeDebounce = setTimeout(() => {
            checkOrientation();
            updateMobileUI();

            // Re-initialize the flipbook to fit new dimensions
            if (bookLoaded && currentSource) {
                // Give the browser a moment to settle the new viewport
                setTimeout(() => {
                    initFlipbook(currentSource);
                }, 300);
            }
        }, 150);
    }

    window.addEventListener('resize', onOrientationResize);
    window.addEventListener('orientationchange', onOrientationResize);

    // Also listen to the orientation media query
    const orientationMQ = window.matchMedia("(orientation: landscape)");
    orientationMQ.addEventListener('change', onOrientationResize);

    // --- FAB Logic ---

    fabToggle.addEventListener('click', () => {
        const isOpen = fabMenu.classList.contains('open');
        if (isOpen) {
            closeFabMenu();
        } else {
            openFabMenu();
        }
    });

    function openFabMenu() {
        fabMenu.classList.add('open');
        fabToggle.classList.add('active');
        lucide.createIcons();
        resetFabAutoHide();
    }

    function closeFabMenu() {
        fabMenu.classList.remove('open');
        fabToggle.classList.remove('active');
        clearTimeout(fabAutoHideTimer);
    }

    function resetFabAutoHide() {
        clearTimeout(fabAutoHideTimer);
        fabAutoHideTimer = setTimeout(() => {
            closeFabMenu();
        }, 4000); // Auto-hide after 4 seconds
    }

    // FAB Theme Toggle
    fabTheme.addEventListener('click', () => {
        toggleTheme();
        resetFabAutoHide();
    });

    // FAB Sound Toggle
    fabSound.addEventListener('click', () => {
        toggleSound();
        resetFabAutoHide();
    });

    // FAB Upload New
    fabUpload.addEventListener('click', () => {
        location.reload();
    });

    // Header compact upload button
    headerNewUpload.addEventListener('click', () => {
        location.reload();
    });

    // --- New Upload (desktop button) ---
    newUploadBtn.addEventListener('click', () => {
        location.reload();
    });

    // --- Touch UX: Prevent interfering browser gestures ---

    // Prevent pull-to-refresh and pinch-zoom on the viewer
    const viewerEl = document.getElementById('df_book_viewer');
    viewerEl.addEventListener('touchmove', (e) => {
        // Only prevent if the event is cancelable (avoids browser intervention warning)
        if (e.cancelable && e.touches.length > 1) {
            e.preventDefault(); // Prevent pinch-zoom
        }
    }, { passive: false });

    // Prevent double-tap zoom on the viewer
    let lastTap = 0;
    viewerEl.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTap < 300) {
            e.preventDefault();
        }
        lastTap = now;
    }, { passive: false });

    // --- Landscape Header Show on Tap Top Edge ---
    document.addEventListener('click', (e) => {
        // Enter fullscreen on first user tap in landscape (browser requires user gesture)
        if (needsFullscreen) {
            enterFullscreen();
            needsFullscreen = false;
        }

        if (!isMobileDevice() || !isLandscape() || !bookLoaded) return;

        // If user taps top 50px of screen, briefly show header
        if (e.clientY < 50) {
            mainHeader.classList.add('header-visible');
            setTimeout(() => {
                mainHeader.classList.remove('header-visible');
            }, 3000);
        }
    });
});
