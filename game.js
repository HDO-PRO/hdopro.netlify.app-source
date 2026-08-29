// HDO Pro Retro Snake Arcade
(function () {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('scoreBoard');
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
  let running = false;
  let loopId = null;

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

  function reset() {
    snake = [{ x: 7 * grid, y: 7 * grid }];
    dx = grid;
    dy = 0;
    score = 0;
    scoreEl.textContent = 'Score: ' + score;
    msgEl.textContent = 'Press Start or tap the D-pad';
    placeFood();
  }

  function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    for (let i = 0; i < tileCount; i++) {
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
    ctx.fillRect(food.x + 4, food.y + 4, grid - 8, grid - 8);

    // Snake
    snake.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? '#55ff55' : '#00ff00';
      ctx.fillRect(seg.x + 2, seg.y + 2, grid - 4, grid - 4);
      if (i === 0) {
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(seg.x + 2, seg.y + 2, grid - 4, grid - 4);
      }
    });
  }

  function update() {
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
      placeFood();
    } else {
      snake.pop();
    }
  }

  function loop() {
    if (!running) return;
    update();
    draw();
    loopId = setTimeout(() => requestAnimationFrame(loop), 115);
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
    loop();
  }

  function setDir(x, y) {
    if (!running) start();
    if ((x !== 0 && dx === -x) || (y !== 0 && dy === -y)) return;
    dx = x;
    dy = y;
  }

  document.addEventListener('keydown', e => {
    switch (e.key) {
      case 'ArrowUp': case 'w': case 'W': setDir(0, -grid); break;
      case 'ArrowDown': case 's': case 'S': setDir(0, grid); break;
      case 'ArrowLeft': case 'a': case 'A': setDir(-grid, 0); break;
      case 'ArrowRight': case 'd': case 'D': setDir(grid, 0); break;
    }
  });

  document.getElementById('up').addEventListener('click', () => setDir(0, -grid));
  document.getElementById('down').addEventListener('click', () => setDir(0, grid));
  document.getElementById('left').addEventListener('click', () => setDir(-grid, 0));
  document.getElementById('right').addEventListener('click', () => setDir(grid, 0));

  document.getElementById('startBtn').addEventListener('click', () => {
    running = false;
    if (loopId) clearTimeout(loopId);
    start();
  });

  reset();
  draw();
})();
