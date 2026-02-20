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
            enableControlTouch: true,  // Explicitly enables touch controls
            enablePan: true,           // Allows smoother panning/dragging
            zoomForce: 1,              // Smoother zoom interaction
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

    // --- New Upload ---
    newUploadBtn.addEventListener('click', () => {
        location.reload(); // Simple way to reset everything
    });
});
