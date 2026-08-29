// Pixel creature swarm for the HDO Pro index/landing page
(function () {
  'use strict';

  const canvas = document.getElementById('hdo-pixels');
  if (!canvas) return;

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasReducedClass = document.documentElement.classList.contains('hdo-reduced-motion');
  if (prefersReduced || hasReducedClass) {
    canvas.style.display = 'none';
    return;
  }
  const ctx = canvas.getContext('2d');
  let w, h;
  const creatures = [];
  const palette = ['#ff66b2', '#ff99cc', '#8d2249', '#ffffff'];
  const mouse = { x: -1000, y: -1000, active: false };
  let targets = [];
  let tick = 0;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = false;
  }

  function collectTargets() {
    const selectors = [
      '.sign-in a',
      '.community-bar a',
      '.community-bar span.offline',
      '.container',
      '.dmca-notice',
      '.friends-notice',
      '.community-bar'
    ];
    const list = [];
    selectors.forEach(function (s) {
      document.querySelectorAll(s).forEach(function (el) {
        const r = el.getBoundingClientRect();
        list.push({ x: r.left, y: r.top, w: r.width, h: r.height });
      });
    });
    return list;
  }

  function Creature(x, y) {
    this.x = x !== undefined ? x : Math.random() * w;
    this.y = y !== undefined ? y : Math.random() * h;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = (Math.random() - 0.5) * 2;
    this.size = 3 + Math.random() * 4;
    this.color = palette[Math.floor(Math.random() * palette.length)];
    this.phase = Math.random() * Math.PI * 2;
    this.state = 'wander';
    this.rest = 0;
  }

  Creature.prototype.update = function () {
    this.phase += 0.1;
    if (this.rest > 0) { this.rest--; return; }

    // Mouse interaction: flee from cursor
    const dx = this.x - mouse.x;
    const dy = this.y - mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 90 && mouse.active) {
      this.state = 'flee';
      this.vx += dx / dist * 0.7;
      this.vy += dy / dist * 0.7;
    } else {
      this.state = 'wander';
      this.vx += (Math.random() - 0.5) * 0.25;
      this.vy += (Math.random() - 0.5) * 0.25;
      this.vx *= 0.99;
      this.vy *= 0.99;
    }

    // Interact with windows, walls and buttons
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      if (
        this.x > t.x - this.size &&
        this.x < t.x + t.w + this.size &&
        this.y > t.y - this.size &&
        this.y < t.y + t.h + this.size
      ) {
        this.state = 'climb';
        this.color = '#ff99cc';
        const left = this.x - t.x;
        const right = t.x + t.w - this.x;
        const top = this.y - t.y;
        const bottom = t.y + t.h - this.y;
        const min = Math.min(left, right, top, bottom);
        if (min === left) { this.x = t.x - this.size; this.vx = -Math.abs(this.vx || 1); }
        else if (min === right) { this.x = t.x + t.w + this.size; this.vx = Math.abs(this.vx || 1); }
        else if (min === top) { this.y = t.y - this.size; this.vy = -Math.abs(this.vy || 1); }
        else { this.y = t.y + t.h + this.size; this.vy = Math.abs(this.vy || 1); }
        this.rest = 6 + Math.random() * 12;
        break;
      }
    }

    this.x += this.vx;
    this.y += this.vy;

    // Screen bounds (walls)
    if (this.x < 0) { this.x = 0; this.vx = Math.abs(this.vx); this.state = 'wall'; this.color = '#ffffff'; }
    if (this.x > w) { this.x = w; this.vx = -Math.abs(this.vx); this.state = 'wall'; this.color = '#ffffff'; }
    if (this.y < 0) { this.y = 0; this.vy = Math.abs(this.vy); this.state = 'wall'; this.color = '#ffffff'; }
    if (this.y > h) { this.y = h; this.vy = -Math.abs(this.vy); this.state = 'wall'; this.color = '#ffffff'; }

    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > 4) { this.vx *= 0.95; this.vy *= 0.95; }
    if (speed < 0.2) { this.vx += (Math.random() - 0.5); this.vy += (Math.random() - 0.5); }
  };

  Creature.prototype.draw = function () {
    const pulse = Math.sin(this.phase) * 0.4 + 1;
    const ps = Math.max(1, Math.floor(this.size * pulse));
    ctx.fillStyle = this.color;
    ctx.globalAlpha = 0.9;
    // pixel blob body (3 blocks)
    ctx.fillRect(Math.floor(this.x), Math.floor(this.y), ps, ps);
    ctx.fillRect(Math.floor(this.x + ps), Math.floor(this.y), ps, ps);
    ctx.fillRect(Math.floor(this.x), Math.floor(this.y + ps), ps, ps);
    // simple eye
    ctx.fillStyle = '#000';
    ctx.globalAlpha = 0.7;
    ctx.fillRect(Math.floor(this.x + ps * 0.5), Math.floor(this.y + ps * 0.2), Math.max(1, Math.floor(ps * 0.3)), Math.max(1, Math.floor(ps * 0.3)));
    ctx.globalAlpha = 1;
  };

  function init() {
    resize();
    targets = collectTargets();
    for (let i = 0; i < 50; i++) creatures.push(new Creature());

    window.addEventListener('resize', function () { resize(); targets = collectTargets(); });
    window.addEventListener('scroll', function () { targets = collectTargets(); });
    window.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; });
    window.addEventListener('mouseout', function () { mouse.active = false; });
    window.addEventListener('click', function (e) {
      for (let i = 0; i < 8; i++) {
        const c = new Creature(e.clientX, e.clientY);
        c.vx = (Math.random() - 0.5) * 8;
        c.vy = (Math.random() - 0.5) * 8;
        c.color = '#ff66b2';
        creatures.push(c);
      }
      if (creatures.length > 120) creatures.splice(0, creatures.length - 120);
    });

    loop();
  }

  function loop() {
    tick++;
    if (tick % 5 === 0) targets = collectTargets();
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < creatures.length; i++) {
      creatures[i].update();
      creatures[i].draw();
    }
    requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
