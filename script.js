/* ---------------- LOADER ---------------- */
(function () {
    const loader = document.getElementById('loader');
    const fill = loader && loader.querySelector('.loader-name-fill');
    const nameShell = loader && loader.querySelector('.loader-name-shell');
    const zoomTarget = loader && loader.querySelector('.loader-name-fill .loader-zoom-target');
    if (!loader || !fill || !nameShell || !zoomTarget) return;

    document.body.classList.add('loading');

    function nextFrame() {
        return new Promise((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(resolve));
        });
    }

    function waitForMotion(element, eventName, motionName, fallbackMs) {
        return new Promise((resolve) => {
            let finished = false;
            const finish = () => {
                if (finished) return;
                finished = true;
                element.removeEventListener(eventName, onEnd);
                resolve();
            };
            const onEnd = (event) => {
                if (event.target !== element) return;
                if (motionName && event.animationName !== motionName) return;
                finish();
            };

            element.addEventListener(eventName, onEnd);
            setTimeout(finish, fallbackMs);
        });
    }

    function setZoomOrigin() {
        const shellBounds = nameShell.getBoundingClientRect();
        const targetBounds = zoomTarget.getBoundingClientRect();
        const originX = targetBounds.left + (targetBounds.width / 2) - shellBounds.left;
        const originY = targetBounds.top + (targetBounds.height * 0.72) - shellBounds.top;
        nameShell.style.setProperty('--loader-zoom-origin', `${originX}px ${originY}px`);
    }

    async function playLoader() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            loader.classList.add('is-filled', 'is-zoomed');
            document.body.classList.add('menu-entering', 'loaded');
            await nextFrame();
            loader.remove();
            document.body.classList.remove('loading', 'menu-entering');
            return;
        }

        await nextFrame();
        loader.classList.add('is-filling');
        await waitForMotion(fill, 'animationend', 'loader-liquid-fill', 4000);

        setZoomOrigin();
        loader.classList.add('is-filled', 'is-zooming');
        await waitForMotion(nameShell, 'animationend', 'loader-name-zoom', 1800);

        loader.classList.add('is-zoomed');
        document.body.classList.add('menu-entering', 'loaded');
        loader.classList.add('is-revealing');
        await waitForMotion(loader, 'transitionend', '', 1200);

        loader.remove();
        document.body.classList.remove('loading');
        setTimeout(() => document.body.classList.remove('menu-entering'), 450);
    }

    playLoader();
})();

/* ---------------- TV PANEL DOT HOVER ---------------- */
(function () {
    const panel = document.querySelector('.tv-panel');
    if (!panel || !window.matchMedia('(hover: hover)').matches) return;

    panel.addEventListener('pointermove', (event) => {
        const bounds = panel.getBoundingClientRect();
        panel.style.setProperty('--dot-x', `${event.clientX - bounds.left}px`);
        panel.style.setProperty('--dot-y', `${event.clientY - bounds.top}px`);
        panel.classList.add('dot-hover');
    });

    panel.addEventListener('pointerleave', () => panel.classList.remove('dot-hover'));
})();

/* ---------------- LIVE CLOCK ---------------- */
(function () {
    const clockEls = document.querySelectorAll('#clock, [data-clock]');
    if (!clockEls.length) return;

    function tick() {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        const str = `${hh}:${mm}:${ss}`;
        clockEls.forEach((el) => { el.textContent = str; });
    }

    tick();
    setInterval(tick, 1000);
})();

/* ---------------- INFO / CONTACT / DETAIL VIEW SWITCH ---------------- */
(function () {
    const pills = document.querySelectorAll('.pill[data-view]');
    const views = {
        info: document.getElementById('view-info'),
        contact: document.getElementById('view-contact'),
        detail: document.getElementById('view-detail'),
    };
    if (!views.info || !views.contact || !views.detail) return;

    const tvScreen    = document.getElementById('tv-screen');
    const tvGallery    = document.getElementById('tv-gallery');
    const tvGalleryAlt = document.getElementById('tv-gallery-alt');

    let current = 'info';
    const TRANSITION_MS = 350;
    const CHANNEL_SWITCH_MS = 460;

    function setActivePill(name) {
        pills.forEach((p) => {
            p.setAttribute('aria-pressed', p.dataset.view === name ? 'true' : 'false');
        });
    }

    function swapTvGallery(name) {
        if (!tvGallery || !tvGalleryAlt) return;
        const showAlt = name === 'detail';
        tvGallery.hidden = showAlt;
        tvGalleryAlt.hidden = !showAlt;
    }

    function switchTvChannel(name) {
        if (!tvScreen) {
            swapTvGallery(name);
            return;
        }

        tvScreen.classList.remove('channel-switching');
        void tvScreen.offsetWidth;
        tvScreen.classList.add('channel-switching');
        setTimeout(() => swapTvGallery(name), 190);
        setTimeout(() => tvScreen.classList.remove('channel-switching'), CHANNEL_SWITCH_MS);
    }

    function switchTo(name) {
        if (name === current || !views[name]) return;

        const outgoing = views[current];
        const incoming = views[name];

        setActivePill(name);
        outgoing.classList.add('is-hidden');

        setTimeout(() => {
            outgoing.hidden = true;
            outgoing.classList.remove('is-hidden');

            incoming.hidden = false;
            incoming.classList.add('is-hidden');

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    incoming.classList.remove('is-hidden');
                });
            });

            /* the AR canvas has zero width while its view is hidden,
               so re-measure it now that it's visible */
            if (name === 'contact' && window.arNamePressure) {
                requestAnimationFrame(() => window.arNamePressure.refresh());
            }
        }, TRANSITION_MS);

        /* Swap the collage at the noisy midpoint of an old-TV channel change. */
        if (name === 'detail' || current === 'detail') {
            switchTvChannel(name);
        }

        current = name;
    }

    pills.forEach((pill) => {
        pill.addEventListener('click', () => switchTo(pill.dataset.view));
    });

    window.switchPanelView = switchTo;
})();

/* ---------------- DETAIL CONTENT (BarangKita / HIMA IF / VLF / SPACES) ---------------- */
(function () {
    const detailData = {
        barangkita: {
            title: 'BarangKita',
            desc: "BarangKita is a web marketplace built for buying and selling secondhand items. It pairs a Java Springboot backend with a clean HTML/CSS front end, focused on making listings simple to browse, quick to post, and easy to trust — turning a pile of unused stuff into someone else's next find.",
            tags: ['Java Springboot', 'HTML / CSS', 'Marketplace'],
            thumb: 'assets/logo%20barangkita.png',
            images: ['assets/logo%20barangkita.png', 'assets/logo_barangkita_final.png', 'assets/placeholder.jpg', 'assets/placeholder.jpg'],
        },
        hima: {
            title: 'HIMA IF Telkom University',
            desc: 'Staff for the Cadre Development (Kaderisasi) Division at HIMA IF, from July 2025 to December 2026. Helped oversee the LEADS Informatics program and took a key part in the FORTRAN program, sharpening teamwork, project management, discipline, and working under pressure.',
            tags: ['Kaderisasi Division', 'LEADS Program', 'FORTRAN'],
            thumb: 'assets/exp1.jpeg',
            images: ['assets/exp1.jpeg', 'assets/exp1.jpeg', 'assets/about-pic.png', 'assets/placeholder.jpg'],
        },
        vlf: {
            title: 'VIVA LA FIA (VLF)',
            desc: 'Part of the event division for VLF 2025 across a 6-month run, helping organize and plan the event end to end. Sharpened skills in mediation, time management, and creative production under a tight schedule.',
            tags: ['Event Division', '2025'],
            thumb: 'assets/exp2.jpeg',
            images: ['assets/exp2.jpeg', 'assets/exp2.jpeg', 'assets/placeholder.jpg', 'assets/about-pic.png'],
        },
        spaces: {
            title: 'SPACES',
            desc: "One of the organizations Refaya has been involved with alongside HIMA IF and VLF. Full details on the role and projects here are still being written up.",
            tags: ['Community'],
            thumb: 'assets/placeholder.jpg',
            images: ['assets/placeholder.jpg', 'assets/placeholder.jpg', 'assets/about-pic.png', 'assets/exp1.jpeg'],
        },
    };

    const openers  = document.querySelectorAll('[data-detail]');
    const closeBtn = document.getElementById('detail-close-btn');
    if (!openers.length || !window.switchPanelView) return;

    const thumbImg  = document.getElementById('detail-thumb-img');
    const titleEl   = document.getElementById('detail-title');
    const descEl    = document.getElementById('detail-desc');
    const tagsEl    = document.getElementById('detail-tags');
    const altImgs   = [1, 2, 3, 4].map((n) => document.getElementById(`alt-img-${n}`));

    function renderDetail(key) {
        const data = detailData[key];
        if (!data) return;

        if (thumbImg) {
            thumbImg.src = data.thumb;
            thumbImg.alt = data.title + ' thumbnail';
        }
        if (titleEl) titleEl.textContent = data.title;
        if (descEl) descEl.textContent = data.desc;
        if (tagsEl) {
            tagsEl.innerHTML = '';
            data.tags.forEach((tag) => {
                const span = document.createElement('span');
                span.className = 'detail-tag';
                span.textContent = tag;
                tagsEl.appendChild(span);
            });
        }

        altImgs.forEach((img, i) => {
            if (!img) return;
            img.src = data.images[i] || data.images[0];
            img.alt = data.title + ' gallery image ' + (i + 1);
        });
    }

    function open(key) {
        renderDetail(key);
        window.switchPanelView('detail');
    }

    openers.forEach((el) => {
        el.addEventListener('click', () => open(el.dataset.detail));
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                open(el.dataset.detail);
            }
        });
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => window.switchPanelView('info'));
    }
})();

/* ---------------- COPY EMAIL ---------------- */
(function () {
    const btn = document.getElementById('copy-email');
    if (!btn) return;

    btn.addEventListener('click', async () => {
        const email = 'refayasiddharta@gmail.com';
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(email);
            } else {
                const helper = document.createElement('textarea');
                helper.value = email;
                helper.setAttribute('readonly', '');
                helper.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
                document.body.appendChild(helper);
                helper.select();
                const copied = document.execCommand('copy');
                helper.remove();
                if (!copied) throw new Error('Copy command was unavailable');
            }
        } catch (e) {
            /* The address remains visible for manual copy when a browser blocks clipboard access. */
            return;
        }
        const original = btn.innerHTML;
        btn.textContent = '✓';
        setTimeout(() => { btn.innerHTML = original; }, 1200);
    });
})();

/* ---------------- CRT GLITCH ON GALLERY SCROLL ---------------- */
(function () {
    const screen  = document.getElementById('tv-screen');
    const gallery = document.getElementById('tv-gallery');
    if (!screen || !gallery) return;

    let glitchTimeout = null;

    gallery.addEventListener('scroll', () => {
        screen.classList.add('glitching');
        clearTimeout(glitchTimeout);
        glitchTimeout = setTimeout(() => {
            screen.classList.remove('glitching');
        }, 220);
    }, { passive: true });

    /* occasional ambient glitch even when idle, for that CRT feel */
    setInterval(() => {
        if (Math.random() < 0.35) {
            screen.classList.add('glitching');
            setTimeout(() => screen.classList.remove('glitching'), 180);
        }
    }, 4000);
})();

/* ---------------- INFO PANEL SCROLL HINT ---------------- */
(function () {
    const panel = document.querySelector('.info-panel');
    const hint = document.querySelector('.info-scroll-hint');
    if (!panel || !hint) return;

    const dismissHint = () => hint.classList.add('is-dismissed');

    panel.addEventListener('scroll', dismissHint, { passive: true, once: true });
    panel.addEventListener('wheel', dismissHint, { passive: true, once: true });
    panel.addEventListener('touchmove', dismissHint, { passive: true, once: true });
})();
