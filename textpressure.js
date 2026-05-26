(function () {
  const TEXT      = "AZARIA REFAYA SIDDHARTA";
  const SLICES    = 60;
  const COLOR     = "#000000";

  let FONT_SIZE = 105;          
  let FONT      = `700 ${FONT_SIZE}px 'IBM Plex Mono', monospace`;

  const canvas = document.getElementById("text-slice-canvas");
  const ctx    = canvas.getContext("2d");

  let W, H;
  let offscreen, offCtx;

  
  const mouse   = { x: -9999, y: -9999 };
  const prev    = { x: -9999, y: -9999 };
  let   speed   = 0;
  let   velDirX = 0;
  let   isOver  = false;

  
  let sliceOffsets = [];
  let targetOffsets = [];

  
  const ball = {
    
    t:             0,
    speed:         0.001,

    
    amplitude:     0,
    frequency:     2.5,

    size:          10,
    opacity:       1,
    active:        true,
    cooldownTimer: 0,
    COOLDOWN_FRAMES: 300,
    fadeSpeed:     0.04,

    
    x: 0,
    y: 0,
    z: 0,
  };

  
  function setup() {
    const dpr = window.devicePixelRatio || 1;

    W = canvas.parentElement.clientWidth || window.innerWidth;
    
    FONT_SIZE = Math.min(105, W / 14); 
    FONT = `700 ${Math.floor(FONT_SIZE)}px 'IBM Plex Mono', monospace`;

    H = Math.round(FONT_SIZE * 3.5);

    canvas.style.width  = "100%";
    canvas.style.height = H + "px";
    canvas.style.display = "block";
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.scale(dpr, dpr);

    sliceOffsets  = new Array(SLICES).fill(0);
    targetOffsets = new Array(SLICES).fill(0);

    ball.amplitude = H * 0.28;

    buildOffscreen();
  }

  function buildOffscreen() {
    const dpr  = window.devicePixelRatio || 1;
    offscreen  = document.createElement("canvas");
    offscreen.width  = Math.round(W * dpr);
    offscreen.height = Math.round(H * dpr);
    offCtx = offscreen.getContext("2d");
    offCtx.scale(dpr, dpr);

    const stretchFactor = 2.5;
    offCtx.scale(1, stretchFactor); 

    offCtx.font          = FONT;
    offCtx.fillStyle     = COLOR;
    offCtx.textAlign     = "center";
    offCtx.textBaseline  = "middle";
    offCtx.fillText(TEXT, W / 2, (H / 2) / stretchFactor); 
  }

  
  function calcBallPos() {
    const angle = ball.t * Math.PI * 2 * ball.frequency;

    ball.x = ball.t * W;
    ball.y = H / 2 + Math.sin(angle) * ball.amplitude;
    ball.z = Math.cos(angle);
  }

  
  function drawBall() {
    if (ball.opacity <= 0) return;

    const { x, y, z } = ball;

    const depthScale = 0.55 + 0.45 * ((z + 1) / 2);

    const depthAlpha = 0.28 + 0.72 * ((z + 1) / 2);

    const r = ball.size * depthScale;

    ctx.save();
    ctx.globalAlpha = ball.opacity * depthAlpha;

    
    const glowR = r * 3.2;
    const glow  = ctx.createRadialGradient(x, y, 0, x, y, glowR);
    glow.addColorStop(0,   `rgba(0,0,0,${0.18 * depthScale})`);
    glow.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, glowR, 0, Math.PI * 2);
    ctx.fill();

    
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    
    if (z > -0.2) {
      const highlightAlpha = Math.max(0, (z + 0.2) / 1.2);
      ctx.globalAlpha = ball.opacity * depthAlpha * highlightAlpha;
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.arc(x - r * 0.28, y - r * 0.28, r * 0.38, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  
  function updateBall() {
    if (isOver) {
      ball.opacity       = Math.max(0, ball.opacity - ball.fadeSpeed);
      ball.active        = false;
      ball.cooldownTimer = 0;
      return;
    }

    if (ball.active) {
      ball.t += ball.speed;
      if (ball.t > 1) ball.t -= 1;
      ball.opacity = Math.min(1, ball.opacity + ball.fadeSpeed);
    } else {
      ball.cooldownTimer++;
      if (ball.cooldownTimer >= ball.COOLDOWN_FRAMES) {
        ball.active        = true;
        ball.cooldownTimer = 0;
      }
    }

    calcBallPos();
  }

  
  function getEffectiveCursor() {
    if (isOver) return { x: mouse.x, y: mouse.y };
    if (ball.opacity > 0) return { x: ball.x, y: ball.y };
    return { x: -9999, y: -9999 };
  }

  
  function update() {
    updateBall();

    const effective = getEffectiveCursor();

    if (isOver) {
      const dx = effective.x - prev.x;
      const dy = effective.y - prev.y;
      const rawSpeed = Math.sqrt(dx * dx + dy * dy);
      speed += (rawSpeed - speed) * 0.2;
      if (dx !== 0) velDirX = dx >= 0 ? 1 : -1;
    } else if (ball.active && ball.opacity > 0.05) {
      
      const helixDx = ball.speed * W;
      speed   += (helixDx * 8 - speed) * 0.06;
      velDirX  = 1;
    } else {
      speed *= 0.92;
    }

    prev.x = effective.x;
    prev.y = effective.y;

    const maxShear = Math.min(speed * 6, 200);
    const now      = Date.now();

    for (let i = 0; i < SLICES; i++) {
      const t    = i / (SLICES - 1);
      const wave = Math.sin(t * Math.PI * 3 + now * 0.004) * 0.6
                 + Math.sin(t * Math.PI * 1.2 + now * 0.002) * 0.4;
      targetOffsets[i] = velDirX * maxShear * wave;
    }

    for (let i = 0; i < SLICES; i++) {
      sliceOffsets[i] += (targetOffsets[i] - sliceOffsets[i]) * 0.06;
    }
  }

  
  function draw() {
    const dpr      = window.devicePixelRatio || 1;
    const sliceH   = H / SLICES;
    const effective = getEffectiveCursor();
    const radius   = 150;
    const colWidth = 10;

    ctx.clearRect(0, 0, W, H);

    
    const ballIsIdle = !ball.active && ball.opacity <= 0;
    let   isIdle     = !isOver && ballIsIdle;
    if (isIdle) {
      for (let i = 0; i < SLICES; i++) {
        if (Math.abs(sliceOffsets[i]) > 0.5) { isIdle = false; break; }
      }
    }

    if (isIdle) {
      ctx.drawImage(offscreen, 0, 0, offscreen.width, offscreen.height, 0, 0, W, H);
      return;
    }

    
    function drawDistortedText() {
      const startCol    = Math.max(0, Math.floor((effective.x - radius) / colWidth));
      const maxCols     = Math.ceil(W / colWidth);
      const endCol      = Math.max(0, Math.min(maxCols, Math.ceil((effective.x + radius) / colWidth)));
      const alignedStart = Math.min(W, startCol * colWidth);
      const alignedEnd   = Math.max(0, Math.min(endCol * colWidth, W));

      for (let i = 0; i < SLICES; i++) {
        const sy     = i * sliceH;
        const offset = sliceOffsets[i];

        if (alignedStart > 0) {
          ctx.drawImage(offscreen,
            0, sy * dpr, alignedStart * dpr, sliceH * dpr,
            0, sy, alignedStart, sliceH);
        }

        for (let j = startCol; j < endCol; j++) {
          const sx1 = j * colWidth;
          const sx2 = Math.min((j + 1) * colWidth, W);
          const sw  = sx2 - sx1;
          if (sw <= 0) continue;

          const inf1 = Math.max(0, 1 - Math.abs(effective.x - sx1) / radius);
          const inf2 = Math.max(0, 1 - Math.abs(effective.x - sx2) / radius);
          const dx1  = sx1 + offset * inf1;
          const dx2  = sx2 + offset * inf2;
          const dw   = dx2 - dx1;

          if (dw > 0) {
            ctx.drawImage(offscreen,
              sx1 * dpr, sy * dpr, sw * dpr, sliceH * dpr,
              dx1, sy, dw, sliceH);
          }
        }

        if (alignedEnd < W) {
          const rightW = W - alignedEnd;
          ctx.drawImage(offscreen,
            alignedEnd * dpr, sy * dpr, rightW * dpr, sliceH * dpr,
            alignedEnd, sy, rightW, sliceH);
        }
      }
    }

    
    if (isOver || ballIsIdle || ball.z >= 0) {
      drawDistortedText();
      if (!isOver) drawBall();
    } else {
      drawBall();
      drawDistortedText();
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  
  canvas.addEventListener("mouseenter", () => { isOver = true; });

  canvas.addEventListener("mouseleave", () => {
    isOver             = false;
    ball.active        = false;
    ball.cooldownTimer = 0;
  });

  canvas.addEventListener("mousemove", function (e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  canvas.addEventListener("touchmove", function (e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.touches[0].clientX - rect.left;
    mouse.y = e.touches[0].clientY - rect.top;
  }, { passive: false });

  canvas.addEventListener("touchend", () => {
    isOver             = false;
    ball.active        = false;
    ball.cooldownTimer = 0;
  });

  window.addEventListener("resize", setup);

  
  setup();
  loop();
})();