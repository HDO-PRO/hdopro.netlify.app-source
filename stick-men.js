// Stick men that walk and fool around at the bottom of the terminal page
(function () {
  'use strict';

  const canvas = document.getElementById('stick-men');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let w, h;
  const men = [];
  const STATES = ['walk', 'wave', 'jump', 'sit', 'spin'];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = 110;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  function getColor() {
    const root = getComputedStyle(document.documentElement);
    const c = root.getPropertyValue('--term-prompt').trim();
    return c || '#00ff00';
  }

  class StickMan {
    constructor() {
      this.reset(true);
    }

    reset(randomX) {
      this.y = h - 10 + (Math.random() * 10 - 5);
      this.scale = 0.7 + Math.random() * 0.5;
      this.speed = 0.4 + Math.random() * 0.8;
      this.direction = Math.random() > 0.5 ? 1 : -1;
      this.x = randomX ? Math.random() * w : (this.direction === 1 ? -40 : w + 40);
      this.state = 'walk';
      this.stateTimer = 0;
      this.nextStateIn = 120 + Math.random() * 180;
      this.phase = Math.random() * Math.PI * 2;
      this.color = getColor();
    }

    update() {
      this.phase += 0.15;
      this.stateTimer++;

      if (this.state === 'walk') {
        this.x += this.speed * this.direction;
      } else if (this.state === 'jump') {
        this.x += this.speed * this.direction * 0.5;
      } else if (this.state === 'spin') {
        this.x += this.speed * this.direction * 0.3;
      }

      if (this.stateTimer > this.nextStateIn) {
        this.stateTimer = 0;
        this.nextStateIn = 80 + Math.random() * 200;
        const pick = STATES[Math.floor(Math.random() * STATES.length)];
        this.state = pick;
      }

      if (this.x > w + 60 && this.direction === 1) this.reset(false);
      if (this.x < -60 && this.direction === -1) this.reset(false);
    }

    draw(ctx, color) {
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2.5 * this.scale;

      const x = this.x;
      const y = this.y;
      const s = this.scale;

      // Jump bob
      let bob = 0;
      if (this.state === 'jump') bob = Math.abs(Math.sin(this.phase * 2)) * 20 * s;
      if (this.state === 'sit') {
        this.drawSitting(ctx, x, y, s);
        return;
      }

      const headY = y - 35 * s - bob;
      const bodyY = y - 10 * s - bob;
      const armY = y - 22 * s - bob;

      ctx.beginPath();
      ctx.arc(x, headY, 6 * s, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, headY + 6 * s);
      ctx.lineTo(x, bodyY);
      ctx.stroke();

      // legs
      const legSwing = this.state === 'walk' ? Math.sin(this.phase) * 12 * s : 0;
      if (this.state === 'spin') {
        const spin = this.phase * 4;
        ctx.beginPath();
        ctx.moveTo(x, bodyY);
        ctx.lineTo(x + Math.cos(spin) * 14 * s, bodyY + 12 * s);
        ctx.moveTo(x, bodyY);
        ctx.lineTo(x - Math.cos(spin) * 14 * s, bodyY + 12 * s);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(x, bodyY);
        ctx.lineTo(x - legSwing, bodyY + 20 * s);
        ctx.moveTo(x, bodyY);
        ctx.lineTo(x + legSwing, bodyY + 20 * s);
        ctx.stroke();
      }

      // arms
      if (this.state === 'wave') {
        const wave = Math.sin(this.phase * 3) * 15 * s;
        ctx.beginPath();
        ctx.moveTo(x, armY);
        ctx.lineTo(x + 14 * s, armY - 10 * s + wave);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, armY);
        ctx.lineTo(x - 12 * s, armY + 10 * s);
        ctx.stroke();
      } else if (this.state === 'spin') {
        const spin = this.phase * 4;
        ctx.beginPath();
        ctx.moveTo(x, armY);
        ctx.lineTo(x + Math.sin(spin) * 14 * s, armY - 8 * s);
        ctx.moveTo(x, armY);
        ctx.lineTo(x - Math.sin(spin) * 14 * s, armY - 8 * s);
        ctx.stroke();
      } else {
        const armSwing = this.state === 'walk' ? Math.cos(this.phase) * 10 * s : 0;
        ctx.beginPath();
        ctx.moveTo(x, armY);
        ctx.lineTo(x - 12 * s - armSwing, armY + 10 * s);
        ctx.moveTo(x, armY);
        ctx.lineTo(x + 12 * s + armSwing, armY + 10 * s);
        ctx.stroke();
      }
    }

    drawSitting(ctx, x, y, s) {
      const headY = y - 25 * s;
      const bodyY = y - 5 * s;
      ctx.beginPath();
      ctx.arc(x, headY, 6 * s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, headY + 6 * s);
      ctx.lineTo(x, bodyY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, bodyY);
      ctx.lineTo(x + 15 * s, bodyY);
      ctx.lineTo(x + 22 * s, bodyY + 8 * s);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, bodyY);
      ctx.lineTo(x + 15 * s, bodyY - 12 * s);
      ctx.moveTo(x, bodyY);
      ctx.lineTo(x - 15 * s, bodyY - 2 * s);
      ctx.stroke();
    }
  }

  for (let i = 0; i < 3; i++) men.push(new StickMan());

  function loop() {
    const color = getColor();
    ctx.clearRect(0, 0, w, h);
    men.forEach(man => {
      man.update();
      man.draw(ctx, color);
    });
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', resize);
  resize();
  loop();
})();
