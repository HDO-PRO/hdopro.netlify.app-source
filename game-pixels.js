// Retro pixel rain for the HDO Pro arcade game
(function () {
  'use strict';

  const canvas = document.getElementById('game-pixels');
  if (!canvas) return;

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasReducedClass = document.documentElement.classList.contains('hdo-reduced-motion');
  if (prefersReduced || hasReducedClass) {
    canvas.style.display = 'none';
    return;
  }

  const ctx = canvas.getContext('2d');
  let w, h;
  const pixels = [];
  const palette = ['#ff66b2', '#00ff00', '#00ffff', '#ffffff', '#ffff00'];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = false;
  }

  function Pixel() {
    this.reset(true);
  }

  Pixel.prototype.reset = function (randomY) {
    this.x = Math.random() * w;
    this.y = randomY ? Math.random() * h : -Math.random() * h;
    this.size = 2 + Math.floor(Math.random() * 3);
    this.speed = 0.5 + Math.random() * 2.5;
    this.color = palette[Math.floor(Math.random() * palette.length)];
    this.alpha = 0.4 + Math.random() * 0.6;
    this.twinkle = Math.random() * Math.PI * 2;
    this.twinkleSpeed = 0.03 + Math.random() * 0.05;
    this.drift = (Math.random() - 0.5) * 0.5;
  };

  Pixel.prototype.update = function () {
    this.y += this.speed;
    this.x += this.drift;
    this.twinkle += this.twinkleSpeed;
    if (this.y > h) this.reset(false);
    if (this.x < -this.size) this.x = w + this.size;
    if (this.x > w + this.size) this.x = -this.size;
  };

  Pixel.prototype.draw = function () {
    const a = this.alpha * (0.6 + 0.4 * Math.sin(this.twinkle));
    ctx.globalAlpha = Math.max(0.1, a);
    ctx.fillStyle = this.color;
    const x = Math.floor(this.x);
    const y = Math.floor(this.y);
    ctx.fillRect(x, y, this.size, this.size);
    if (this.size > 3) {
      ctx.globalAlpha = Math.max(0.05, a * 0.5);
      ctx.fillRect(x - 1, y - 1, this.size + 2, this.size + 2);
    }
    ctx.globalAlpha = 1;
  };

  function init() {
    resize();
    const isMobile = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const count = isMobile ? 35 : 80;
    for (let i = 0; i < count; i++) pixels.push(new Pixel());

    window.addEventListener('resize', function () { resize(); });
    loop();
  }

  function loop() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < pixels.length; i++) {
      pixels[i].update();
      pixels[i].draw();
    }
    requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
