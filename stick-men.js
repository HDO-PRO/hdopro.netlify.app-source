// Stick men that walk and fool around at the bottom of the terminal page
(function () {
  'use strict';

  const canvas = document.getElementById('stick-men');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let w, h;
  const men = [];
  const STATES = ['walk', 'wave', 'jump', 'spin', 'sit', 'dance', 'moonwalk'];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = 80;
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
      this.y = h - 8 + (Math.random() * 10 - 5);
      this.scale = 0.55 + Math.random() * 0.35;
      this.speed = 0.5 + Math.random() * 0.9;
      this.direction = Math.random() > 0.5 ? 1 : -1;
      this.x = randomX ? Math.random() * w : (this.direction === 1 ? -40 : w + 40);
      this.state = 'walk';
      this.stateTimer = 0;
      this.nextStateIn = 90 + Math.random() * 160;
      this.phase = Math.random() * Math.PI * 2;
      this.color = getColor();
    }

    update() {
      this.phase += 0.18;
      this.stateTimer++;

      const moveFactor = this.state === 'walk' ? 1 : (this.state === 'jump' ? 0.4 : (this.state === 'moonwalk' ? 0.7 : 0.2));
      this.x += this.speed * this.direction * moveFactor;

      if (this.state === 'moonwalk') {
        this.x += this.speed * this.direction * 0.3;
      }

      if (this.stateTimer > this.nextStateIn) {
        this.stateTimer = 0;
        this.nextStateIn = 60 + Math.random() * 180;
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

      if (this.state === 'sit') {
        this.drawSitting(ctx, x, y, s);
        return;
      }

      let bob = 0;
      if (this.state === 'jump') bob = Math.abs(Math.sin(this.phase * 2)) * 18 * s;

      const headY = y - 30 * s - bob;
      const bodyY = y - 10 * s - bob;
      const armY = y - 18 * s - bob;

      ctx.beginPath();
      ctx.arc(x, headY, 5 * s, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, headY + 5 * s);
      ctx.lineTo(x, bodyY);
      ctx.stroke();

      // Legs
      this.drawLegs(ctx, x, bodyY, s);

      // Arms
      this.drawArms(ctx, x, armY, s);
    }

    drawLegs(ctx, x, bodyY, s) {
      if (this.state === 'spin') {
        const spin = this.phase * 4;
        ctx.beginPath();
        ctx.moveTo(x, bodyY);
        ctx.lineTo(x + Math.cos(spin) * 12 * s, bodyY + 12 * s);
        ctx.moveTo(x, bodyY);
        ctx.lineTo(x - Math.cos(spin) * 12 * s, bodyY + 12 * s);
        ctx.stroke();
        return;
      }

      if (this.state === 'moonwalk') {
        const slide = Math.sin(this.phase) * 10 * s;
        ctx.beginPath();
        ctx.moveTo(x, bodyY);
        ctx.lineTo(x + slide + 8 * s, bodyY + 18 * s);
        ctx.moveTo(x, bodyY);
        ctx.lineTo(x - slide - 4 * s, bodyY + 18 * s);
        ctx.stroke();
        return;
      }

      if (this.state === 'dance') {
        const kick = Math.sin(this.phase * 4) * 10 * s;
        ctx.beginPath();
        ctx.moveTo(x, bodyY);
        ctx.lineTo(x + kick, bodyY + 18 * s);
        ctx.moveTo(x, bodyY);
        ctx.lineTo(x - kick, bodyY + 18 * s);
        ctx.stroke();
        return;
      }

      const legSwing = this.state === 'walk' || this.state === 'moonwalk' ? Math.sin(this.phase) * 10 * s : 0;
      ctx.beginPath();
      ctx.moveTo(x, bodyY);
      ctx.lineTo(x - legSwing, bodyY + 18 * s);
      ctx.moveTo(x, bodyY);
      ctx.lineTo(x + legSwing, bodyY + 18 * s);
      ctx.stroke();
    }

    drawArms(ctx, x, armY, s) {
      if (this.state === 'wave') {
        const wave = Math.sin(this.phase * 4) * 12 * s;
        ctx.beginPath();
        ctx.moveTo(x, armY);
        ctx.lineTo(x + 12 * s, armY - 8 * s + wave);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, armY);
        ctx.lineTo(x - 10 * s, armY + 8 * s);
        ctx.stroke();
        return;
      }

      if (this.state === 'spin') {
        const spin = this.phase * 4;
        ctx.beginPath();
        ctx.moveTo(x, armY);
        ctx.lineTo(x + Math.sin(spin) * 12 * s, armY - 8 * s);
        ctx.moveTo(x, armY);
        ctx.lineTo(x - Math.sin(spin) * 12 * s, armY - 8 * s);
        ctx.stroke();
        return;
      }

      if (this.state === 'dance') {
        const armWave = Math.sin(this.phase * 4) * 14 * s;
        ctx.beginPath();
        ctx.moveTo(x, armY);
        ctx.lineTo(x + armWave, armY - 12 * s);
        ctx.moveTo(x, armY);
        ctx.lineTo(x - armWave, armY - 12 * s);
        ctx.stroke();
        return;
      }

      const armSwing = this.state === 'walk' || this.state === 'moonwalk' ? Math.cos(this.phase) * 8 * s : 0;
      ctx.beginPath();
      ctx.moveTo(x, armY);
      ctx.lineTo(x - 10 * s - armSwing, armY + 8 * s);
      ctx.moveTo(x, armY);
      ctx.lineTo(x + 10 * s + armSwing, armY + 8 * s);
      ctx.stroke();
    }

    drawSitting(ctx, x, y, s) {
      const headY = y - 22 * s;
      const bodyY = y - 6 * s;
      ctx.beginPath();
      ctx.arc(x, headY, 5 * s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, headY + 5 * s);
      ctx.lineTo(x, bodyY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, bodyY);
      ctx.lineTo(x + 14 * s, bodyY);
      ctx.lineTo(x + 18 * s, bodyY + 6 * s);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, bodyY);
      ctx.lineTo(x + 12 * s, bodyY - 10 * s);
      ctx.moveTo(x, bodyY);
      ctx.lineTo(x - 12 * s, bodyY - 2 * s);
      ctx.stroke();
    }
  }

  for (let i = 0; i < 4; i++) men.push(new StickMan());

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
