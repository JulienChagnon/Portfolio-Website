
//See More Button on Job History
(() => {
  const btn = document.getElementById('toggleJobs');
  const moreJobs = document.querySelector('.more-jobs');
  if (!btn || !moreJobs) return; // gracefully skip if not present
  const labelSpan = btn.querySelector('.lang-text') || btn;
  btn.addEventListener('click', () => {
    const isOpen = moreJobs.classList.toggle('show');
    const lang = document.body.classList.contains('fr') ? 'fr' : 'en';
    const key  = isOpen ? 'hide' : 'show';
    const attr = `data-${lang}-${key}`;
    const newLabel = btn.getAttribute(attr);
    if (newLabel) labelSpan.textContent = newLabel;
  });
})();

//Set the footer year dynamically
(() => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();

// Sidebar
document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const header  = document.querySelector('header.header-flex');
  if (!sidebar || !header) return;

  const FIXED_TOP    = 100; // px from viewport top after unlock
  const UNDER_MARGIN = 10;

  // Ensure there is absolutely no animated lag
  sidebar.style.transition = 'none';
  sidebar.style.transform  = 'none';
  sidebar.style.position   = 'fixed';
  sidebar.style.visibility = 'hidden'; // avoid flash until first compute
  sidebar.style.opacity    = '0';

  const update = () => {
    const headerBottom = header.getBoundingClientRect().bottom;
    const desiredTop = Math.max(FIXED_TOP, Math.round(headerBottom + UNDER_MARGIN));

    if (sidebar.__lastTop !== desiredTop) {
      sidebar.style.top = desiredTop + 'px';
      sidebar.__lastTop = desiredTop;
    }

    // Reveal after first layout-correct position is applied
    if (sidebar.style.visibility !== 'visible') {
      sidebar.style.visibility = 'visible';
      sidebar.style.opacity = '1';
    }
  };

  const tick = () => {
    update();
    requestAnimationFrame(tick);
  };
  tick();

  //react to header size changes
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => update()).observe(header);
  } else {
    window.addEventListener('resize', update);
    window.addEventListener('load', update);
  }
});



//Open vids in new tab buttons
(() => {
  const v1 = document.getElementById('openVideoBtn');
  const v2 = document.getElementById('openVideoBtn2');
  const v3 = document.getElementById('openVideoBtn3');
  if (v1) v1.addEventListener('click', () => window.open('Media/APSC101Demo.mp4', '_blank'));
  if (v2) v2.addEventListener('click', () => window.open('Media/APSC103Demo.mp4', '_blank'));
  if (v3) v3.addEventListener('click', () => window.open('Media/ELEC292Demo.mp4', '_blank'));
})();



//Sidebar projects dropdown
(() => {
  const slugify = (text) => {
    if (!text) return '';
    let normalized = text;
    try {
      normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    } catch (_) {}
    return normalized
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const PROJECT_LINK_LABELS = {
    en: [
      'Running and Jumping Detection (Python ML)',
      'Dynamic Time Allocating Calendar (Qt/C++)',
      'Fluid and Powder Dispensing Device (Arduino)',
      '911 Operator Training Device (Web + Arduino)',
      'Portfolio Website (HTML/CSS/JS)',
      'Birthday Guessing Game (Java)',
    ],
    fr: [
      'Détection de course et saut (Python)',
      'Calendrier dynamique (C++/Qt)',
      'Distributeur fluide et poudre (Arduino)',
      'Simulateur d\'opérateur 911 (Web + Arduino)',
      'Site portfolio (HTML/CSS/JS)',
      'Jeu deviner anniversaire (Java)',
    ],
  };

  const labelFor = (lang, index, fallback = '') => {
    const list = PROJECT_LINK_LABELS[lang];
    if (!Array.isArray(list)) return fallback;
    const value = list[index];
    if (typeof value !== 'string') return fallback;
    const trimmed = value.trim();
    return trimmed || fallback;
  };

  const applyToggleLabel = (toggle) => {
    if (!toggle) return;
    const lang = document.body.classList.contains('fr') ? 'fr' : 'en';
    const attr = lang === 'fr' ? 'data-fr-label' : 'data-en-label';
    let label = toggle.getAttribute(attr) || toggle.getAttribute('aria-label') || '';
    if (label) {
      toggle.setAttribute('aria-label', label);
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('projectsToggle');
    const dropdown = document.getElementById('projectsDropdown');
    const list = document.getElementById('projectsList');
    const sidebar = document.getElementById('sidebar');
    const projectsSection = document.getElementById('projects');
    if (!toggle || !dropdown || !list || !sidebar || !projectsSection) return;

    const arrowSpan = toggle.querySelector('[aria-hidden]');

    const setArrow = () => {
      if (arrowSpan) arrowSpan.textContent = '▼';
    };

    const setOpen = (open) => {
      const expanded = !!open;
      dropdown.hidden = !expanded;
      dropdown.classList.toggle('open', expanded);
      toggle.classList.toggle('open', expanded);
      toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      sidebar.classList.toggle('sidebar-expanded', expanded);
      setArrow();
    };

    const isOpen = () => dropdown.classList.contains('open');

    const ensureAnchor = (box, title, index) => {
      let existing = box.getAttribute('id');
      if (existing) return existing;
      const baseSlug = slugify(title) || `project-${index + 1}`;
      let candidate = baseSlug;
      let suffix = 1;
      while (document.getElementById(candidate)) {
        suffix += 1;
        candidate = `${baseSlug}-${suffix}`;
      }
      box.id = candidate;
      return candidate;
    };

    const buildList = () => {
      const boxes = projectsSection.querySelectorAll('.project-box');
      list.innerHTML = '';
      boxes.forEach((box, index) => {
        const titleNode = box.querySelector('.project-header .lang-text');
        if (!titleNode) return;
        const englishBase = labelFor('en', index, (titleNode.getAttribute('data-en') || titleNode.textContent || '').trim());
        if (!englishBase) return;
        const langKey = document.body.classList.contains('fr') ? 'fr' : 'en';
        const displayTitle = labelFor(
          langKey,
          index,
          langKey === 'fr'
            ? (titleNode.getAttribute('data-fr') || englishBase)
            : englishBase
        ).trim();
        const anchor = ensureAnchor(box, englishBase, index);
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = `#${anchor}`;
        link.textContent = displayTitle;
        link.addEventListener('click', () => {
          setOpen(false);
        });
        li.appendChild(link);
        list.appendChild(li);
      });
    };

    toggle.addEventListener('click', (event) => {
      event.preventDefault();
      const nextState = !isOpen();
      setOpen(nextState);
      if (nextState) {
        const firstLink = list.querySelector('a');
        if (firstLink) {
          firstLink.focus();
        }
      }
    });

    document.addEventListener('click', (event) => {
      if (!isOpen()) return;
      if (sidebar.contains(event.target)) {
        if (dropdown.contains(event.target) || toggle.contains(event.target)) return;
      } else {
        setOpen(false);
        return;
      }
      setOpen(false);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });

    const handleLanguageChange = () => {
      buildList();
      applyToggleLabel(toggle);
      setArrow();
    };

    buildList();
    applyToggleLabel(toggle);
    setOpen(false);

    window.addEventListener('portfolio:languagechange', handleLanguageChange);
  });
})();



//language + theme switch
const langButton = document.getElementById('langButton');
const body = document.body;
const texts = document.querySelectorAll('.lang-text');
const resumeLink = document.getElementById('resumeLink');

function updateLanguage(isFr) {
  const langCode = isFr ? 'fr' : 'en';
  body.classList.toggle('fr', isFr);
  if (langButton) {
    langButton.textContent = isFr ? 'English' : 'Français';
  }

  if (resumeLink) {
    const targetHref = resumeLink.getAttribute(isFr ? 'data-fr-href' : 'data-en-href');
    if (targetHref) {
      resumeLink.setAttribute('href', targetHref);
    }
    resumeLink.setAttribute('hreflang', langCode);
  }

  texts.forEach(el => {
    el.textContent = isFr
      ? el.getAttribute('data-fr')
      : el.getAttribute('data-en');
  });

  const params = new URLSearchParams(window.location.search);
  params.set('lang', langCode);
  history.replaceState(null, '', `?${params.toString()}`);

  try {
    window.dispatchEvent(new CustomEvent('portfolio:languagechange', { detail: { lang: langCode } }));
  } catch (err) {
    try {
      const legacy = document.createEvent('CustomEvent');
      legacy.initCustomEvent('portfolio:languagechange', false, false, { lang: langCode });
      window.dispatchEvent(legacy);
    } catch (_) {}
  }

  try { window.dispatchEvent(new Event('scroll')); } catch (_) {}
}


document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const isFr = params.get('lang') === 'fr';
  updateLanguage(isFr);
});

if (langButton) {
  langButton.addEventListener('click', () => {
    const isCurrentlyFr = body.classList.contains('fr');
    updateLanguage(!isCurrentlyFr);
  });
}

// Dynamic scrollbar color: white -> primary (blue in FR)
(() => {
  const start = [255, 255, 255];        // white
  const endEN = [83, 67, 104];          // English primary (current theme purple)

  function lerp(a, b, t) { return a + (b - a) * t; }
  function mixColor(end, t) {
    const r = Math.round(lerp(start[0], end[0], t));
    const g = Math.round(lerp(start[1], end[1], t));
    const b = Math.round(lerp(start[2], end[2], t));
    return `rgb(${r}, ${g}, ${b})`;
  }

  function parseCssColorToRgbArray(val) {
    if (!val) return null;
    const v = ("" + val).trim();
    const hex = v.match(/^#([\da-fA-F]{6})$/);
    if (hex) {
      const n = parseInt(hex[1], 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    const rgb = v.match(/^rgba?\(([^)]+)\)$/i);
    if (rgb) {
      const parts = rgb[1].split(',').map(s => parseFloat(s.trim()));
      if (parts.length >= 3) return [parts[0], parts[1], parts[2]].map(x => Math.max(0, Math.min(255, Math.round(x))));
    }
    return null;
  }

  function updateScrollbarColor() {
    if (typeof window !== 'undefined' && window.__overlayDragging) return;
    const doc = document.documentElement;
    const isFr = document.body && document.body.classList.contains('fr');
    let end = endEN;
    if (isFr) {
      const cssPrimary = getComputedStyle(document.body || doc).getPropertyValue('--primary') || getComputedStyle(doc).getPropertyValue('--primary');
      const parsed = parseCssColorToRgbArray(cssPrimary);
      if (parsed) end = parsed;
    }
    const max = Math.max(1, doc.scrollHeight - window.innerHeight);
    const y = window.scrollY || window.pageYOffset || 0;
    const t = Math.min(1, Math.max(0, y / max));
    const color = mixColor(end, t);
    doc.style.setProperty('--scrollbar-color', color);
  }

  // Initialize and keep updated
  window.addEventListener('scroll', updateScrollbarColor, { passive: true });
  window.addEventListener('resize', updateScrollbarColor);
  window.addEventListener('load', updateScrollbarColor);
  document.addEventListener('DOMContentLoaded', updateScrollbarColor);
})();

// Overlay scrollbar: draws a draggable thumb over the page
(() => {
  const docEl = document.documentElement;
  const overlay = document.createElement('div');
  overlay.id = 'scrollbarOverlay';
  const thumb = document.createElement('div');
  thumb.id = 'scrollbarThumb';
  overlay.appendChild(thumb);
  function ensureAttached() {
    if (!overlay.isConnected) {
      if (document.body) document.body.appendChild(overlay);
      else document.addEventListener('DOMContentLoaded', () => document.body.appendChild(overlay), { once: true });
    }
  }
  ensureAttached();
  const minThumb = 32;

  let trackTop = 0, trackHeight = 0, thumbHeight = 0, maxThumbTop = 0, maxScroll = 1;

  function computeMetrics() {
    const rect = overlay.getBoundingClientRect();
    trackTop = rect.top;
    trackHeight = Math.max(0, rect.height || (window.innerHeight - 16));
    const scrollHeight = docEl.scrollHeight;
    const viewport = window.innerHeight;
    maxScroll = Math.max(1, scrollHeight - viewport);
    const ratio = Math.min(1, viewport / Math.max(1, scrollHeight));
    thumbHeight = Math.max(minThumb, Math.round(trackHeight * ratio));
    maxThumbTop = Math.max(0, trackHeight - thumbHeight);
    thumb.style.height = `${thumbHeight}px`;
  }

  function updateOverlay() {
    // Skip scroll-driven updates while dragging
    if (dragging) return;
    computeMetrics();
    const y = window.scrollY || window.pageYOffset || 0;
    const t = Math.min(1, Math.max(0, y / maxScroll));
    const top = Math.round(maxThumbTop * t);
    thumb.style.transform = `translateY(${top}px)`;
  }

  let dragging = false;
  let dragOffset = 0;

  function getClientY(e) { return e.touches ? e.touches[0].clientY : e.clientY; }

  let savedScrollBehavior = '';
  let scrollBehaviorPatched = false;

  function startDrag(e) {
    e.preventDefault();
    computeMetrics();
    const thumbRect = thumb.getBoundingClientRect();
    const y = getClientY(e);
    dragging = true;
    dragOffset = Math.max(0, Math.min(y - thumbRect.top, thumbRect.height));
    savedScrollBehavior = docEl.style.scrollBehavior;
    docEl.style.scrollBehavior = 'auto';
    scrollBehaviorPatched = true;
    try { window.__overlayDragging = true; } catch (_) {}
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('touchend', endDrag);
    document.body.style.userSelect = 'none';
    thumb.style.cursor = 'grabbing';
  }

  function onDrag(e) {
    if (!dragging) return;
    e.preventDefault();
    const y = getClientY(e);
    let thumbTop = y - trackTop - dragOffset;
    if (thumbTop < 0) thumbTop = 0;
    else if (thumbTop > maxThumbTop) thumbTop = maxThumbTop;
    thumb.style.transform = `translateY(${Math.round(thumbTop)}px)`;
    const t = maxThumbTop ? (thumbTop / maxThumbTop) : 0;
    const scrollY = t * maxScroll;
    docEl.scrollTop = scrollY;
    document.body.scrollTop = scrollY;
  }

  function endDrag() {
    dragging = false;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('touchend', endDrag);
    document.body.style.userSelect = '';
    thumb.style.cursor = '';
    if (scrollBehaviorPatched) {
      docEl.style.scrollBehavior = savedScrollBehavior;
      scrollBehaviorPatched = false;
    }
    try { window.__overlayDragging = false; } catch (_) {}
    updateOverlay();
    try { window.dispatchEvent(new Event('scroll')); } catch (_) {}
  }

  // Click/drag on overlay
  overlay.addEventListener('mousedown', startDrag);
  overlay.addEventListener('touchstart', startDrag, { passive: false });

  window.addEventListener('scroll', () => { ensureAttached(); updateOverlay(); }, { passive: true });
  window.addEventListener('resize', () => { ensureAttached(); updateOverlay(); });
  window.addEventListener('load', () => { ensureAttached(); updateOverlay(); });
  document.addEventListener('DOMContentLoaded', () => { ensureAttached(); updateOverlay(); });
})();

(() => {
  const header = document.querySelector('header.header-flex');
  if (!header) return;
  let indicator = header.querySelector('.header-scroll-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'header-scroll-indicator';
    indicator.innerHTML = '<span>&#x2193;</span>';
    header.appendChild(indicator);
  }

  indicator.removeAttribute('aria-hidden');
  indicator.setAttribute('role', 'button');
  indicator.setAttribute('tabindex', '0');

  const LABELS = {
    en: 'Scroll to main content',
    fr: 'Faire defiler vers le contenu principal'
  };

  const applyLabel = (lang) => {
    const nextLang = LABELS[lang] ? lang : 'en';
    const label = LABELS[nextLang];
    indicator.setAttribute('aria-label', label);
    indicator.setAttribute('title', label);
  };

  const resolveLang = () => (document.body.classList.contains('fr') ? 'fr' : 'en');
  applyLabel(resolveLang());
  window.addEventListener('portfolio:languagechange', (event) => {
    const lang = event && event.detail && event.detail.lang ? event.detail.lang : resolveLang();
    applyLabel(lang);
  });

  const findScrollTarget = () => {
    const firstContent = header.nextElementSibling;
    if (firstContent) return firstContent;
    const main = document.querySelector('main');
    if (main) return main;
    return document.body;
  };

  const SCROLL_OFFSET_PX = 120;

  const scrollToContent = () => {
    const target = findScrollTarget();
    if (!target) return;
    const prefersReducedMotion = (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const behavior = prefersReducedMotion ? 'auto' : 'smooth';
    const baseTop = target.getBoundingClientRect().top + (window.scrollY || window.pageYOffset || 0);
    const desiredTop = Math.max(0, baseTop - SCROLL_OFFSET_PX);
    if (typeof window.scrollTo === 'function') {
      window.scrollTo({ top: desiredTop, behavior });
    } else {
      window.scroll(0, desiredTop);
    }
  };

  const handleActivate = (event) => {
    if (!event) {
      scrollToContent();
      return;
    }

    if (event.type === 'click') {
      event.preventDefault();
      scrollToContent();
      return;
    }

    if (event.type === 'keydown') {
      const key = event.key;
      if (key === 'Enter' || key === ' ') {
        event.preventDefault();
        scrollToContent();
      }
    }
  };

  indicator.addEventListener('click', handleActivate);
  indicator.addEventListener('keydown', handleActivate);

  const update = () => {
    const hidden = (window.scrollY || window.pageYOffset || 0) > 5;
    indicator.classList.toggle('hidden', hidden);
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
})();

// Header Digital Rain

(() => {

  function initHeaderRain() {
    const header = document.querySelector('header');
    if (!header) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'headerRainCanvas';
    header.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    let w = 0, h = 0, step = 14 * dpr, stepX = 14 * dpr, cols = 0, rows = 0;
    let heads = [];

    function size() {
      const cw = Math.max(1, header.clientWidth);
      const ch = Math.max(1, header.clientHeight);
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      canvas.width = Math.floor(cw * dpr);
      canvas.height = Math.floor(ch * dpr);
      canvas.style.width = cw + 'px';
      canvas.style.height = ch + 'px';
      w = canvas.width; h = canvas.height;
      step = Math.max(8, Math.round((cw > 600 ? 10 : 9) * dpr));
      stepX = Math.max(6, Math.round(step * 0.8));
      cols = Math.max(1, Math.floor(w / stepX));
      rows = Math.max(1, Math.floor(h / step));
      heads = new Array(cols).fill(0).map(() => Math.floor(Math.random() * rows));
    }

    function cssVar(name, fallback) {
      const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return val || fallback;
    }

    size();
    window.addEventListener('resize', size);
    window.addEventListener('load', size);
    document.addEventListener('DOMContentLoaded', size);

    let lastY = window.scrollY || window.pageYOffset || 0;
    let accum = 0;
    let glyphPhase = 0;
    let lastChange = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const changeInterval = 280; // ms between digit changes (increase for slower)
    const REVEAL_SCROLL_RANGE = 1100;
    let scrollClassTimer;

    //Only toggles the subtle header style while actively scrolling

    function onUserScroll() {
      header.classList.add('header-rain-active');
      clearTimeout(scrollClassTimer);
      scrollClassTimer = setTimeout(() => header.classList.remove('header-rain-active'), 200);
    }
    window.addEventListener('scroll', onUserScroll, { passive: true });

    function hash32(x){
      x |= 0; x = (x ^ 61) ^ (x >>> 16); x = x + (x << 3);
      x = x ^ (x >>> 4); x = Math.imul(x, 0x27d4eb2d); x = x ^ (x >>> 15);
      return x >>> 0;
    }

    function tick() {
      const nowY = window.scrollY || window.pageYOffset || 0;
      const dy = nowY - lastY;
      lastY = nowY;

      // Speed of rain chains while scrolling.
      accum += dy / 25;
      // Clamp accumulator to prevent excessive buildup
      accum = Math.max(-3, Math.min(3, accum));
      const sign = accum === 0 ? 0 : (accum > 0 ? 1 : -1);
      let moveSteps = Math.floor(Math.min(1, Math.abs(accum)));
      if (moveSteps > 0) {
        for (let c = 0; c < cols; c++) {
          let head = heads[c] + (sign < 0 ? moveSteps : -moveSteps); // up when scrolling down, down when scrolling up
          head %= rows; if (head < 0) head += rows;
          heads[c] = head;
        }
        accum -= sign * moveSteps;
      }

      //Clear and draw every frame so digits change even when idle
      ctx.clearRect(0, 0, w, h);
      const ramp = Math.max(0, Math.min(1, nowY / REVEAL_SCROLL_RANGE));
      const visibleTopY = Math.floor((1 - ramp) * h);
      if (ramp === 0) {
        requestAnimationFrame(tick);
        return;
      }

      ctx.font = Math.floor(step * 1.3) + 'px monospace';
      ctx.textBaseline = 'top';
      ctx.fillStyle = cssVar('--rain-color', 'rgba(0,255,140,0.75)');
      ctx.shadowColor = cssVar('--rain-glow', 'rgba(0,255,140,0.25)');
      ctx.shadowBlur = Math.round(step * 0.35);

      // Advance glyph phase on a slower timer so values change less frequently
      const tnow = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      if (tnow - lastChange >= changeInterval) {
        glyphPhase = (glyphPhase + 1) | 0;
        lastChange = tnow;
      }

      const featherPx = Math.round(6 * step);
      const bleedPx   = Math.round(2 * step);
      const jitterPx  = Math.round(2.5 * step);

      for (let c = 0; c < cols; c++) {
        const chainLen = 10 + (c % 9);
        const head = heads[c];
        const jitterSeed = hash32((c + 1) * 2654435761);
        const jitter = ((jitterSeed % 2001) / 1000 - 1) * jitterPx; // [-jitterPx, +jitterPx]
        const colTop = visibleTopY + jitter;
        for (let i = 0; i < chainLen; i++) {
          const r = (head + i) % rows;
          const seed = ((c + 1) * 73856093) ^ ((r + 1) * 19349663) ^ (glyphPhase * 83492791);
          const ch = (hash32(seed) & 1) ? '1' : '0';
          const x = c * stepX + Math.floor(stepX * 0.1);
          const y = r * step;
          if (y < colTop - bleedPx) continue;

          const baseAlpha = i === 0 ? 0.95 : Math.max(0.25, 0.9 - i * 0.1);
          const delta = y - colTop;
          let colAlpha;
          if (delta < 0) {
            const norm = 1 - (-delta / bleedPx); // 0..1 as it approaches boundary
            colAlpha = 0.15 + 0.40 * norm;
          } else if (delta < featherPx) {
            const norm2 = delta / featherPx;
            colAlpha = 0.25 + 0.75 * norm2;
          } else {
            colAlpha = 1;
          }

          const drawAlpha = baseAlpha * colAlpha;
          if (drawAlpha <= 0.02) continue;
          ctx.globalAlpha = drawAlpha;
          ctx.fillText(ch, x, y);
        }
      }
      ctx.globalAlpha = 1;

      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeaderRain);
  } else {
    initHeaderRain();
  }
})();

// Sidebar binary rain overlay

(() => {

  function initSidebarRain() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    if (sidebar.querySelector('#sidebarRainCanvas')) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'sidebarRainCanvas';
    sidebar.insertBefore(canvas, sidebar.firstChild || null);

    const ctx = canvas.getContext('2d');
    let w = 0;
    let h = 0;
    let step = 18;
    let cols = 0;
    let rows = 0;
    let heads = [];
    let glyphPhase = 0;
    let lastGlyphChange = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const glyphInterval = 360;
    let lastScrollY = window.scrollY || window.pageYOffset || 0;

    function cssVar(name, fallback) {
      const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return val || fallback;
    }

    function hash32(x) {
      x |= 0;
      x = (x ^ 61) ^ (x >>> 16);
      x = x + (x << 3);
      x = x ^ (x >>> 4);
      x = Math.imul(x, 0x27d4eb2d);
      x = x ^ (x >>> 15);
      return x >>> 0;
    }

    function resize() {
      const rect = sidebar.getBoundingClientRect();
      const dpr = typeof window.devicePixelRatio === 'number' ? window.devicePixelRatio : 1;
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = Math.max(3, Math.floor(w / 14));
      step = w / cols;
      rows = Math.max(4, Math.ceil(h / step) + 2);

      const previous = heads;
      heads = new Array(cols);
      for (let i = 0; i < cols; i++) {
        const carry = previous && previous[i] !== undefined ? previous[i] : Math.floor(Math.random() * rows);
        heads[i] = ((carry % rows) + rows) % rows;
      }
    }

    function tick() {
      if (!cols || !rows) {
        requestAnimationFrame(tick);
        return;
      }

      const nowScrollY = window.scrollY || window.pageYOffset || 0;
      const dy = nowScrollY - lastScrollY;
      lastScrollY = nowScrollY;

      const absDy = Math.abs(dy);
      const direction = dy === 0 ? 0 : (dy > 0 ? 1 : -1);
      const moveSteps = Math.min(6, Math.floor(absDy / 12));
      if (moveSteps > 0 && direction !== 0) {
        for (let c = 0; c < cols; c++) {
          let head = heads[c] + (direction > 0 ? -moveSteps : moveSteps);
          head %= rows;
          if (head < 0) head += rows;
          heads[c] = head;
        }
      }

      const activation = 1;

      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      if (now - lastGlyphChange >= glyphInterval) {
        glyphPhase = (glyphPhase + 1) | 0;
        lastGlyphChange = now;
      }

      ctx.clearRect(0, 0, w, h);

      ctx.font = Math.floor(step * 0.9) + 'px monospace';
      ctx.textBaseline = 'top';
      ctx.fillStyle = cssVar('--sidebar-rain-color', 'rgba(0,255,140,0.55)');
      ctx.shadowColor = cssVar('--sidebar-rain-glow', 'rgba(0,255,140,0.25)');
      ctx.shadowBlur = Math.round(step * 0.25);

      const minVisibleRow = Math.max(0, Math.floor((1 - activation) * rows));

      for (let c = 0; c < cols; c++) {
        const head = heads[c];
        const chainLen = 6 + (c % 5);
        for (let i = 0; i < chainLen; i++) {
          const row = (head + i) % rows;
          if (row < minVisibleRow) continue;
          const y = row * step;
          if (y > h) continue;

          const seed = ((c + 1) * 73856093) ^ ((row + 1) * 19349663) ^ ((glyphPhase + 1) * 83492791);
          const ch = (hash32(seed) & 1) ? '1' : '0';
          const x = c * step + step * 0.2;
          const baseAlpha = i === 0 ? 0.9 : Math.max(0.25, 0.8 - i * 0.08);
          const fade = Math.max(0.6, 1 - (y / Math.max(1, h)) * 0.22);
          const drawAlpha = baseAlpha * fade * activation;
          if (drawAlpha <= 0.02) continue;
          ctx.globalAlpha = drawAlpha;
          ctx.fillText(ch, x, y);
        }
      }

      ctx.globalAlpha = 1;
      requestAnimationFrame(tick);
    }

    resize();
    if (typeof ResizeObserver !== 'undefined') {

      const ro = new ResizeObserver(() => resize());
      ro.observe(sidebar);
    } else {
      window.addEventListener('resize', resize);
      window.addEventListener('load', resize);
    }

    requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebarRain);
  } else {
    initSidebarRain();
  }
})();


// Header Terminal (non-interactive visual only, looping with scrollback)

(() => {
  const TERMINAL_SETS = {
    en: {
      prompt: "julien@profile:~$ ",
      commands: [
        {
          cmd: 'echo "Welcome to my portfolio!"',
          out: ['Welcome to my portfolio!'],
        },
        {
          cmd: 'git status',
          out: ['Looking for 12-16 month co-op opportunities in Computer Engineering.'],
        },
        {
          cmd: 'ls -la',
          out: [
            'total 5',
            '-rw-r--r-- 1 julien julien  850 Oct 30 15:10 about-me.html',
            '-rw-r--r-- 1 julien julien  980 Oct 30 15:12 work-history.html',
            '-rw-r--r-- 1 julien julien 1024 Oct 30 15:14 projects.html',
            '-rw-r--r-- 1 julien julien  740 Oct 30 15:16 education.html',
            '-rw-r--r-- 1 julien julien  620 Oct 30 15:18 certifications.html'
          ],
          beforeDelay: 2500,
          outputDelay: 300
        },
        {
          cmd: 'git log --oneline',
          out: [
            'd4c9f87 (HEAD -> main) 05/2025-08/2025  Traffic Services Intern',
            'c2a3b19                05/2024-08/2024  Graffiti Management Assistant',
            'c0b8e0f12              06/2022-08/2022  Camp Counsellor',
            '9f33a04                09/2023-Present  Computer Engineering Student @ Queen\'s',
            '7e1cda2                02/2005-Present  Started the journey'
          ],
          beforeDelay: 3500,
          outputDelay: 300
        },
        {
          cmd: 'neofetch',
          out: ['JulienOS v3.57', 'Uptime: 20 years','Desktop: English & French'],
          beforeDelay: 3500,
          outputDelay: 500,
        },
        {
          cmd: 'make coffee',
          out: ['Compiling caffeine...', 'build successful.'],
          beforeDelay: 1200,
          outputDelay: [2000, 600],
          afterDelay: 900
        },
        {
          cmd: 'diff yesterday today',
          out: ['+ more experience', '+ more motivation'],
          outputDelay: 500,
        }
      ]
    },
    fr: {
      prompt: "julien@profil:~$ ",
      commands: [
        {
          cmd: 'echo "Bienvenue à mon portfolio !"',
          out: ['Bienvenue à mon portfolio !'],
        },
        {
          cmd: 'git status',
          out: ['À la recherche d\'un stage coop de 12 à 16 mois en génie informatique.'],
        },
        {
          cmd: 'ls -la',
          out: [
            'total 5',
            '-rw-r--r-- 1 julien julien  850 oct 30 15:10 à-propos.html',
            '-rw-r--r-- 1 julien julien  980 oct 30 15:12 historique-de-travail.html',
            '-rw-r--r-- 1 julien julien 1024 oct 30 15:14 projets.html',
            '-rw-r--r-- 1 julien julien  740 oct 30 15:16 éducation.html',
            '-rw-r--r-- 1 julien julien  620 oct 30 15:18 certifications.html'
          ],
          beforeDelay: 2500,
          outputDelay: 300
        },
        {
          cmd: 'git log --oneline',
          out: [
            'd4c9f87 (HEAD -> main) 05/2025-08/2025  Stagiaire, services de circulation',
            'c2a3b19                05/2024-08/2024  Assistant à la gestion des graffitis',
            'c0b8e0f12              06/2022-08/2022  Moniteur de camp',
            '9f33a04                09/2023-Présent  Étudiant en génie informatique à Queen\'s',
            '7e1cda2                02/2005-Présent  Début du parcours'
          ],
          beforeDelay: 3500,
          outputDelay: 300
        },
        {
          cmd: 'neofetch',
          out: ['JulienOS v3.57', 'Uptime: 20 ans', 'Desktop: Français & Anglais'],
          beforeDelay: 3500,
          outputDelay: 500,
        },
        {
          cmd: 'make café',
          out: ['Compilation de caffeine...', 'construction réussie.'],
          beforeDelay: 1200,
          outputDelay: [2000, 600],
          afterDelay: 900
        },
        {
          cmd: 'diff hier aujourd\'hui',
          out: ['+ plus d\'expérience', '+ plus de motivation'],
          outputDelay: 500,
        },
      ]
    }
  };
  const MAX_LINES = 15;
  const TYPE_CHARS_PER_TICK = 1;
  const TYPE_TICK_MS = 100;
  const PAUSE_AFTER_CMD_MS = 500;
  const PAUSE_BETWEEN_OUTPUT_MS = 90;
  const PAUSE_BETWEEN_COMMANDS_MS = 2500;

  const currentLanguage = () => (document.body.classList.contains('fr') ? 'fr' : 'en');

  const getConfig = (lang) => TERMINAL_SETS[lang] || TERMINAL_SETS.en;

  function initHeaderTerminal() {
    const header = document.querySelector('header.header-flex') || document.querySelector('header');
    if (!header) return;

    let term = header.querySelector('#headerTerminal');
    if (!term) {
      term = document.createElement('div');
      term.id = 'headerTerminal';
      term.setAttribute('aria-hidden', 'true');
      header.appendChild(term);
    }

    let activeLang = currentLanguage();
    let activeConfig = getConfig(activeLang);
    let index = 0;
    let shouldRestart = false;
    let firstCycle = true;

    const enforceScrollback = () => {
      while (term.childElementCount > MAX_LINES) {
        term.removeChild(term.firstElementChild);
      }
    };

    const appendLine = (el) => {
      if (shouldRestart) return;
      enforceScrollback();
      term.appendChild(el);
      enforceScrollback();
    };

    const newPromptLine = () => {
      const line = document.createElement('div');
      line.className = 'term-line term-prompt';
      const prompt = document.createElement('span');
      prompt.className = 'prompt';
      prompt.textContent = activeConfig.prompt;
      const typed = document.createElement('span');
      typed.className = 'typed';
      const caret = document.createElement('span');
      caret.className = 'term-caret';
      line.append(prompt, typed, caret);
      appendLine(line);
      return { line, typed, caret };
    };

    const releaseCaret = (promptLine) => {
      const caret = promptLine && promptLine.querySelector('.term-caret');
      if (caret) caret.remove();
    };

    const printOutputLine = async (text, delayOverride) => {
      if (shouldRestart) return;
      const line = document.createElement('div');
      line.className = 'term-line term-output';
      line.textContent = text;
      appendLine(line);
      if (shouldRestart) return;
      const delay = delayOverride != null ? delayOverride : PAUSE_BETWEEN_OUTPUT_MS;
      if (delay > 0) {
        await sleep(delay);
      }
    };

    const typeText = (node, text) => new Promise(resolve => {
      const chars = [...text];
      let i = 0;

      const step = () => {
        if (shouldRestart) {
          node.textContent = '';
          resolve();
          return;
        }
        const chunk = chars.slice(i, i + TYPE_CHARS_PER_TICK).join('');
        node.textContent += chunk;
        i += TYPE_CHARS_PER_TICK;
        if (i < chars.length) {
          setTimeout(step, TYPE_TICK_MS);
        } else {
          resolve();
        }
      };
      step();
    });

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    const requestRestart = () => {
      shouldRestart = true;
      firstCycle = true;
      index = 0;
      term.innerHTML = '';
    };

    const applyLanguage = (lang) => {
      const nextLang = TERMINAL_SETS[lang] ? lang : 'en';
      if (nextLang === activeLang) return;
      activeLang = nextLang;
      activeConfig = getConfig(activeLang);
      requestRestart();
    };

    const handleLanguageChange = (event) => {
      const lang = event && event.detail && event.detail.lang ? event.detail.lang : currentLanguage();
      applyLanguage(lang);
    };

    window.addEventListener('portfolio:languagechange', handleLanguageChange);

    (async () => {
      while (true) {
        if (shouldRestart) {
          shouldRestart = false;
          continue;
        }

        const commands = activeConfig.commands;
        if (!commands.length) {
          await sleep(PAUSE_BETWEEN_COMMANDS_MS);
          continue;
        }

        const entry = commands[index % commands.length];
        const promptLine = newPromptLine();
        const beforeDelay = firstCycle ? 0 : (entry.beforeDelay != null ? entry.beforeDelay : PAUSE_BETWEEN_COMMANDS_MS);
        firstCycle = false;
        if (beforeDelay > 0) {
          await sleep(beforeDelay);
        }

        if (shouldRestart || !promptLine) {
          shouldRestart = false;
          firstCycle = true;
          continue;
        }

        await typeText(promptLine.typed, entry.cmd);
        if (shouldRestart) {
          shouldRestart = false;
          firstCycle = true;
          continue;
        }

        const afterDelay = entry.afterDelay != null ? entry.afterDelay : PAUSE_AFTER_CMD_MS;
        if (afterDelay > 0) {
          await sleep(afterDelay);
        }
        if (shouldRestart) {
          shouldRestart = false;
          firstCycle = true;
          continue;
        }

        releaseCaret(promptLine.line);

        const outLines = entry.out || [];
        for (let i = 0; i < outLines.length; i++) {
          if (shouldRestart) break;
          const lineText = outLines[i];
          let delayOverride;
          if (Array.isArray(entry.outputDelay)) {
            const idx = i < entry.outputDelay.length ? i : entry.outputDelay.length - 1;
            delayOverride = entry.outputDelay[idx];
          } else {
            delayOverride = entry.outputDelay;
          }
          await printOutputLine(lineText, delayOverride);
        }

        if (shouldRestart) {
          shouldRestart = false;
          firstCycle = true;
          continue;
        }

        index = (index + 1) % commands.length;
      }
    })();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeaderTerminal, { once: true });
  } else {
    initHeaderTerminal();
  }
})();
