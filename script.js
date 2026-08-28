(function () {
  'use strict';

  if (window.__hdoUIInitialized) return;
  window.__hdoUIInitialized = true;

  const isIndex = /index\.html$/i.test(location.pathname) || location.pathname === '/' || location.pathname === '';

  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
  });

  // Register service worker on every page
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, error => {
          console.log('ServiceWorker registration failed: ', error);
        });
    });
  }

  // Run security before anything else
  initSecurity();

  // UI injection is skipped in completeInit() when on the index/landing page

  const config = {
    navLinks: [
      { href: '/home', label: 'Home', icon: 'fa-house' },
      { href: '/about', label: 'About', icon: 'fa-circle-info' },
      { href: '/downloads', label: 'Downloads', icon: 'fa-download' },
      { href: '/releases', label: 'Releases', icon: 'fa-clipboard-list' },
      { href: '/status', label: 'Status', icon: 'fa-signal' },
      { href: '/faq', label: 'FAQ', icon: 'fa-circle-question' },
      { href: '/guide', label: 'Guide', icon: 'fa-book' },
      { href: '/tutorial', label: 'Tutorial', icon: 'fa-graduation-cap' },
      { href: '/rules', label: 'Rules', icon: 'fa-scale-balanced' },
      { href: '/support', label: 'Support', icon: 'fa-life-ring' },
      { href: '/contact', label: 'Contact', icon: 'fa-envelope' },
      { href: '/invite', label: 'Community', icon: 'fa-users' },
      { href: '/donate', label: 'Donate', icon: 'fa-heart' },
      { href: 'https://github.com/HDO-PRO', label: 'GitHub', icon: 'fa-github', external: true },
      { id: 'pwa-install', label: 'Install', icon: 'fa-mobile-screen', action: 'install' }
    ]
  };

  const STORAGE_KEY = 'hdo-ui-settings';
  const saved = (function tryParse(s) {
    try { return JSON.parse(s); } catch { return null; }
  })(localStorage.getItem(STORAGE_KEY));

  const state = Object.assign({
    'reduced-motion': false,
    'high-contrast': false,
    'large-text': false
  }, saved || {});

  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

  function applySettings() {
    document.documentElement.classList.toggle('hdo-reduced-motion', state['reduced-motion']);
    document.documentElement.classList.toggle('hdo-high-contrast', state['high-contrast']);
    document.documentElement.classList.toggle('hdo-large-text', state['large-text']);
    document.body.style.fontSize = state['large-text'] ? '112%' : '';
  }

  function initSecurity() {
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('copy', e => e.preventDefault());
    document.addEventListener('cut', e => e.preventDefault());
    document.addEventListener('paste', e => e.preventDefault());
    document.addEventListener('selectstart', e => e.preventDefault());
    document.addEventListener('keydown', e => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && ['u','s','c','i','j'].includes(e.key))
      ) {
        e.preventDefault();
      }
    });
    function detectDevTools() {
      const threshold = 160;
      if (window.outerWidth - window.innerWidth > threshold || window.outerHeight - window.innerHeight > threshold) {
        console.warn('DevTools detected');
      }
    }
    setInterval(detectDevTools, 1000);
  }

  function setSetting(id, value) {
    state[id] = value;
    save();
    applySettings();
  }

  function createEl(tag, attrs, text) {
    const el = document.createElement(tag);
    if (attrs) {
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    }
    if (text) el.textContent = text;
    return el;
  }

  function ensureIcons() {
    if (document.querySelector('link[href*="font-awesome"]')) return;
    const link = createEl('link', {
      rel: 'stylesheet',
      href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
    });
    document.head.appendChild(link);
  }

  function injectStyles() {
    if (document.getElementById('hdo-ui-styles')) return;
    const style = createEl('style', { id: 'hdo-ui-styles' });
    style.textContent = `
      .hdo-ui-fab {
        position: fixed;
        bottom: 24px;
        width: 52px;
        height: 52px;
        border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: var(--hdo-glass);
        color: #fff;
        box-shadow: 0 6px 24px rgba(0,0,0,0.5);
        cursor: pointer;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        backdrop-filter: blur(8px);
        transition: transform .25s ease, box-shadow .25s ease, background .25s ease;
      }
      .hdo-ui-fab:hover { transform: translateY(-3px) scale(1.05); box-shadow: 0 8px 28px rgba(0,0,0,0.6); background: rgba(255,255,255,0.08); }
      .hdo-ui-fab:active { transform: scale(0.95); }
      #hdo-menu-btn { left: 24px; }
      #hdo-settings-btn { right: 24px; }

      .hdo-ui-panel {
        position: fixed;
        top: 0;
        height: 100%;
        width: min(320px, 85vw);
        max-width: 420px;
        background: var(--hdo-glass);
        color: #fff;
        backdrop-filter: blur(10px);
        box-shadow: 0 0 40px rgba(0,0,0,0.6);
        z-index: 10001;
        padding: 28px;
        box-sizing: border-box;
        transform: translateX(-100%);
        opacity: 0;
        transition: transform .35s cubic-bezier(.4,.0,.2,1), opacity .3s;
        overflow-y: auto;
      }
      #hdo-nav-panel { left: 0; }
      #hdo-settings-panel { right: 0; transform: translateX(100%); }
      .hdo-ui-panel.open { transform: translateX(0); opacity: 1; }
      .hdo-ui-panel h2 { margin: 0 0 22px; font-size: 22px; color: #ff66b2; }
      .hdo-ui-panel .close { position: absolute; top: 18px; right: 22px; background: none; border: none; color: #fff; font-size: 28px; cursor: pointer; line-height: 1; }

      .hdo-ui-navlist { list-style: none; padding: 0; margin: 0; }
      .hdo-ui-navlist li { margin: 14px 0; }
      .hdo-ui-navlist a { color: #fff; text-decoration: none; display: flex; align-items: center; gap: 14px; padding: 11px 14px; border-radius: 10px; transition: background .2s, color .2s, transform .15s; }
      .hdo-ui-navlist a:hover { background: rgba(255,255,255,0.1); color: #ff66b2; transform: translateX(4px); }
      .hdo-ui-navlist i { width: 22px; text-align: center; }

      .hdo-ui-setting { display: flex; justify-content: space-between; align-items: center; margin: 16px 0; padding: 14px; background: rgba(255,255,255,0.05); border-radius: 10px; }
      .hdo-ui-setting label { font-size: 15px; }
      .hdo-ui-toggle { position: relative; width: 44px; height: 24px; background: rgba(255,255,255,0.2); border-radius: 24px; border: none; cursor: pointer; transition: background .2s; }
      .hdo-ui-toggle::after { content: ''; position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; background: #fff; border-radius: 50%; transition: transform .2s; }
      .hdo-ui-toggle[aria-checked="true"] { background: #ff66b2; }
      .hdo-ui-toggle[aria-checked="true"]::after { transform: translateX(20px); }

      .hdo-ui-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999; opacity: 0; pointer-events: none; transition: opacity .3s; }
      .hdo-ui-overlay.open { opacity: 1; pointer-events: auto; }

      .hdo-ui-backtotop { position: fixed; bottom: 90px; right: 24px; width: 44px; height: 44px; border-radius: 50%; border: none; background: #ff66b2; color: #fff; display: none; align-items: center; justify-content: center; cursor: pointer; z-index: 10000; box-shadow: 0 4px 16px rgba(0,0,0,0.4); transition: transform .2s, background .2s; }
      .hdo-ui-backtotop.visible { display: flex; }
      .hdo-ui-backtotop:hover { transform: translateY(-2px); background: #e05599; }

      .hdo-reduced-motion *, .hdo-reduced-motion *::before, .hdo-reduced-motion *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
      .hdo-high-contrast { filter: contrast(1.15); }

      @media (max-width: 480px) {
        .hdo-ui-fab { width: 46px; height: 46px; bottom: 18px; font-size: 18px; }
        #hdo-menu-btn { left: 18px; }
        #hdo-settings-btn { right: 18px; }
        .hdo-ui-backtotop { right: 18px; }
      }
    `;
    document.head.appendChild(style);
  }

  function promptInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(choice => {
        if (choice.outcome === 'accepted') {
          console.log('PWA installed');
        }
        deferredPrompt = null;
      });
    } else {
      console.log('PWA install prompt not available.');
    }
  }

  function buildUI() {
    injectStyles();
    ensureIcons();

    const overlay = createEl('div', { id: 'hdo-ui-overlay', class: 'hdo-ui-overlay' });
    overlay.addEventListener('click', closeAll);
    document.body.appendChild(overlay);

    const menuBtn = createEl('button', { id: 'hdo-menu-btn', class: 'hdo-ui-fab', 'aria-label': 'Open navigation menu' });
    menuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
    menuBtn.addEventListener('click', () => togglePanel('nav'));
    document.body.appendChild(menuBtn);

    const settingsBtn = createEl('button', { id: 'hdo-settings-btn', class: 'hdo-ui-fab', 'aria-label': 'Open settings' });
    settingsBtn.innerHTML = '<i class="fa-solid fa-gear"></i>';
    settingsBtn.addEventListener('click', () => togglePanel('settings'));
    document.body.appendChild(settingsBtn);

    const navPanel = createEl('aside', { id: 'hdo-nav-panel', class: 'hdo-ui-panel', 'aria-label': 'Navigation menu' });
    navPanel.innerHTML = '<button class="close" aria-label="Close navigation">&times;</button><h2>Menu</h2>';
    navPanel.querySelector('.close').addEventListener('click', () => togglePanel('nav', false));
    const navList = createEl('ul', { class: 'hdo-ui-navlist' });
    config.navLinks.forEach(link => {
      const li = createEl('li');
      const a = createEl('a', Object.assign({ href: link.href || 'javascript:void(0)' }, link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {}));
      a.innerHTML = `<i class="fa-solid ${link.icon}"></i> <span>${link.label}</span>`;
      if (link.action === 'install') {
        a.addEventListener('click', e => {
          e.preventDefault();
          togglePanel('nav', false);
          promptInstall();
        });
      } else {
        a.addEventListener('click', () => togglePanel('nav', false));
      }
      li.appendChild(a);
      navList.appendChild(li);
    });
    navPanel.appendChild(navList);
    document.body.appendChild(navPanel);

    const settingsPanel = createEl('aside', { id: 'hdo-settings-panel', class: 'hdo-ui-panel', 'aria-label': 'Settings' });
    settingsPanel.innerHTML = '<button class="close" aria-label="Close settings">&times;</button><h2>Settings</h2>';
    settingsPanel.querySelector('.close').addEventListener('click', () => togglePanel('settings', false));

    const settingsDefs = [
      { id: 'reduced-motion', label: 'Reduced motion' },
      { id: 'high-contrast', label: 'High contrast' },
      { id: 'large-text', label: 'Large text' }
    ];

    settingsDefs.forEach(setting => {
      const row = createEl('div', { class: 'hdo-ui-setting' });
      const label = createEl('label', { for: `hdo-setting-${setting.id}` }, setting.label);
      const toggle = createEl('button', {
        id: `hdo-setting-${setting.id}`,
        class: 'hdo-ui-toggle',
        role: 'switch',
        'aria-checked': String(state[setting.id]),
        'aria-label': setting.label
      });
      toggle.addEventListener('click', () => {
        const next = toggle.getAttribute('aria-checked') !== 'true';
        toggle.setAttribute('aria-checked', String(next));
        setSetting(setting.id, next);
      });
      row.appendChild(label);
      row.appendChild(toggle);
      settingsPanel.appendChild(row);
    });

    const resetBtn = createEl('button', { style: 'width:100%;margin-top:18px;padding:10px;border-radius:8px;border:none;background:#ff66b2;color:#fff;cursor:pointer;' }, 'Reset all settings');
    resetBtn.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    });
    settingsPanel.appendChild(resetBtn);
    document.body.appendChild(settingsPanel);

    const backToTop = createEl('button', { id: 'hdo-back-to-top', class: 'hdo-ui-backtotop', 'aria-label': 'Back to top' });
    backToTop.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    document.body.appendChild(backToTop);

    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 300);
    }, { passive: true });
  }

  function togglePanel(name, force) {
    const nav = document.getElementById('hdo-nav-panel');
    const settings = document.getElementById('hdo-settings-panel');
    const overlay = document.getElementById('hdo-ui-overlay');

    if (force !== undefined) {
      if (name === 'nav') nav.classList.toggle('open', force);
      if (name === 'settings') settings.classList.toggle('open', force);
    } else {
      if (name === 'nav') nav.classList.toggle('open');
      if (name === 'settings') settings.classList.toggle('open');
    }

    const anyOpen = nav.classList.contains('open') || settings.classList.contains('open');
    overlay.classList.toggle('open', anyOpen);
    document.body.style.overflow = anyOpen ? 'hidden' : '';
  }

  function closeAll() {
    togglePanel('nav', false);
    togglePanel('settings', false);
  }

  function init() {
    initPuzzle();
  }

  function completeInit() {
    applySettings();
    if (!isIndex) buildUI();
    // Staggered page entrance for glass containers
    const glass = document.querySelectorAll('.container, .box, .app-container, .announcement-container, .discord-container, .contact-container, .password-container, .feature, .notification, .modal-content, .side-menu, .hero, #download-hdo-pro, .dmca-notice, .github-icon, .hdo-glass');
    glass.forEach(function (el, i) {
      if (!el.classList.contains('hdo-animate-fade')) {
        el.style.animationDelay = (i * 60) + 'ms';
        el.classList.add('hdo-animate-fade');
      }
    });
    const firstContainer = document.querySelector('body > div, body > section, body > main');
    if (firstContainer && !firstContainer.classList.contains('hdo-animate-fade')) {
      firstContainer.classList.add('hdo-animate-fade');
    }
  }

  function injectPuzzleStyles() {
    if (document.getElementById('hdo-puzzle-styles')) return;
    const style = createEl('style', { id: 'hdo-puzzle-styles' });
    style.textContent = `
      .hdo-puzzle-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.96); z-index: 99998; display: flex; align-items: center; justify-content: center; padding: 20px; }
      .hdo-puzzle-box { background: var(--hdo-glass); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 28px; max-width: 420px; width: 100%; text-align: center; -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); box-shadow: 0 20px 60px rgba(0,0,0,0.6); }
      .hdo-puzzle-box h2 { margin: 0 0 16px; color: #ff66b2; font-size: 22px; }
      .hdo-puzzle-hint { color: #ccc; font-size: 13px; margin: 0 0 10px; }
      .hdo-puzzle-question { font-size: 18px; margin: 16px 0; color: #fff; }
      .hdo-puzzle-input { width: 100%; padding: 12px; margin: 16px 0 20px; border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; background: rgba(0,0,0,0.5); color: #fff; font-size: 16px; text-align: center; box-sizing: border-box; }
      .hdo-puzzle-input:focus { outline: 2px solid #ff66b2; }
      .hdo-puzzle-submit { background: #ff66b2; color: #fff; border: none; padding: 12px 24px; border-radius: 10px; cursor: pointer; font-size: 16px; width: 100%; }
      .hdo-puzzle-submit:hover { background: #e05599; }
      .hdo-puzzle-error { color: #ff6666; font-size: 13px; min-height: 18px; margin: 12px 0 0; }
      .hdo-puzzle-text { font-size: 14px; line-height: 1.5; color: #ddd; text-align: left; margin: 0 0 20px; }
      @media (max-width: 480px) {
        .hdo-puzzle-box { padding: 20px; border-radius: 12px; }
        .hdo-puzzle-box h2 { font-size: 20px; }
        .hdo-puzzle-question { font-size: 16px; }
        .hdo-puzzle-text { font-size: 13px; }
      }
    `;
    document.head.appendChild(style);
  }

  function initPuzzle() {
    if (localStorage.getItem('hdo-verified') === 'true') {
      completeInit();
      return;
    }
    injectPuzzleStyles();

    const overlay = createEl('div', { id: 'hdo-puzzle-overlay', class: 'hdo-puzzle-overlay' });
    const box = createEl('div', { class: 'hdo-puzzle-box' });

    const isIndexPage = isIndex;
    let question, answer;
    if (isIndexPage) {
      const a = Math.floor(Math.random() * 5) + 2;
      const b = Math.floor(Math.random() * 5) + 2;
      question = 'What is ' + a + ' + ' + b + '?';
      answer = String(a + b);
    } else {
      const a = Math.floor(Math.random() * 9) + 5;
      const b = Math.floor(Math.random() * 9) + 5;
      const c = Math.floor(Math.random() * 20) + 1;
      question = 'What is (' + a + ' × ' + b + ') − ' + c + '?';
      answer = String(a * b - c);
    }

    box.innerHTML = '<h2>Verify to enter</h2>' +
      '<p class="hdo-puzzle-hint">' + (isIndexPage ? 'This is the easy gate.' : 'This is the harder gate for this page.') + '</p>' +
      '<p class="hdo-puzzle-question">' + question + '</p>' +
      '<input type="text" class="hdo-puzzle-input" id="hdo-puzzle-answer" placeholder="Answer" autocomplete="off">' +
      '<button class="hdo-puzzle-submit" id="hdo-puzzle-submit">Submit</button>' +
      '<p class="hdo-puzzle-error" id="hdo-puzzle-error"></p>';
    box.classList.add('hdo-animate-fade');
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    document.getElementById('hdo-puzzle-answer').focus();

    function check() {
      const input = document.getElementById('hdo-puzzle-answer');
      const error = document.getElementById('hdo-puzzle-error');
      const userAnswer = input.value.trim();
      if (userAnswer === answer) {
        showDmca();
      } else {
        error.textContent = 'Incorrect. Please try again.';
        input.value = '';
        input.focus();
      }
    }

    document.getElementById('hdo-puzzle-submit').addEventListener('click', check);
    document.getElementById('hdo-puzzle-answer').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') check();
    });

    function showDmca() {
      overlay.innerHTML = '<div class="hdo-puzzle-box">' +
        '<h2>DMCA & Disclaimer</h2>' +
        '<p class="hdo-puzzle-text">' +
          'This site and the HDO Pro project do not host, upload, store, or distribute any media content. ' +
          'All content accessed through third-party applications or services remains the responsibility of its respective providers. ' +
          'This is intended for personal use only. Users are responsible for complying with all applicable laws and regulations in their jurisdiction. ' +
          'By entering, you acknowledge that you have read and understood this notice.' +
        '</p>' +
        '<button class="hdo-puzzle-submit" id="hdo-puzzle-agree">I agree, enter</button>' +
      '</div>';
      const dmcaBox = overlay.querySelector('.hdo-puzzle-box');
      if (dmcaBox) dmcaBox.classList.add('hdo-animate-fade');
      document.getElementById('hdo-puzzle-agree').addEventListener('click', function () {
        localStorage.setItem('hdo-verified', 'true');
        overlay.remove();
        completeInit();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
