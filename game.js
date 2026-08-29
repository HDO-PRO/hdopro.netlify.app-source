// HDO Pro Retro Snake Arcade
(function () {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('scoreBoard');
  const highScoreEl = document.getElementById('highScoreBoard');
  const msgEl = document.getElementById('gameMsg');

  const grid = 20;
  const tileCount = 16; // 320 / 20
  canvas.width = grid * tileCount;
  canvas.height = grid * tileCount;

  let snake = [{ x: 7 * grid, y: 7 * grid }];
  let dx = grid;
  let dy = 0;
  let food = { x: 12 * grid, y: 10 * grid };
  let score = 0;
  let highScore = 0;
  let running = false;
  let paused = false;
  let loopId = null;
  let baseSpeed = 130;
  let currentSpeed = baseSpeed;

  try {
    highScore = parseInt(localStorage.getItem('hdoArcadeHighScore') || '0', 10) || 0;
  } catch (e) {
    highScore = 0;
  }
  highScoreEl.textContent = 'High Score: ' + highScore;

  function rand() {
    return Math.floor(Math.random() * tileCount) * grid;
  }

  function placeFood() {
    let x, y;
    do {
      x = rand();
      y = rand();
    } while (snake.some(s => s.x === x && s.y === y));
    food = { x, y };
  }

  function updateSpeed() {
    const levels = Math.floor(score / 50);
    currentSpeed = Math.max(45, baseSpeed - (levels * 12));
  }

  function reset() {
    snake = [{ x: 7 * grid, y: 7 * grid }];
    dx = grid;
    dy = 0;
    score = 0;
    currentSpeed = baseSpeed;
    scoreEl.textContent = 'Score: ' + score;
    msgEl.textContent = 'Press Start or tap the D-pad / swipe';
    placeFood();
    updateSpeed();
  }

  function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = '#222';
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

    // Food
    ctx.fillStyle = '#ff66b2';
    ctx.shadowColor = '#ff66b2';
    ctx.shadowBlur = 10;
    ctx.fillRect(food.x + 4, food.y + 4, grid - 8, grid - 8);
    ctx.shadowBlur = 0;

    // Snake
    snake.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? '#55ff55' : '#00ff00';
      ctx.fillRect(seg.x + 2, seg.y + 2, grid - 4, grid - 4);
      if (i === 0) {
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(seg.x + 2, seg.y + 2, grid - 4, grid - 4);
      }
    });

    if (paused) {
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff66b2';
      ctx.font = 'bold 28px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }
  }

  function update() {
    if (paused) return;

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // Wall or self collision
    if (
      head.x < 0 || head.x >= canvas.width ||
      head.y < 0 || head.y >= canvas.height ||
      snake.some(s => s.x === head.x && s.y === head.y)
    ) {
      gameOver();
      return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score += 10;
      scoreEl.textContent = 'Score: ' + score;
      if (score > highScore) {
        highScore = score;
        highScoreEl.textContent = 'High Score: ' + highScore;
        try { localStorage.setItem('hdoArcadeHighScore', highScore); } catch (e) {}
      }
      updateSpeed();
      placeFood();
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
    if (!running && !paused) { start(); }
    if (paused) return;
    if ((x !== 0 && dx === -x) || (y !== 0 && dy === -y)) return;
    dx = x;
    dy = y;
  }

  // Keyboard controls
  document.addEventListener('keydown', e => {
    switch (e.key) {
      case 'ArrowUp': case 'w': case 'W': setDir(0, -grid); break;
      case 'ArrowDown': case 's': case 'S': setDir(0, grid); break;
      case 'ArrowLeft': case 'a': case 'A': setDir(-grid, 0); break;
      case 'ArrowRight': case 'd': case 'D': setDir(grid, 0); break;
      case ' ': case 'p': case 'P':
        e.preventDefault();
        togglePause();
        break;
    }
  });

  // D-pad
  document.getElementById('up').addEventListener('click', () => setDir(0, -grid));
  document.getElementById('down').addEventListener('click', () => setDir(0, grid));
  document.getElementById('left').addEventListener('click', () => setDir(-grid, 0));
  document.getElementById('right').addEventListener('click', () => setDir(grid, 0));

  // Swipe controls on canvas
  let touchStartX = 0;
  let touchStartY = 0;
  canvas.addEventListener('touchstart', e => {
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  }, { passive: true });

  canvas.addEventListener('touchend', e => {
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

  reset();
  draw();
})();
