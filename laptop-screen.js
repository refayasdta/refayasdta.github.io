/* Render the existing HTML collage onto the real screen material of the 3D laptop. */
(function () {
    const modelViewer = document.getElementById('laptop-model');
    const stage = document.getElementById('laptop-stage');
    const status = document.getElementById('laptop-model-status');
    const screenSource = document.getElementById('tv-screen');
    const mainGallery = document.getElementById('tv-gallery');
    const altGallery = document.getElementById('tv-gallery-alt');

    if (!modelViewer || !stage || !screenSource || !mainGallery || !altGallery) return;

    const TEXTURE_WIDTH = 1024;
    const TEXTURE_HEIGHT = 768;
    const SCREEN_MATERIAL = 'classic_laptop_screen';

    let canvasTexture = null;
    let canvas = null;
    let context = null;
    let scrollTop = 0;
    let maxScroll = 0;
    let glitchUntil = 0;
    let renderQueued = false;
    let touchScrolling = false;
    let lastTouchY = 0;

    const activeGallery = () => altGallery.hidden ? mainGallery : altGallery;

    function updateScroll(delta) {
        const gallery = activeGallery();
        maxScroll = Math.max(0, gallery.scrollHeight - gallery.clientHeight);
        scrollTop = Math.max(0, Math.min(scrollTop + delta, maxScroll));
        gallery.scrollTop = scrollTop;
        stage.classList.add('has-scrolled');
        triggerScrollGlitch();
        queueRender();
    }

    function queueRender() {
        if (renderQueued || !context) return;
        renderQueued = true;
        requestAnimationFrame(() => {
            renderQueued = false;
            renderScreen();
        });
    }

    function drawImageCover(image, x, y, width, height) {
        if (!image.complete || !image.naturalWidth || !image.naturalHeight) {
            context.fillStyle = '#1b211e';
            context.fillRect(x, y, width, height);
            return;
        }

        const sourceRatio = image.naturalWidth / image.naturalHeight;
        const targetRatio = width / height;
        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = image.naturalWidth;
        let sourceHeight = image.naturalHeight;

        if (sourceRatio > targetRatio) {
            sourceWidth = image.naturalHeight * targetRatio;
            sourceX = (image.naturalWidth - sourceWidth) / 2;
        } else {
            sourceHeight = image.naturalWidth / targetRatio;
            sourceY = (image.naturalHeight - sourceHeight) / 2;
        }

        context.drawImage(
            image,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            x,
            y,
            width,
            height
        );
    }

    function drawScanlines() {
        context.save();
        context.globalAlpha = 0.16;
        context.fillStyle = '#020504';
        for (let y = 0; y < TEXTURE_HEIGHT; y += 6) {
            context.fillRect(0, y, TEXTURE_WIDTH, 2);
        }
        context.restore();

        const vignette = context.createRadialGradient(
            TEXTURE_WIDTH / 2,
            TEXTURE_HEIGHT / 2,
            TEXTURE_HEIGHT * 0.18,
            TEXTURE_WIDTH / 2,
            TEXTURE_HEIGHT / 2,
            TEXTURE_WIDTH * 0.68
        );
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(1, 'rgba(0,0,0,0.52)');
        context.fillStyle = vignette;
        context.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
    }

    function drawGlitch() {
        if (performance.now() >= glitchUntil) return;

        context.save();
        context.globalCompositeOperation = 'screen';
        for (let i = 0; i < 7; i += 1) {
            const y = Math.random() * TEXTURE_HEIGHT;
            const height = 3 + Math.random() * 18;
            context.fillStyle = i % 2
                ? 'rgba(0, 215, 220, 0.18)'
                : 'rgba(255, 25, 75, 0.16)';
            context.fillRect(0, y, TEXTURE_WIDTH, height);
        }
        context.restore();
    }

    function renderScreen() {
        if (!context || !canvasTexture) return;

        const gallery = activeGallery();
        const galleryWidth = gallery.clientWidth;
        const galleryHeight = gallery.clientHeight;
        if (!galleryWidth || !galleryHeight) return;

        const scaleX = TEXTURE_WIDTH / galleryWidth;
        const scaleY = TEXTURE_HEIGHT / galleryHeight;
        maxScroll = Math.max(0, gallery.scrollHeight - galleryHeight);
        scrollTop = Math.max(0, Math.min(scrollTop, maxScroll));

        context.clearRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
        context.fillStyle = '#081310';
        context.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);

        Array.from(gallery.children).forEach((element) => {
            const x = element.offsetLeft * scaleX;
            const y = (element.offsetTop - scrollTop) * scaleY;
            const width = element.offsetWidth * scaleX;
            const height = element.offsetHeight * scaleY;

            if (y + height < 0 || y > TEXTURE_HEIGHT) return;

            context.save();
            context.beginPath();
            context.roundRect(x, y, width, height, 8);
            context.clip();
            const image = element.querySelector('img');
            if (image) drawImageCover(image, x, y, width, height);
            context.restore();

            context.strokeStyle = 'rgba(255,255,255,0.13)';
            context.lineWidth = 2;
            context.strokeRect(x, y, width, height);
        });

        drawScanlines();
        drawGlitch();
        canvasTexture.source.update();
    }

    function triggerScrollGlitch() {
        glitchUntil = performance.now() + 180;
        screenSource.classList.add('glitching');
        clearTimeout(triggerScrollGlitch.timeout);
        triggerScrollGlitch.timeout = setTimeout(() => {
            screenSource.classList.remove('glitching');
            queueRender();
        }, 190);
    }

    function isPointOnLaptopScreen(clientX, clientY) {
        if (!modelViewer.model || typeof modelViewer.materialFromPoint !== 'function') return false;
        const material = modelViewer.materialFromPoint(clientX, clientY);
        return Boolean(material && material.name === SCREEN_MATERIAL);
    }

    modelViewer.addEventListener('wheel', (event) => {
        if (!isPointOnLaptopScreen(event.clientX, event.clientY)) return;

        event.preventDefault();
        event.stopImmediatePropagation();
        updateScroll(event.deltaY * 0.72);
    }, { passive: false, capture: true });

    modelViewer.addEventListener('touchstart', (event) => {
        if (event.touches.length !== 1) return;

        const touch = event.touches[0];
        if (!isPointOnLaptopScreen(touch.clientX, touch.clientY)) return;

        touchScrolling = true;
        lastTouchY = touch.clientY;
        event.preventDefault();
        event.stopImmediatePropagation();
    }, { passive: false, capture: true });

    modelViewer.addEventListener('touchmove', (event) => {
        if (!touchScrolling || event.touches.length !== 1) return;

        const touch = event.touches[0];
        const delta = (lastTouchY - touch.clientY) * 1.35;
        lastTouchY = touch.clientY;

        event.preventDefault();
        event.stopImmediatePropagation();
        updateScroll(delta);
    }, { passive: false, capture: true });

    function endTouchScroll(event) {
        if (!touchScrolling) return;
        touchScrolling = false;
        event.stopImmediatePropagation();
    }

    modelViewer.addEventListener('touchend', endTouchScroll, { capture: true });
    modelViewer.addEventListener('touchcancel', endTouchScroll, { capture: true });

    modelViewer.addEventListener('load', () => {
        const screenMaterial = modelViewer.model
            && modelViewer.model.getMaterialByName(SCREEN_MATERIAL);
        const textureSlot = screenMaterial
            && screenMaterial.pbrMetallicRoughness.baseColorTexture;

        if (!screenMaterial || !textureSlot) {
            if (status) status.textContent = 'SCREEN TEXTURE UNAVAILABLE';
            return;
        }

        canvasTexture = modelViewer.createCanvasTexture();
        canvas = canvasTexture.source.element;
        canvas.width = TEXTURE_WIDTH;
        canvas.height = TEXTURE_HEIGHT;
        context = canvas.getContext('2d');

        screenMaterial.pbrMetallicRoughness.setBaseColorFactor([1, 1, 1, 1]);
        screenMaterial.pbrMetallicRoughness.setMetallicFactor(0);
        screenMaterial.pbrMetallicRoughness.setRoughnessFactor(0.72);
        textureSlot.setTexture(canvasTexture);

        stage.classList.add('is-ready');
        if (status) status.textContent = '3D MODEL READY';

        if (window.matchMedia('(pointer: coarse)').matches) {
            const guide = stage.querySelector('.scroll-guide-copy small');
            if (guide) guide.textContent = 'Swipe up or down directly on the display';
        }

        document.querySelectorAll('.tv-gallery img').forEach((image) => {
            if (!image.complete) image.addEventListener('load', queueRender, { once: true });
        });

        queueRender();
        setInterval(queueRender, 500);
    });

    modelViewer.addEventListener('error', () => {
        stage.classList.add('has-error');
        if (status) status.textContent = '3D MODEL COULD NOT LOAD';
    });

    new MutationObserver((mutations) => {
        if (mutations.some((mutation) => mutation.attributeName === 'hidden')) {
            scrollTop = 0;
        }
        requestAnimationFrame(queueRender);
    }).observe(screenSource, {
        attributes: true,
        attributeFilter: ['hidden', 'src'],
        subtree: true
    });
})();
