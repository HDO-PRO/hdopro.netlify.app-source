// HDO Pro Retro Snake Arcade
(function () {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('scoreBoard');
  const highScoreEl = document.getElementById('highScoreBoard');
  const msgEl = document.getElementById('gameMsg');
  const settingsPanel = document.getElementById('settings-panel');
  const helpModal = document.getElementById('help-modal');
  const helpOverlay = document.getElementById('help-overlay');

  const STORAGE_KEY = 'hdoArcadeSettings';
  const HIGHSCORE_KEY = 'hdoArcadeHighScore';

  const THEMES = {
    hdo: { bg: '#000', grid: '#222', food: '#ff66b2', head: '#55ff55', body: '#00ff00', flash: '#ff66b2' },
    classic: { bg: '#000', grid: '#111', food: '#ff0000', head: '#00ff00', body: '#00cc00', flash: '#00ff00' },
    matrix: { bg: '#000', grid: '#051005', food: '#00ff00', head: '#ccffcc', body: '#00ff00', flash: '#00ff00' },
    neon: { bg: '#050510', grid: '#1a1a40', food: '#ff00ff', head: '#00ffff', body: '#0088ff', flash: '#00ffff' }
  };

  const DIFFICULTY = {
    slow: 170,
    normal: 125,
    fast: 80
  };

  const defaults = {
    theme: 'hdo',
    difficulty: 'normal',
    grid: 20,
    walls: true,
    showGrid: true,
    sound: true,
    swipe: true,
    glow: true,
    showBorder: true,
    showDPad: true,
    vibrate: false,
    pixelRain: true,
    showNotices: true,
    showControlsHint: true,
    showScore: true,
    showHighScore: true,
    compact: false,
    scrollLock: true,
    speedMult: 1
  };

  let settings = loadSettings();
  let grid = parseInt(settings.grid, 10) || 20;
  let tileCount = 320 / grid;
  let snake = [centerTile(7, 7)];
  let dx = grid;
  let dy = 0;
  let food = placeFood();
  let score = 0;
  let highScore = 0;
  let running = false;
  let paused = false;
  let loopId = null;
  let currentSpeed = DIFFICULTY[settings.difficulty];
  let audioCtx = null;

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return { ...defaults, ...saved };
    } catch (e) {
      return { ...defaults };
    }
  }

  function saveSettings() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (e) {}
  }

  function loadHighScore() {
    try {
      highScore = parseInt(localStorage.getItem(HIGHSCORE_KEY) || '0', 10) || 0;
    } catch (e) {
      highScore = 0;
    }
    highScoreEl.textContent = 'High Score: ' + highScore;
  }

  function centerTile(x, y) {
    return { x: x * grid, y: y * grid };
  }

  function rand() {
    return Math.floor(Math.random() * tileCount) * grid;
  }

  function placeFood() {
    let x, y;
    do {
      x = rand();
      y = rand();
    } while (snake.some(s => s.x === x && s.y === y));
    return { x, y };
  }

  function updateSpeed() {
    const levels = Math.floor(score / 50);
    const base = Math.max(40, DIFFICULTY[settings.difficulty] - (levels * 12));
    currentSpeed = Math.max(20, base / settings.speedMult);
  }

  function playBeep(freq, duration) {
    if (!settings.sound) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.value = 0.05;
      osc.start();
      setTimeout(() => { osc.stop(); }, duration);
    } catch (e) {}
  }

  function reset() {
    grid = parseInt(settings.grid, 10) || 20;
    tileCount = 320 / grid;
    canvas.width = 320;
    canvas.height = 320;
    const startX = Math.floor(tileCount / 2);
    const startY = Math.floor(tileCount / 2);
    snake = [centerTile(startX, startY)];
    dx = grid;
    dy = 0;
    score = 0;
    scoreEl.textContent = 'Score: ' + score;
    msgEl.textContent = 'Press Start or tap the D-pad / swipe';
    food = placeFood();
    updateSpeed();
  }

  function draw() {
    const t = THEMES[settings.theme] || THEMES.hdo;
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (settings.showGrid) {
      ctx.strokeStyle = t.grid;
      ctx.lineWidth = 1;
      for (let i = 0; i <= tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * grid, 0);
        ctx.lineTo(i * grid, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * grid);
        ctx.lineTo(canvas.width, i * grid);
        ctx.stroke();
      }
    }

    ctx.fillStyle = t.food;
    if (settings.glow) {
      ctx.shadowColor = t.food;
      ctx.shadowBlur = 10;
    } else {
      ctx.shadowBlur = 0;
    }
    ctx.fillRect(food.x + 4, food.y + 4, grid - 8, grid - 8);
    ctx.shadowBlur = 0;

    snake.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? t.head : t.body;
      ctx.fillRect(seg.x + 2, seg.y + 2, grid - 4, grid - 4);
      if (i === 0) {
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(seg.x + 2, seg.y + 2, grid - 4, grid - 4);
      }
    });

    if (paused) {
      const t2 = THEMES[settings.theme];
      ctx.fillStyle = t2.bg.replace(')', ', 0.85)').replace('rgb', 'rgba');
      if (!ctx.fillStyle.includes('rgba')) ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = t.food;
      ctx.font = 'bold 28px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }
  }

  function update() {
    if (paused) return;

    let headX = snake[0].x + dx;
    let headY = snake[0].y + dy;

    if (settings.walls) {
      if (headX < 0 || headX >= canvas.width || headY < 0 || headY >= canvas.height) {
        gameOver();
        return;
      }
    } else {
      if (headX < 0) headX = canvas.width - grid;
      if (headX >= canvas.width) headX = 0;
      if (headY < 0) headY = canvas.height - grid;
      if (headY >= canvas.height) headY = 0;
    }

    const head = { x: headX, y: headY };

    if (snake.some(s => s.x === head.x && s.y === head.y)) {
      gameOver();
      return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score += 10;
      scoreEl.textContent = 'Score: ' + score;
      playBeep(440, 80);
      if (settings.vibrate && navigator.vibrate) navigator.vibrate(40);
      if (score > highScore) {
        highScore = score;
        highScoreEl.textContent = 'High Score: ' + highScore;
        try { localStorage.setItem(HIGHSCORE_KEY, highScore); } catch (e) {}
      }
      updateSpeed();
      food = placeFood();
    } else {
      snake.pop();
    }
  }

  function loop() {
    if (!running) return;
    update();
    draw();
    loopId = setTimeout(() => requestAnimationFrame(loop), currentSpeed);
  }

  function gameOver() {
    running = false;
    if (loopId) clearTimeout(loopId);
    playBeep(150, 250);
    if (settings.vibrate && navigator.vibrate) navigator.vibrate([100, 50, 100]);
    msgEl.textContent = 'Game Over — Score: ' + score + '. Press Start to restart.';
  }

  function start() {
    if (running) return;
    reset();
    running = true;
    paused = false;
    loop();
  }

  function togglePause() {
    if (!running) return;
    paused = !paused;
    msgEl.textContent = paused ? 'Paused — press Space to resume' : 'Press Space to pause';
    draw();
  }

  function setDir(x, y) {
    if (!running && !paused) start();
    if (paused) return;
    if ((x !== 0 && dx === -x) || (y !== 0 && dy === -y)) return;
    dx = x;
    dy = y;
  }

  // UI controls
  document.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      togglePause();
      return;
    }
    switch (e.key) {
      case 'w': case 'W':
        e.preventDefault(); setDir(0, -grid); break;
      case 's': case 'S':
        e.preventDefault(); setDir(0, grid); break;
      case 'a': case 'A':
        e.preventDefault(); setDir(-grid, 0); break;
      case 'd': case 'D':
        e.preventDefault(); setDir(grid, 0); break;
    }
    if (settings.scrollLock) {
      switch (e.key) {
        case 'ArrowUp': e.preventDefault(); setDir(0, -grid); break;
        case 'ArrowDown': e.preventDefault(); setDir(0, grid); break;
        case 'ArrowLeft': e.preventDefault(); setDir(-grid, 0); break;
        case 'ArrowRight': e.preventDefault(); setDir(grid, 0); break;
      }
    }
  }, { passive: false });

  document.getElementById('up').addEventListener('click', () => setDir(0, -grid));
  document.getElementById('down').addEventListener('click', () => setDir(0, grid));
  document.getElementById('left').addEventListener('click', () => setDir(-grid, 0));
  document.getElementById('right').addEventListener('click', () => setDir(grid, 0));

  // Swipe
  let touchStartX = 0;
  let touchStartY = 0;
  canvas.addEventListener('touchstart', e => {
    if (!settings.swipe) return;
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  }, { passive: true });

  canvas.addEventListener('touchend', e => {
    if (!settings.swipe) return;
    const t = e.changedTouches[0];
    const dxSwipe = t.clientX - touchStartX;
    const dySwipe = t.clientY - touchStartY;
    const min = 30;
    if (Math.abs(dxSwipe) > Math.abs(dySwipe)) {
      if (dxSwipe > min) setDir(grid, 0);
      else if (dxSwipe < -min) setDir(-grid, 0);
    } else {
      if (dySwipe > min) setDir(0, grid);
      else if (dySwipe < -min) setDir(0, -grid);
    }
  }, { passive: true });

  document.getElementById('startBtn').addEventListener('click', () => {
    running = false;
    if (loopId) clearTimeout(loopId);
    start();
  });

  // Settings panel
  const themeSelect = document.getElementById('theme-select');
  const difficultySelect = document.getElementById('difficulty-select');
  const gridSelect = document.getElementById('grid-select');
  const wallsToggle = document.getElementById('walls-toggle');
  const gridToggle = document.getElementById('grid-toggle');
  const soundToggle = document.getElementById('sound-toggle');
  const swipeToggle = document.getElementById('swipe-toggle');
  const glowToggle = document.getElementById('glow-toggle');
  const borderToggle = document.getElementById('border-toggle');
  const dpadToggle = document.getElementById('dpad-toggle');
  const vibrateToggle = document.getElementById('vibrate-toggle');
  const pixelRainToggle = document.getElementById('pixel-rain-toggle');
  const noticesToggle = document.getElementById('notices-toggle');
  const controlsHintToggle = document.getElementById('controls-hint-toggle');
  const showScoreToggle = document.getElementById('show-score-toggle');
  const showHighScoreToggle = document.getElementById('show-highscore-toggle');
  const compactToggle = document.getElementById('compact-toggle');
  const scrollLockToggle = document.getElementById('scroll-lock-toggle');
  const scrollLockGameToggle = document.getElementById('scroll-lock-game');
  const speedSelect = document.getElementById('speed-select');
  const fullscreenBtn = document.getElementById('fullscreen-btn');

  function populateSettings() {
    themeSelect.value = settings.theme;
    difficultySelect.value = settings.difficulty;
    gridSelect.value = String(settings.grid);
    wallsToggle.checked = settings.walls;
    gridToggle.checked = settings.showGrid;
    soundToggle.checked = settings.sound;
    swipeToggle.checked = settings.swipe;
    glowToggle.checked = settings.glow;
    borderToggle.checked = settings.showBorder;
    dpadToggle.checked = settings.showDPad;
    vibrateToggle.checked = settings.vibrate;
    pixelRainToggle.checked = settings.pixelRain;
    noticesToggle.checked = settings.showNotices;
    controlsHintToggle.checked = settings.showControlsHint;
    showScoreToggle.checked = settings.showScore;
    showHighScoreToggle.checked = settings.showHighScore;
    compactToggle.checked = settings.compact;
    scrollLockToggle.checked = settings.scrollLock;
    scrollLockGameToggle.checked = settings.scrollLock;
    speedSelect.value = String(settings.speedMult);
  }

  function applySettings() {
    const oldGrid = settings.grid;
    settings.theme = themeSelect.value;
    settings.difficulty = difficultySelect.value;
    settings.grid = parseInt(gridSelect.value, 10);
    settings.walls = wallsToggle.checked;
    settings.showGrid = gridToggle.checked;
    settings.sound = soundToggle.checked;
    settings.swipe = swipeToggle.checked;
    settings.glow = glowToggle.checked;
    settings.showBorder = borderToggle.checked;
    settings.showDPad = dpadToggle.checked;
    settings.vibrate = vibrateToggle.checked;
    settings.pixelRain = pixelRainToggle.checked;
    settings.showNotices = noticesToggle.checked;
    settings.showControlsHint = controlsHintToggle.checked;
    settings.showScore = showScoreToggle.checked;
    settings.showHighScore = showHighScoreToggle.checked;
    settings.compact = compactToggle.checked;
    settings.scrollLock = scrollLockToggle.checked;
    settings.speedMult = parseFloat(speedSelect.value);
    saveSettings();
    updateSpeed();
    document.documentElement.classList.toggle('scroll-locked', settings.scrollLock);
    document.body.classList.toggle('no-glow', !settings.glow);
    document.body.classList.toggle('no-border', !settings.showBorder);
    document.body.classList.toggle('hide-dpad', !settings.showDPad);
    document.body.classList.toggle('no-pixel-rain', !settings.pixelRain);
    document.body.classList.toggle('hide-notices', !settings.showNotices);
    document.body.classList.toggle('hide-controls-hint', !settings.showControlsHint);
    document.body.classList.toggle('hide-score', !settings.showScore);
    document.body.classList.toggle('hide-highscore', !settings.showHighScore);
    document.body.classList.toggle('game-compact', settings.compact);
    if (settings.grid !== oldGrid) {
      if (loopId) clearTimeout(loopId);
      running = false;
      reset();
    }
    draw();
  }

  [themeSelect, difficultySelect, gridSelect, speedSelect].forEach(el => el.addEventListener('change', applySettings));
  [wallsToggle, gridToggle, soundToggle, swipeToggle, glowToggle, borderToggle, dpadToggle, vibrateToggle, pixelRainToggle, noticesToggle, controlsHintToggle, showScoreToggle, showHighScoreToggle, compactToggle, scrollLockToggle].forEach(el => el.addEventListener('change', applySettings));

  scrollLockGameToggle.addEventListener('change', () => {
    scrollLockToggle.checked = scrollLockGameToggle.checked;
    applySettings();
  });
  scrollLockToggle.addEventListener('change', () => {
    scrollLockGameToggle.checked = scrollLockToggle.checked;
  });

  fullscreenBtn.addEventListener('click', () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  });

  document.addEventListener('fullscreenchange', () => {
    fullscreenBtn.textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen';
  });

  document.getElementById('reset-highscore').addEventListener('click', () => {
    highScore = 0;
    highScoreEl.textContent = 'High Score: 0';
    try { localStorage.setItem(HIGHSCORE_KEY, '0'); } catch (e) {}
  });

  const settingsBtn = document.getElementById('settings-btn');
  const settingsOverlay = document.getElementById('settings-overlay');

  function setSettingsOpen(open) {
    settingsPanel.classList.toggle('open', open);
    settingsOverlay.classList.toggle('open', open);
    if (open) populateSettings();
  }

  function setHelpOpen(open) { helpModal.classList.toggle('open', open); helpOverlay.classList.toggle('open', open); }

  settingsBtn.addEventListener('click', e => {
    e.stopPropagation();
    const opening = !settingsPanel.classList.contains('open');
    setSettingsOpen(opening);
  });

  document.getElementById('settings-close').addEventListener('click', e => {
    e.stopPropagation();
    setSettingsOpen(false);
  });

  settingsOverlay.addEventListener('click', e => {
    e.stopPropagation();
    setSettingsOpen(false);
  });

  document.getElementById('open-help').addEventListener('click', () => setHelpOpen(true));
  document.getElementById('help-in-settings').addEventListener('click', () => { setSettingsOpen(false); setHelpOpen(true); });
  document.getElementById('help-close').addEventListener('click', () => setHelpOpen(false));
  helpOverlay.addEventListener('click', () => setHelpOpen(false));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (helpModal.classList.contains('open')) { setHelpOpen(false); return; }
      if (settingsPanel.classList.contains('open')) { setSettingsOpen(false); }
    }
  });

  loadHighScore();
  populateSettings();
  reset();
  applySettings();
})();
