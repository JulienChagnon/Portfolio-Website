
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

// Sidebar - sticky positioning
document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const header  = document.querySelector('header.header-flex');
  if (!sidebar || !header) return;

  const STICK_OFFSET = 100; // px from top when it becomes sticky

  // Set up sticky positioning - hide initially to prevent flash
  sidebar.style.position = 'absolute';
  sidebar.style.visibility = 'hidden';
  sidebar.style.opacity = '0';
  sidebar.style.willChange = 'top';

  let isSticky = false;
  let lastScrollY = window.scrollY || window.pageYOffset;
  let initialized = false;

  const updatePosition = () => {
    const scrollY = window.scrollY || window.pageYOffset;
    const headerBottom = header.offsetTop + header.offsetHeight;
    const sidebarTop = headerBottom + 10; // 10px margin under header

    // Calculate when sidebar should stick
    const stickPoint = sidebarTop - STICK_OFFSET;

    if (scrollY >= stickPoint) {
      // Stick to viewport
      if (!isSticky) {
        // Prevent flash by ensuring smooth transition
        const currentTop = sidebar.getBoundingClientRect().top;
        sidebar.style.position = 'fixed';
        sidebar.style.top = currentTop + 'px';
        // Force reflow then animate to target position
        void sidebar.offsetHeight;
        sidebar.style.transition = 'top 0.1s ease-out';
        sidebar.style.top = STICK_OFFSET + 'px';
        isSticky = true;
      }
    } else {
      // Flow with page
      if (isSticky) {
        sidebar.style.transition = 'none';
        sidebar.style.position = 'absolute';
        sidebar.style.top = sidebarTop + 'px';
        isSticky = false;
      } else if (!initialized) {
        // Initial positioning
        sidebar.style.top = sidebarTop + 'px';
      }
    }

    // Show sidebar after first position is set
    if (!initialized) {
      sidebar.style.visibility = 'visible';
      sidebar.style.opacity = '1';
      initialized = true;
    }

    lastScrollY = scrollY;
  };

  // Use scroll event for immediate updates
  window.addEventListener('scroll', updatePosition, { passive: true });
  window.addEventListener('resize', updatePosition);
  updatePosition(); // Initial position
});



// Inline media modal (videos + PDFs)
(() => {
  const modal = document.getElementById('mediaModal');
  const dialog = modal ? modal.querySelector('.media-modal__dialog') : null;
  const content = document.getElementById('mediaModalContent');
  if (!modal || !dialog || !content) return;

  let lastTrigger = null;

  const resolveLang = () => (document.body.classList.contains('fr') ? 'fr' : 'en');

  const getTriggerLabel = (trigger) => {
    if (!trigger) return '';
    const lang = resolveLang();
    const labelAttr = trigger.getAttribute(lang === 'fr' ? 'data-fr-label' : 'data-en-label');
    if (labelAttr) return labelAttr.trim();
    const langNode = trigger.querySelector('.lang-text');
    if (langNode) {
      const attr = lang === 'fr' ? langNode.getAttribute('data-fr') : langNode.getAttribute('data-en');
      if (attr) return attr.trim();
      if (langNode.textContent) return langNode.textContent.trim();
    }
    if (trigger.title) return trigger.title.trim();
    return (trigger.textContent || '').trim();
  };

  const setOpenState = (open) => {
    modal.hidden = !open;
    modal.classList.toggle('is-open', open);
    modal.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.classList.toggle('media-modal-open', open);
  };

  const clearContent = () => {
    content.querySelectorAll('video').forEach((video) => {
      try { video.pause(); } catch (_) {}
      video.removeAttribute('src');
      try { video.load(); } catch (_) {}
    });
    content.innerHTML = '';
  };

  const autoPlayIfVideo = (node) => {
    if (!(node instanceof HTMLVideoElement)) return;
    node.autoplay = true;
    const tryPlay = () => {
      try {
        const playResult = node.play && node.play();
        if (playResult && typeof playResult.catch === 'function') {
          playResult.catch(() => {});
        }
      } catch (_) {}
    };
    if (node.readyState >= 2) {
      tryPlay();
    } else {
      node.addEventListener('loadeddata', tryPlay, { once: true });
    }
  };

  const openModal = (trigger, node) => {
    lastTrigger = trigger;
    clearContent();
    if (node) {
      content.appendChild(node);
      autoPlayIfVideo(node);
    }
    setOpenState(true);
    requestAnimationFrame(() => {
      const focusTarget = content.querySelector('video, iframe, embed') || dialog.querySelector('.media-modal__close');
      if (focusTarget && typeof focusTarget.focus === 'function') {
        try { focusTarget.focus(); } catch (_) {}
      }
    });
  };

  const closeModal = () => {
    if (modal.hidden) return;
    const trigger = lastTrigger;
    clearContent();
    lastTrigger = null;
    setOpenState(false);
    if (trigger && typeof trigger.focus === 'function') {
      try { trigger.focus(); } catch (_) {}
    }
  };

  modal.addEventListener('click', (event) => {
    if (event.target.matches('[data-close-modal]')) {
      event.preventDefault();
      closeModal();
      return;
    }
    if (!dialog.contains(event.target)) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });

  const isModifiedClick = (event) => (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );

  const createVideoNode = (src, label) => {
    const video = document.createElement('video');
    video.controls = true;
    video.controlsList = 'nodownload';
    video.preload = 'metadata';
    video.src = src;
    video.setAttribute('playsinline', '');
    video.autoplay = true;
    if (label) {
      video.setAttribute('aria-label', label);
    }
    return video;
  };

  const ensurePdfZoom = (src, zoom = '85') => {
    if (!src) return '';
    const parts = src.split('#');
    const base = parts.shift();
    const hash = parts.length ? parts.join('#') : '';
    const params = new URLSearchParams(hash);
    params.set('zoom', zoom);
    const hashString = params.toString();
    return hashString ? `${base}#${hashString}` : `${base}#zoom=${zoom}`;
  };

  const createPdfFrame = (src, label) => {
    const iframe = document.createElement('iframe');
    iframe.src = ensurePdfZoom(src, '85');
    iframe.title = label ? `${label} preview` : 'PDF preview';
    iframe.loading = 'lazy';
    return iframe;
  };

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-media-type]');
    if (!trigger) return;
    if (isModifiedClick(event)) return;
    const type = trigger.getAttribute('data-media-type');
    const src = trigger.getAttribute('data-media-src') || trigger.getAttribute('href');
    if (!type || !src) return;
    event.preventDefault();
    if (type === 'video') {
      openModal(trigger, createVideoNode(src, getTriggerLabel(trigger)));
    } else if (type === 'pdf') {
      openModal(trigger, createPdfFrame(src, getTriggerLabel(trigger)));
    }
  });

  setOpenState(false);
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
      '911 Dispatcher Training Device (Web + Arduino)',
      'Portfolio Website (HTML/CSS/JS)',
    ],
    fr: [
      'Détection de course et saut (Python)',
      'Calendrier dynamique (C++/Qt)',
      'Distributeur fluide et poudre (Arduino)',
      'Simulateur d\'opérateur 911 (Web + Arduino)',
      'Site portfolio (HTML/CSS/JS)',
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

    const setOpen = (open) => {
      const expanded = !!open;
      dropdown.hidden = !expanded;
      dropdown.classList.toggle('open', expanded);
      toggle.classList.toggle('open', expanded);
      toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      sidebar.classList.toggle('sidebar-expanded', expanded);
      // Update arrow direction
      toggle.textContent = expanded ? '🠅' : '🠇';
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
    const RAIN_RAMP_EXPONENT = 0.75; // < 1 brightens sooner while still letting top be dark
    let scrollClassTimer;
    let gradientMomentum = 0;
    let gradientTarget = 0.5;
    let gradientMix = 0.5;
    const GRADIENT_DECAY = 0.9;
    const GRADIENT_MAX = 50;
    const GRADIENT_LERP = 0.2;

    //Only toggles the subtle header style while actively scrolling

    function onUserScroll() {
      header.classList.add('header-rain-active');
      clearTimeout(scrollClassTimer);
      scrollClassTimer = setTimeout(() => header.classList.remove('header-rain-active'), 200);
    }
    window.addEventListener('scroll', onUserScroll, { passive: true });

    function updateGradientTrend(deltaY) {
      if (!deltaY) return;
      gradientMomentum = gradientMomentum * GRADIENT_DECAY + deltaY;
      // Keep the accumulator bounded to avoid overflow in long sessions
      gradientMomentum = Math.max(-GRADIENT_MAX, Math.min(GRADIENT_MAX, gradientMomentum));
      gradientTarget = 0.5 + 0.5 * (gradientMomentum / GRADIENT_MAX);
      gradientTarget = Math.max(0, Math.min(1, gradientTarget));
    }

    function hash32(x){
      x |= 0; x = (x ^ 61) ^ (x >>> 16); x = x + (x << 3);
      x = x ^ (x >>> 4); x = Math.imul(x, 0x27d4eb2d); x = x ^ (x >>> 15);
      return x >>> 0;
    }

    function tick() {
      const nowY = window.scrollY || window.pageYOffset || 0;
      const dy = nowY - lastY;
      lastY = nowY;
      updateGradientTrend(dy);
      gradientMix += (gradientTarget - gradientMix) * GRADIENT_LERP;
      if (gradientMix < 0) gradientMix = 0;
      else if (gradientMix > 1) gradientMix = 1;

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
      const scrollFactor = Math.max(0, Math.min(1, nowY / REVEAL_SCROLL_RANGE));
      const ramp = Math.pow(scrollFactor, RAIN_RAMP_EXPONENT);
      const visibleTopY = Math.floor((1 - ramp) * h);
      if (ramp <= 0) {
        ctx.clearRect(0, 0, w, h);
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
      const effectiveGradient = gradientMix;

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

          const gradientIndex = Math.max(
            0,
            effectiveGradient * i + (1 - effectiveGradient) * ((chainLen - 1) - i)
          );
          const baseAlpha = gradientIndex <= 0.01 ? 0.95 : Math.max(0.25, 0.9 - gradientIndex * 0.1);
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
    let gradientMomentum = 0;
    let gradientTarget = 0.5;
    let gradientMix = 0.5;
    const GRADIENT_DECAY = 0.9;
    const GRADIENT_MAX = 40;
    const GRADIENT_LERP = 0.2;
    let pausedForDark = false;

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

    function updateGradientTrend(deltaY) {
      if (!deltaY) return;
      gradientMomentum = gradientMomentum * GRADIENT_DECAY + deltaY;
      gradientMomentum = Math.max(-GRADIENT_MAX, Math.min(GRADIENT_MAX, gradientMomentum));
      gradientTarget = 0.5 + 0.5 * (gradientMomentum / GRADIENT_MAX);
      gradientTarget = Math.max(0, Math.min(1, gradientTarget));
    }

    function tick() {
      if (!cols || !rows) {
        requestAnimationFrame(tick);
        return;
      }

      if (document.body.classList.contains('dark-mode')) {
        if (!pausedForDark) {
          ctx.clearRect(0, 0, w, h);
          pausedForDark = true;
        }
        requestAnimationFrame(tick);
        return;
      }
      pausedForDark = false;

      const nowScrollY = window.scrollY || window.pageYOffset || 0;
      const dy = nowScrollY - lastScrollY;
      lastScrollY = nowScrollY;
      updateGradientTrend(dy);
      gradientMix += (gradientTarget - gradientMix) * GRADIENT_LERP;
      if (gradientMix < 0) gradientMix = 0;
      else if (gradientMix > 1) gradientMix = 1;

      const absDy = Math.abs(dy);
      const direction = dy === 0 ? 0 : (dy > 0 ? 1 : -1);
      const effectiveGradient = gradientMix;
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
          const gradientIndex = Math.max(
            0,
            effectiveGradient * i + (1 - effectiveGradient) * ((chainLen - 1) - i)
          );
          const baseAlpha = gradientIndex <= 0.01 ? 0.9 : Math.max(0.25, 0.8 - gradientIndex * 0.08);
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

// Content gutter rain (dark-mode only, mirrors header rain but lighter density)

(() => {
  function initContentRain() {
    const wrapper = document.querySelector('.content-rain-wrapper');
    if (!wrapper) return;
    const canvases = wrapper.querySelectorAll('.content-rain-canvas');
    if (!canvases.length) return;
    const contentArea = wrapper.querySelector('main');

    const hash32 = (x) => {
      x |= 0;
      x = (x ^ 61) ^ (x >>> 16);
      x = x + (x << 3);
      x = x ^ (x >>> 4);
      x = Math.imul(x, 0x27d4eb2d);
      x = x ^ (x >>> 15);
      return x >>> 0;
    };

    const cssVar = (name, fallback) => {
      const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return val || fallback;
    };

    const createState = (canvas) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      return {
        canvas,
        ctx,
        side: canvas.classList.contains('content-rain-canvas--left') ? 'left' : 'right',
        width: 0,
        height: 0,
        displayWidth: 0,
        displayHeight: 0,
        dpr: 1,
        step: 12,
        stepX: 10,
        cols: 0,
        rows: 0,
        colPositions: [],
        heads: [],
        glyphPhase: 0,
        lastGlyphChange: now,
        changeInterval: 260 + Math.random() * 140,
        lastScrollY: window.scrollY || window.pageYOffset || 0,
        accum: 0,
        gradientMomentum: 0,
        gradientTarget: 0.5,
        gradientMix: 0.5,
        paused: false
      };
    };

    const states = Array.from(canvases, createState).filter(Boolean);
    if (!states.length) return;

    const resizeState = (state, wrapperHeight, sideWidth) => {
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const cssWidth = Math.max(0, Math.round(sideWidth));
      const displayWidth = cssWidth || Math.max(1, Math.round(state.canvas.getBoundingClientRect().width));
      const displayHeight = Math.max(1, Math.round(wrapperHeight || state.canvas.getBoundingClientRect().height));

      if (displayWidth < 2 || displayHeight < 2) {
        state.cols = 0;
        state.width = 0;
        state.height = 0;
        state.colPositions = [];
        state.canvas.width = 0;
        state.canvas.height = 0;
        return;
      }

      state.canvas.width = Math.max(1, Math.floor(displayWidth * dpr));
      state.canvas.height = Math.max(1, Math.floor(displayHeight * dpr));
      state.width = state.canvas.width;
      state.height = state.canvas.height;
      state.displayWidth = displayWidth;
      state.displayHeight = displayHeight;
      state.dpr = dpr;

      const baseStep = Math.max(8, Math.round((window.innerWidth > 600 ? 10 : 9) * dpr));
      state.step = baseStep;
      state.stepX = Math.max(6, Math.round(baseStep * 0.8));
      const spacingPx = Math.max(36 * dpr, state.stepX * 2.8);
      state.cols = Math.max(1, Math.floor((displayWidth * dpr) / spacingPx));
      if ((displayWidth * dpr) > spacingPx * 1.5) {
        state.cols = Math.max(2, state.cols);
      }
      state.rows = Math.max(1, Math.floor(state.height / state.step));

      if (state.cols < 1 || state.rows < 1) {
        state.cols = 0;
        state.colPositions = [];
        return;
      }

      const prevHeads = state.heads;
      state.heads = new Array(state.cols);
      for (let i = 0; i < state.cols; i++) {
        const carry = prevHeads && prevHeads[i] !== undefined
          ? prevHeads[i]
          : Math.floor(Math.random() * state.rows);
        state.heads[i] = ((carry % state.rows) + state.rows) % state.rows;
      }

      const minX = Math.max(4 * dpr, state.stepX * 0.7);
      const maxX = Math.max(minX + dpr, state.width - minX);
      const positions = [];
      for (let i = 0; i < state.cols; i++) {
        const candidate = minX + Math.random() * (maxX - minX);
        positions.push(candidate);
      }
      positions.sort((a, b) => a - b);
      state.colPositions = positions;
    };

    const resizeAll = () => {
      const wrapperRect = wrapper.getBoundingClientRect();
      const contentRect = contentArea ? contentArea.getBoundingClientRect() : wrapperRect;
      const viewportWidth = document.documentElement.clientWidth || window.innerWidth || wrapperRect.width;
      const leftWidth = Math.max(0, Math.floor(contentRect.left));
      const rightWidth = Math.max(0, Math.floor(viewportWidth - contentRect.right));
      const insetLeft = Math.max(0, Math.round(contentRect.left - wrapperRect.left));
      const insetRight = Math.max(0, Math.round(wrapperRect.right - contentRect.right));
      wrapper.style.setProperty('--rain-left-width', `${leftWidth}px`);
      wrapper.style.setProperty('--rain-right-width', `${rightWidth}px`);
      wrapper.style.setProperty('--rain-left-offset', `${insetLeft}px`);
      wrapper.style.setProperty('--rain-right-offset', `${insetRight}px`);
      const targetHeight = Math.max(1, Math.round(wrapperRect.height || contentRect.height || window.innerHeight));
      states.forEach((state) => {
        const sideWidth = state.side === 'left' ? leftWidth : rightWidth;
        resizeState(state, targetHeight, sideWidth);
      });
    };

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => resizeAll());
      resizeObserver.observe(wrapper);
      states.forEach((state) => resizeObserver.observe(state.canvas));
    }
    window.addEventListener('resize', resizeAll, { passive: true });
    resizeAll();

    const tick = () => {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const isDark = document.body.classList.contains('dark-mode');
      const globalScroll = window.scrollY || window.pageYOffset || 0;

      states.forEach((state) => {
        if (!state.cols || !state.rows || !state.width || !state.height) return;

        if (!isDark) {
          if (!state.paused) {
            state.ctx.clearRect(0, 0, state.width, state.height);
            state.paused = true;
          }
          return;
        }
        state.paused = false;

        const dy = globalScroll - state.lastScrollY;
        state.lastScrollY = globalScroll;

        state.gradientMomentum = state.gradientMomentum * 0.9 + dy;
        state.gradientMomentum = Math.max(-40, Math.min(40, state.gradientMomentum));
        state.gradientTarget = 0.5 + 0.5 * (state.gradientMomentum / 40);
        state.gradientTarget = Math.max(0, Math.min(1, state.gradientTarget));
        state.gradientMix += (state.gradientTarget - state.gradientMix) * 0.2;
        if (state.gradientMix < 0) state.gradientMix = 0;
        else if (state.gradientMix > 1) state.gradientMix = 1;

        state.accum += dy / 25;
        state.accum = Math.max(-3, Math.min(3, state.accum));
        const sign = state.accum === 0 ? 0 : (state.accum > 0 ? 1 : -1);
        const moveSteps = Math.floor(Math.min(1, Math.abs(state.accum)));
        if (moveSteps > 0) {
          for (let c = 0; c < state.cols; c++) {
            let head = state.heads[c] + (sign < 0 ? moveSteps : -moveSteps);
            head %= state.rows;
            if (head < 0) head += state.rows;
            state.heads[c] = head;
          }
          state.accum -= sign * moveSteps;
        }

        if (now - state.lastGlyphChange >= state.changeInterval) {
          state.glyphPhase = (state.glyphPhase + 1) | 0;
          state.lastGlyphChange = now;
        }

        const ctx = state.ctx;
        ctx.clearRect(0, 0, state.width, state.height);
        ctx.font = Math.floor(state.step * 1.3) + 'px monospace';
        ctx.textBaseline = 'top';
        ctx.fillStyle = cssVar('--rain-color', 'rgba(0,255,140,0.75)');
        ctx.shadowColor = cssVar('--rain-glow', 'rgba(0,255,140,0.25)');
        ctx.shadowBlur = Math.round(state.step * 0.35);

        const featherPx = Math.round(6 * state.step);
        const bleedPx = Math.round(2 * state.step);
        const jitterPx = Math.round(2.5 * state.step);
        const effectiveGradient = state.gradientMix;
        const colPositions = state.colPositions || [];
        if (!colPositions.length) {
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
          return;
        }

        for (let c = 0; c < state.cols; c++) {
          const chainLen = 9 + (c % 5);
          const head = state.heads[c];
          const jitterSeed = hash32((c + 1) * 2654435761);
          const jitter = ((jitterSeed % 2001) / 1000 - 1) * jitterPx;
          const colTop = jitter;
          const baseX = colPositions[c] !== undefined ? colPositions[c] : (state.width * (c / Math.max(1, state.cols)));

          for (let i = 0; i < chainLen; i++) {
            const r = (head + i) % state.rows;
            const seed = ((c + 1) * 73856093) ^ ((r + 1) * 19349663) ^ (state.glyphPhase * 83492791);
            const ch = (hash32(seed) & 1) ? '1' : '0';
            const x = baseX;
            const y = r * state.step;
            if (y < colTop - bleedPx || y > state.height + featherPx) continue;

            const gradientIndex = Math.max(
              0,
              effectiveGradient * i + (1 - effectiveGradient) * ((chainLen - 1) - i)
            );
            const baseAlpha = gradientIndex <= 0.01 ? 0.95 : Math.max(0.25, 0.9 - gradientIndex * 0.1);
            const delta = y - colTop;
            let colAlpha;
            if (delta < 0) {
              const norm = 1 - (-delta / bleedPx);
              colAlpha = 0.15 + 0.4 * norm;
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
        ctx.shadowBlur = 0;
      });

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContentRain);
  } else {
    initContentRain();
  }
})();


// Header Interactive Terminal
// Tab autocompletes commands, arrow keys recall history

(() => {
  const toggleDarkMode = (langCode) => {
    const root = document.body;
    if (!root) return [];

    const willEnable = !root.classList.contains('dark-mode');
    root.classList.toggle('dark-mode', willEnable);
    if (willEnable) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }

    const message = langCode === 'fr'
      ? (willEnable
        ? 'Mode sombre activé.'
        : 'Retour au mode clair.')
      : (willEnable
        ? 'Dark mode enabled.'
        : 'Light mode restored.');

    return [message];
  };

  const COMMANDS_EN = {
    help: {
      output: [
        'Available commands:',
        //'  about\t\t- Learn more about me',
        '  dark\t\t- Toggle dark mode theme',
        '  skills\t- View technical skills',
        '  projects\t- List recent projects',
        '  work\t\t- View work experience',
        '  status\t- Show my status',
        '  contact\t- My contact information',
        '  joke\t\t- Random programming joke',
        '  help\t\t- Show this help message',
        '  clear\t\t- Clear the terminal',
        'Use Tab to autocomplete commands, and up/down keys to navigate command history.'
      ]
    },
    /*
    about: {
      output: [
        '3rd Year Computer Engineering Student at Queen\'s University',
        'Bilingual: English & French'
      ]
    },
    */
    skills: {
      output: [
        'Languages: Python, C, C++, Java, JavaScript, Assembly (NIOS II), VHDL',
        'Tools: Git, Arduino, Qt, LTspice, SolidWorks',
        'Databases: SQL, HDF5',
        'Web: HTML, CSS'
      ]
    },
    projects: {
      output: [
        { text: '1. Running & Jumping Detection (Python ML)', href: '#project-running-jumping' },
        { text: '2. Dynamic Time Allocating Calendar (C++/Qt)', href: '#project-dynamic-calendar' },
        { text: '3. Fluid Dispensing Device (Arduino)', href: '#project-fluid-dispensing' },
        { text: '4. 911 Dispatcher Training Device (Web + Arduino)', href: '#project-911-training' },
        { text: '5. Portfolio Website (HTML/CSS/JS)', href: '#project-portfolio-website' }
      ]
    },
    contact: {
      output: [
        'Email: julienchagnon9@gmail.com',
        'LinkedIn: linkedin.com/in/julienjchagnon',
        'GitHub: github.com/JulienChagnon'
      ]
    },
    dark: {
      action: toggleDarkMode
    },
    status: {
      output: [
        'Looking for 12-16 month co-op opportunities in Computer Engineering',
      ]
    },
    work: {
      output: [
        'Work Experience:',
        '',
        'Traffic Services Intern @ City of Ottawa (May - Aug 2025)',
        '  -Applied data analysis to pedestrian & vehicle survey data',
        '  -Used GIS tools to map and analyze traffic patterns',
        '  -Automated form collection with Microsoft Power Automate',
        '',
        'Graffiti Management Assistant @ City of Ottawa (May - Aug 2024)',
        '  -Managed city-wide graffiti database',
        '  -Tracked service requests and task completion',
        '  -Operated specialized removal equipment',
        '',
        'Camp Counsellor @ Mountain Bike Kids (Jun - Aug 2022)',
        '  -Supervised campers aged 8-14',
        '  -Led mountain biking outings and day trips',
      ]
    },
    joke: {
      output: null,
      jokes: [
        'Why do programmers prefer dark mode?\nBecause light attracts bugs!',
        'Why do Java developers wear glasses?\nBecause they don\'t C#!',
        'There are only 10 types of people in the world:\nThose who understand binary, and those who don\'t.',
        'Why did the computer engineer get stuck in the shower?\nThe shampoo bottle said: "Lather, Rinse, Repeat." It never said when to stop!',
        'What\'s the object-oriented way to become wealthy?\nInheritance.',
        'A programmer\'s wife tells him: "Run to the store and pick up a loaf of bread.\nIf they have eggs, get a dozen."\nThe programmer comes home with 12 loaves of bread.',
        '"Knock, knock."\n"Who\'s there?"\n...\n...\nvery long pause...\n"Java."',
        'Why did the computer show up late to work?\nIt had a hard drive!',
        'Why was the computer engineer reported missing? \n Because he didn\'t return in a while'
      ]
    }
  };

  const COMMANDS_FR = {
    aide: {
      output: [
        'Commandes disponibles :',
        //'  about\t\t- En savoir plus sur moi',
        '  sombre\t- Activer le thème sombre',
        '  competences\t- Voir mes compétences techniques',
        '  projets\t- Lister mes projets récents',
        '  travail\t- Voir mon expérience professionnelle',
        '  status\t- Afficher mon statut',
        '  contact\t- Mes coordonnées',
        '  blague\t- Blague aléatoire de programmation',
        '  aide\t\t- Afficher ce message d\'aide',
        '  clear\t\t- Effacer le terminal',
        'Utilisez Tab pour compléter les commandes, et les flèches haut/bas pour naviguer dans l\'historique des commandes.'
      ]
    },
    /*
    about: {
      output: [
        'Étudiant de 3e année en Génie informatique à l’Université Queen’s à Kingston, Ontario',
        'Bilingue : français et anglais'
      ]
    },
    */
    competences: {
      output: [
        'Langages : Python, C, C++, Java, JavaScript, Assembly (NIOS II), VHDL',
        'Outils : Git, Arduino, Qt, LTspice, SolidWorks',
        'Bases de données : SQL, HDF5',
        'Web : HTML, CSS'
      ]
    },
    projets: {
      output: [
        { text: '1. Détection de course et de saut (Python)', href: '#project-running-jumping' },
        { text: '2. Calendrier à allocation dynamique du temps (C++/Qt)', href: '#project-dynamic-calendar' },
        { text: '3. Dispositif de distribution de liquide (Arduino)', href: '#project-fluid-dispensing' },
        { text: '4. Appareil de formation pour opérateur 911 (Web + Arduino)', href: '#project-911-training' },
        { text: '5. Site Web de portfolio (HTML/CSS/JS)', href: '#project-portfolio-website' }
      ]
    },
    contact: {
      output: [
        'Courriel : julienchagnon9@gmail.com',
        'LinkedIn : linkedin.com/in/julienjchagnon',
        'GitHub : github.com/JulienChagnon'
      ]
    },
    sombre: {
      action: toggleDarkMode
    },
    status: {
      output: [
        'À la recherche de stages coop de 12 à 16 mois en génie informatique',
      ]
    },
    travail: {
      output: [
        'Expérience professionnelle :',
        '',
        'Stagiaire aux Services de la circulation @ Ville d\'Ottawa (mai - août 2025)',
        '  -Analyse de données piétonnes et routières',
        '  -Outils SIG pour cartographier les modèles de circulation',
        '  -Automatisation avec Microsoft Power Automate',
        '',
        'Assistant à la Gestion des graffitis @ Ville d\'Ottawa (mai - août 2024)',
        '  -Gestion de base de données municipale de graffitis',
        '  -Suivi des demandes de service',
        '  -Utilisation d\'équipements spécialisés de nettoyage',
        '',
        'Animateur de camp @ Mountain Bike Kids (juin - août 2022)',
        '  -Supervision de campeurs de 8 à 14 ans',
        '  -Organisation de sorties en vélo de montagne',
      ]
    },
    blague: {
      output: null,
      jokes: [
        'C\'est quoi un développeur obèse?\nQuelqu\'un qui mange trop de cookies!',
        'Comment un programmeur répare-t-il une voiture?\nIl éteint et rallume le contact.',
        'Pourquoi les programmeurs mettent des lunettes?\nParce qu\'ils passent leur vie à chercher le point-virgule manquant!',
        'Pourquoi les développeurs préfèrent le mode sombre?\nParce que la lumière attire les bugs!',
      ]
    }
};


  const currentLanguage = () => (document.body.classList.contains('fr') ? 'fr' : 'en');
  const getPrompt = (lang) => lang === 'fr' ? 'julien@profil:~$ ' : 'julien@profile:~$ ';
  const getCommands = (lang) => lang === 'fr' ? COMMANDS_FR : COMMANDS_EN;
  const commandNamesFor = (lang) => {
    const names = Object.keys(getCommands(lang));
    if (!names.includes('clear')) {
      names.push('clear');
    }
    names.sort();
    return names;
  };

  const longestCommonPrefix = (values) => {
    if (!values || values.length === 0) return '';
    let prefix = values[0];
    for (let i = 1; i < values.length; i++) {
      const value = values[i];
      while (!value.startsWith(prefix) && prefix) {
        prefix = prefix.slice(0, -1);
      }
      if (!prefix) break;
    }
    return prefix;
  };

  function initHeaderTerminal() {
    const header = document.querySelector('header.header-flex') || document.querySelector('header');
    if (!header) return;

    let term = header.querySelector('#headerTerminal');
    if (!term) {
      term = document.createElement('div');
      term.id = 'headerTerminal';
      term.setAttribute('role', 'application');
      term.setAttribute('aria-label', 'Interactive terminal');
      header.appendChild(term);
    }

    let activeLang = currentLanguage();
    let history = [];
    let historyIndex = -1;
    const MAX_LINES = 25;

    const enforceMaxLines = () => {
      const lines = term.querySelectorAll('.term-line:not(.term-input-line):not(.term-hint)');
      while (lines.length > MAX_LINES) {
        lines[0].remove();
        const updatedLines = term.querySelectorAll('.term-line:not(.term-input-line):not(.term-hint)');
        if (updatedLines.length <= MAX_LINES) break;
      }
    };

    const addPermanentHint = () => {
      const hint = document.createElement('div');
      hint.className = 'term-line term-hint';
      hint.textContent = activeLang === 'fr'
        ? "# Tapez 'aide' pour voir les commandes disponibles"
        : "# Type 'help' to see available commands";
      term.insertBefore(hint, term.firstChild);
    };

    const createOutputLine = (line) => {
      if (line === undefined || line === null) return null;
      const div = document.createElement('div');
      div.className = 'term-line term-output';

      if (typeof line === 'object') {
        const { prefix = '', suffix = '', text = '', href, target, title } = line;
        if (prefix) {
          div.appendChild(document.createTextNode(prefix));
        }

        if (href) {
          const anchor = document.createElement('a');
          anchor.className = 'term-link';
          anchor.href = href;
          anchor.textContent = text || href;
          if (title) {
            anchor.title = title;
          }
          if (target === '_blank') {
            anchor.target = '_blank';
            anchor.rel = 'noopener noreferrer';
          }
          div.appendChild(anchor);
        } else if (text) {
          div.appendChild(document.createTextNode(text));
        }

        if (suffix) {
          div.appendChild(document.createTextNode(suffix));
        }

        return div;
      }

      div.textContent = String(line);
      return div;
    };

    const clearTerminal = () => {
      term.innerHTML = '';
      addPermanentHint();
      createInputLine();
    };

    const printOutput = async (lines) => {
      for (const line of lines) {
        const outputNode = createOutputLine(line);
        if (!outputNode) continue;
        term.insertBefore(outputNode, term.lastElementChild);
        enforceMaxLines();
        await new Promise(resolve => setTimeout(resolve, 15));
      }
    };

    const printPrompt = (command) => {
      const line = document.createElement('div');
      line.className = 'term-line term-prompt';

      const prompt = document.createElement('span');
      prompt.className = 'prompt';
      prompt.textContent = getPrompt(activeLang);

      const typed = document.createElement('span');
      typed.className = 'typed';
      typed.textContent = command;

      line.appendChild(prompt);
      line.appendChild(typed);
      term.insertBefore(line, term.lastElementChild);
      enforceMaxLines();
    };

    const executeCommand = async (input) => {
      const cmd = input.trim().toLowerCase();
      const commands = getCommands(activeLang);

      // Only add non-empty commands to history
      if (cmd !== '') {
        history.push(input);
      }
      historyIndex = history.length;

      printPrompt(input);

      if (cmd === '') return; // Allow empty lines

      if (cmd === 'clear') {
        clearTerminal();
        return;
      }

      if (commands[cmd]) {
        // Special handling for joke command - pick random joke
        if ((cmd === 'joke' || cmd === 'blague') && commands[cmd].jokes) {
          const jokes = commands[cmd].jokes;
          const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
          await printOutput(randomJoke.split('\n'));
        } else {
          const commandDef = commands[cmd];
          let handled = false;

          if (typeof commandDef.action === 'function') {
            const result = await commandDef.action(activeLang);
            if (result !== undefined && result !== null) {
              const lines = Array.isArray(result)
                ? result.filter((line) => line !== undefined && line !== null)
                : [String(result)];
              if (lines.length) {
                await printOutput(lines);
                handled = true;
              }
            }
          }

          if (!handled && commandDef.output) {
            await printOutput(commandDef.output);
          }
        }
      } else {
        const notFound = activeLang === 'fr'
          ? `Commande non trouvée : ${cmd}. Tapez 'aide' pour voir les commandes disponibles.`
          : `Command not found: ${cmd}. Type 'help' to see available commands.`;
        await printOutput([notFound]);
      }
    };

    const createInputLine = () => {
      const line = document.createElement('div');
      line.className = 'term-line term-input-line';

      const prompt = document.createElement('span');
      prompt.className = 'prompt';
      prompt.textContent = getPrompt(activeLang);

      const inputContainer = document.createElement('span');
      inputContainer.className = 'term-input-container';

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'term-input';
      input.setAttribute('aria-label', 'Terminal command input');
      input.setAttribute('size', '1');
      input.spellcheck = false;
      input.autocomplete = 'off';
      input.style.width = '1ch';

      const cursor = document.createElement('span');
      cursor.className = 'term-cursor-block';

      line.appendChild(prompt);
      inputContainer.appendChild(input);
      inputContainer.appendChild(cursor);
      line.appendChild(inputContainer);
      term.appendChild(line);

      // Adjust input size as user types (add 1 for cursor space)
      input.addEventListener('input', () => {
        const len = input.value.length;
        const units = Math.max(1, len + 1);
        input.style.width = units + 'ch';
        input.setAttribute('size', Math.max(2, len + 1));
      });

      input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
          const command = input.value;
          input.disabled = true;
          cursor.style.display = 'none';
          await executeCommand(command);
          input.value = '';
          input.setAttribute('size', '1');
          input.style.width = '1ch';
          input.disabled = false;
          cursor.style.display = 'inline-block';
          input.focus();
        } else if (e.key === 'Tab') {
          e.preventDefault();
          const allCommands = commandNamesFor(activeLang);
          const rawValue = input.value;
          const trimmedValue = rawValue.trim().toLowerCase();
          const matches = trimmedValue
            ? allCommands.filter(cmd => cmd.startsWith(trimmedValue))
            : allCommands;
          if (!matches.length) {
            return;
          }
          let completed = '';
          if (!trimmedValue) {
            completed = matches[0];
          } else if (matches.length === 1) {
            completed = matches[0];
          } else {
            const prefix = longestCommonPrefix(matches);
            completed = prefix.length > trimmedValue.length ? prefix : matches[0];
          }
          input.value = completed;
          const widthUnits = Math.max(1, completed.length + 1);
          input.setAttribute('size', Math.max(2, completed.length + 1));
          input.style.width = widthUnits + 'ch';
          const caretPos = completed.length;
          if (typeof input.setSelectionRange === 'function') {
            input.setSelectionRange(caretPos, caretPos);
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (historyIndex > 0) {
            historyIndex--;
            input.value = history[historyIndex];
            input.setAttribute('size', Math.max(2, input.value.length + 1));
            input.style.width = Math.max(1, input.value.length + 1) + 'ch';
            const caret = input.value.length;
            if (typeof input.setSelectionRange === 'function') {
              input.setSelectionRange(caret, caret);
            }
          }
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (historyIndex < history.length - 1) {
            historyIndex++;
            input.value = history[historyIndex];
            input.setAttribute('size', Math.max(2, input.value.length + 1));
            input.style.width = Math.max(1, input.value.length + 1) + 'ch';
            const caret = input.value.length;
            if (typeof input.setSelectionRange === 'function') {
              input.setSelectionRange(caret, caret);
            }
          } else {
            historyIndex = history.length;
            input.value = '';
            input.setAttribute('size', '2');
            input.style.width = '2ch';
            if (typeof input.setSelectionRange === 'function') {
              input.setSelectionRange(0, 0);
            }
          }
        }
      });

      // Click anywhere on terminal to focus input
      term.addEventListener('click', (e) => {
        if (!input.disabled && e.target !== input) {
          input.focus();
        }
      });

      // Capture any keypresses on the page and direct them to terminal
      document.addEventListener('keydown', (e) => {
        // Don't capture if user is typing in another input/textarea
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
          return;
        }
        if (input.disabled) {
          return;
        }
        if (e.ctrlKey || e.altKey || e.metaKey || e.key.startsWith('F')) {
          return;
        }
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Escape'].includes(e.key) && e.target !== input) {
          return;
        }
        // Focus the terminal input
        if (document.activeElement !== input) {
          input.focus();
        }
      });

      setTimeout(() => input.focus(), 100);
    };

    const handleLanguageChange = async (event) => {
      const lang = event && event.detail && event.detail.lang ? event.detail.lang : currentLanguage();
      if (lang !== activeLang) {
        activeLang = lang;
        clearTerminal();
      }
    };

    window.addEventListener('portfolio:languagechange', handleLanguageChange);

    // Initialize terminal with permanent hint
    addPermanentHint();
    createInputLine();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeaderTerminal, { once: true });
  } else {
    initHeaderTerminal();
  }
})();
