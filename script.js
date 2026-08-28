(function () {
  'use strict';

  if (window.__hdoUIInitialized) return;
  window.__hdoUIInitialized = true;

  const isIndex = /index\.html$/i.test(location.pathname) || location.pathname === '/' || location.pathname === '';

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

  // Skip UI injection on the index/landing page
  if (isIndex) return;

  const config = {
    navLinks: [
      { href: '/home', label: 'Home', icon: 'fa-house' },
      { href: '/about', label: 'About', icon: 'fa-circle-info' },
      { href: '/downloads', label: 'Downloads', icon: 'fa-download' },
      { href: '/guide', label: 'Guide', icon: 'fa-book' },
      { href: '/tutorial', label: 'Tutorial', icon: 'fa-graduation-cap' },
      { href: '/rules', label: 'Rules', icon: 'fa-scale-balanced' },
      { href: '/support', label: 'Support', icon: 'fa-life-ring' },
      { href: '/contact', label: 'Contact', icon: 'fa-envelope' },
      { href: '/invite', label: 'Community', icon: 'fa-users' },
      { href: '/donate', label: 'Donate', icon: 'fa-heart' },
      { href: 'https://github.com/HDO-PRO', label: 'GitHub', icon: 'fa-github', external: true }
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
        backdrop-filter: blur(10px);
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
        backdrop-filter: blur(14px);
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
      const a = createEl('a', Object.assign({ href: link.href }, link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {}));
      a.innerHTML = `<i class="fa-solid ${link.icon}"></i> <span>${link.label}</span>`;
      a.addEventListener('click', () => togglePanel('nav', false));
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
    applySettings();
    buildUI();
    // Subtle page entrance for main containers
    const firstContainer = document.querySelector('body > div, body > section, body > main');
    if (firstContainer && !firstContainer.classList.contains('hdo-animate-fade')) {
      firstContainer.classList.add('hdo-animate-fade');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
