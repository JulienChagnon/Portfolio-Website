
//See More Button on Job History
(() => {
  const btn = document.getElementById('toggleJobs');
  const moreJobs = document.querySelector('.more-jobs');
  if (!btn || !moreJobs) return; // gracefully skip if not present
  const labelSpan = btn.querySelector('.lang-text') || btn;
  const updateToggleLabel = (isOpen) => {
    const lang = document.body.classList.contains('fr') ? 'fr' : 'en';
    const key  = isOpen ? 'hide' : 'show';
    const attr = `data-${lang}-${key}`;
    const baseLabel = btn.getAttribute(attr);
    if (baseLabel) {
      labelSpan.textContent = isOpen ? `${baseLabel} ↑` : baseLabel;
    }
    btn.classList.toggle('see-more--less', isOpen);
    btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  };
  btn.addEventListener('click', () => {
    const isOpen = moreJobs.classList.toggle('show');
    updateToggleLabel(isOpen);
  });
  updateToggleLabel(moreJobs.classList.contains('show'));
  window.addEventListener('portfolio:languagechange', () => {
    updateToggleLabel(moreJobs.classList.contains('show'));
  });
})();

// Keep project cards open while pointer stays inside the stack
(() => {
  const stack = document.querySelector('.project-stack');
  if (!stack) return;
  const cards = Array.from(stack.querySelectorAll('.project-card'));
  if (!cards.length) return;
  const collapseBtn = document.getElementById('collapseProjects');

  // Skip scroll-locking while the user is actively scrolling to avoid jitter
  let recentlyScrolled = false;
  let scrollTimer = null;
  const markScroll = () => {
    recentlyScrolled = true;
    if (scrollTimer) clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      recentlyScrolled = false;
    }, 140);
  };
  window.addEventListener('scroll', markScroll, { passive: true });
  window.addEventListener('wheel', markScroll, { passive: true });
  window.addEventListener('touchmove', markScroll, { passive: true });

  const closeAll = () => {
    const openCards = cards.filter((card) => card.classList.contains('is-open'));
    if (!openCards.length) return;

    // If a fast scroll is in progress, collapse without fighting the scroll position
    if (recentlyScrolled) {
      openCards.forEach((card) => card.classList.remove('is-open'));
      // Update scrollbar after fast close
      if (typeof window.__updateScrollbarOverlay === 'function') {
        requestAnimationFrame(() => {
          window.__updateScrollbarOverlay();
        });
      }
      return;
    }

    const scrollY = window.scrollY || window.pageYOffset || 0;

    const hasContentAboveScroll = openCards.some((card) => {
      const rect = card.getBoundingClientRect();
      const cardTop = scrollY + rect.top;
      return cardTop < scrollY;
    });

    //If no content is collapsing above scroll position, just collapse normal
    if (!hasContentAboveScroll) {
      openCards.forEach((card) => card.classList.remove('is-open'));
      // Update scrollbar after simple close
      if (typeof window.__updateScrollbarOverlay === 'function') {
        requestAnimationFrame(() => {
          window.__updateScrollbarOverlay();
        });
      }
      return;
    }

    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;

    // Find the lowest open card that is still visible in the viewport to use as anchor
    let anchor = null;
    let anchorTopBefore = 0;
    for (let i = cards.length - 1; i >= 0; i -= 1) {
      const rect = cards[i].getBoundingClientRect();
      if (rect.top < viewportHeight) {
        anchor = cards[i];
        anchorTopBefore = rect.top;
        break;
      }
    }

    if (!anchor) {
      anchor = stack;
      const rect = stack.getBoundingClientRect();
      anchorTopBefore = Math.min(rect.top, viewportHeight * 0.6);
    }

    // Signal sidebar to use smooth transitions during collapse
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.classList.add('collapsing-projects');
    }

    const htmlEl = document.documentElement;
    const originalScrollBehavior = htmlEl.style.scrollBehavior;
    htmlEl.style.scrollBehavior = 'auto';

    openCards.forEach((card) => card.classList.remove('is-open'));

    // Continuously adjust scroll to keep anchor fixed during the entire collapse
    let animating = true;
    const startTime = performance.now();
    const duration = 650;

    const maintainPosition = () => {
      if (!animating) return;

      const currentTop = anchor.getBoundingClientRect().top;
      if (Math.abs(currentTop - anchorTopBefore) > 0.5) {
        const shift = currentTop - anchorTopBefore;
        const currentScroll = window.scrollY || window.pageYOffset || 0;
        window.scrollTo(0, Math.max(0, currentScroll + shift));
      }

      if (performance.now() - startTime < duration + 50) {
        requestAnimationFrame(maintainPosition);
      } else {
        animating = false;
        htmlEl.style.scrollBehavior = originalScrollBehavior;
        // Remove smooth transition class from sidebar after animation completes
        if (sidebar) {
          setTimeout(() => {
            sidebar.classList.remove('collapsing-projects');
          }, 100);
        }
        // Final scrollbar update after collapse animation completes
        if (typeof window.__updateScrollbarOverlay === 'function') {
          window.__updateScrollbarOverlay();
        }
      }
    };

    requestAnimationFrame(maintainPosition);
  };

  const pointerActivates = (event) => {
    if (!event || typeof event.pointerType === 'undefined') return true;
    return event.pointerType === 'mouse' || event.pointerType === 'pen';
  };

  let modalOpen = document.body.classList.contains('media-modal-open');
  let pendingClose = false;

  const shouldCloseNow = () => (
    !stack.matches(':hover') && !stack.contains(document.activeElement)
  );

  const requestClose = (event) => {
    if (event && !pointerActivates(event)) return;
    if (modalOpen) {
      pendingClose = true;
      return;
    }
    if (shouldCloseNow()) closeAll();
  };

  const clearPending = () => {
    pendingClose = false;
  };

  cards.forEach((card) => {
    const markOpen = () => {
      card.classList.add('is-open');
      clearPending();
      // Update scrollbar immediately when project opens
      if (typeof window.__updateScrollbarOverlay === 'function') {
        requestAnimationFrame(() => {
          window.__updateScrollbarOverlay();
        });
      }
    };

    // Update scrollbar after expansion animation completes
    const details = card.querySelector('.project-card-details');
    if (details) {
      details.addEventListener('transitionend', (event) => {
        // Only update for the max-height transition (not other properties)
        if (event.propertyName === 'max-height' && card.classList.contains('is-open')) {
          if (typeof window.__updateScrollbarOverlay === 'function') {
            window.__updateScrollbarOverlay();
          }
        }
      });
    }

    card.addEventListener('mouseenter', markOpen);
    card.addEventListener('pointerenter', (event) => {
      if (!pointerActivates(event)) return;
      markOpen();
    });
    card.addEventListener('focusin', markOpen);
  });

  const handleStackFocusOut = (event) => {
    const next = event.relatedTarget;
    if (next && stack.contains(next)) return;
    requestClose();
  };

  stack.addEventListener('pointerleave', requestClose);
  stack.addEventListener('pointercancel', requestClose);
  stack.addEventListener('mouseleave', requestClose);
  stack.addEventListener('focusout', handleStackFocusOut);
  stack.addEventListener('focusin', clearPending);

  const flushPendingClose = () => {
    if (!pendingClose) return;
    pendingClose = false;
    if (shouldCloseNow()) closeAll();
  };

  const updateModalState = (open) => {
    modalOpen = open;
    if (!modalOpen) {
      flushPendingClose();
    }
  };

  window.addEventListener('portfolio:media-modal', (event) => {
    const open = !!(event && event.detail && event.detail.open);
    updateModalState(open);
  });

  updateModalState(modalOpen);

  if (collapseBtn) {
    collapseBtn.addEventListener('click', () => {
      pendingClose = false;
      closeAll();
    });
  }
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

    // Check if we're in the middle of a project collapse animation
    const isCollapsing = sidebar.classList.contains('collapsing-projects');

    if (scrollY >= stickPoint) {
      // Stick to viewport
      if (!isSticky) {
        // Prevent flash by ensuring smooth transition
        const currentTop = sidebar.getBoundingClientRect().top;
        sidebar.style.position = 'fixed';
        sidebar.style.top = currentTop + 'px';
        // Force reflow then animate to target position
        void sidebar.offsetHeight;
        // Use longer transition during collapse for smoothness
        sidebar.style.transition = isCollapsing
          ? 'top 0.65s cubic-bezier(0.23, 1, 0.32, 1)'
          : 'top 0.1s ease-out';
        sidebar.style.top = STICK_OFFSET + 'px';
        isSticky = true;
      }
    } else {
      // Flow with page
      if (isSticky) {
        // During collapse, use smooth transition instead of 'none'
        sidebar.style.transition = isCollapsing
          ? 'top 0.65s cubic-bezier(0.23, 1, 0.32, 1)'
          : 'none';
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
    const detail = { open };
    try {
      window.dispatchEvent(new CustomEvent('portfolio:media-modal', { detail }));
    } catch (err) {
      try {
        const legacy = document.createEvent('CustomEvent');
        legacy.initCustomEvent('portfolio:media-modal', false, false, detail);
        window.dispatchEvent(legacy);
      } catch (_) {}
    }
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
      '911 Dispatcher Training Device (Web + Arduino)',
      'Fluid and Powder Dispensing Device (Arduino)',
      'Portfolio Website (HTML/CSS/JS)',
    ],
    fr: [
      'Détection de course et saut (Python)',
      'Calendrier dynamique (C++/Qt)',
      'Simulateur d\'opérateur 911 (Web + Arduino)',
      'Distributeur fluide et poudre (Arduino)',
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
      const cards = projectsSection.querySelectorAll('.project-card');
      list.innerHTML = '';
      cards.forEach((box, index) => {
        const titleNode = box.querySelector('.project-card-title .lang-text') || box.querySelector('.lang-text');
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

        // Handle click to properly open project card and scroll
        link.addEventListener('click', (event) => {
          event.preventDefault();

          const targetElement = document.getElementById(anchor);
          if (!targetElement) return;

          const stack = document.querySelector('.project-stack');
          if (stack) {
            const openCards = stack.querySelectorAll('.project-card.is-open');
            openCards.forEach((card) => card.classList.remove('is-open'));
          }

          setTimeout(() => {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

            setTimeout(() => {
              targetElement.classList.add('is-open');

  
              if (typeof window.__updateScrollbarOverlay === 'function') {
                requestAnimationFrame(() => {
                  window.__updateScrollbarOverlay();
                });
              }
            }, 500); 
          }, 700); 
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

// Scrollbar contrast color: white over the dark header, smoothly blending to black over light content
(() => {
  const doc = document.documentElement;
  if (!doc) return;
  const header = document.querySelector('header.header-flex');
  const COLOR_LIGHT = [255, 255, 255];
  const COLOR_DARK = [150, 150, 150];
  const COLOR_DARK_MODE = 'rgb(245, 245, 245)';
  const TRANSITION_RANGE = 220; // px window around the header bottom

  const setColor = (value) => doc.style.setProperty('--scrollbar-color', value);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const mixChannel = (start, end, t) => Math.round(start + (end - start) * t);
  const mixColor = (start, end, t) => (
    `rgb(${mixChannel(start[0], end[0], t)}, ${mixChannel(start[1], end[1], t)}, ${mixChannel(start[2], end[2], t)})`
  );

  const updateScrollbarColor = () => {
    if ((typeof window !== 'undefined' && window.__overlayDragging) || !doc) return;
    const body = document.body;
    const isDarkMode = body && body.classList.contains('dark-mode');
    if (isDarkMode) {
      setColor(COLOR_DARK_MODE);
      return;
    }

    if (!header) {
      setColor('rgb(255, 255, 255)');
      return;
    }

    const headerBottom = header.offsetTop + header.offsetHeight;
    const scrollTop = window.scrollY || window.pageYOffset || 0;
    const transitionStart = Math.max(0, headerBottom - TRANSITION_RANGE);
    const t = clamp(
      (scrollTop - transitionStart) / Math.max(1, TRANSITION_RANGE),
      0,
      1
    );
    setColor(mixColor(COLOR_LIGHT, COLOR_DARK, t));
  };

  // Initialize and keep updated
  window.addEventListener('scroll', updateScrollbarColor, { passive: true });
  window.addEventListener('resize', updateScrollbarColor);
  window.addEventListener('load', updateScrollbarColor);
  document.addEventListener('DOMContentLoaded', updateScrollbarColor);
  updateScrollbarColor();
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

  function updateOverlay(options = {}) {
    const { disableTransition = false } = options;
    // Skip scroll-driven updates while dragging
    if (dragging) return;
    computeMetrics();
    const y = window.scrollY || window.pageYOffset || 0;
    const t = Math.min(1, Math.max(0, y / maxScroll));
    const top = Math.round(maxThumbTop * t);

    // Disable transition temporarily during scroll events for immediate feedback
    if (disableTransition) {
      thumb.classList.add('dragging');
      thumb.style.transform = `translateY(${top}px)`;
      // Re-enable transition after a brief delay
      setTimeout(() => {
        thumb.classList.remove('dragging');
      }, 50);
    } else {
      thumb.style.transform = `translateY(${top}px)`;
    }
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
    thumb.classList.add('dragging');
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
    thumb.classList.remove('dragging');
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

  window.addEventListener('scroll', () => { ensureAttached(); updateOverlay({ disableTransition: true }); }, { passive: true });
  window.addEventListener('resize', () => { ensureAttached(); updateOverlay(); });
  window.addEventListener('load', () => { ensureAttached(); updateOverlay(); });
  document.addEventListener('DOMContentLoaded', () => { ensureAttached(); updateOverlay(); });

  // Expose updateOverlay globally so project cards can trigger updates (with transition enabled)
  window.__updateScrollbarOverlay = () => updateOverlay({ disableTransition: false });
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

    const MAX_DPR = 1.25; // cap resolution 
    const FRAME_INTERVAL = 1000 / 30; //limit to 30fps
    const canvas = document.createElement('canvas');
    canvas.id = 'headerRainCanvas';
    header.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let dpr = Math.max(1, Math.min(MAX_DPR, window.devicePixelRatio || 1));
    let w = 0, h = 0, step = 14 * dpr, stepX = 14 * dpr, cols = 0, rows = 0;
    let heads = [];
    let lastFrameTime = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    let isHeaderVisible = true;
    let pausedForVisibility = false;

    const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

    function size() {
      const cw = Math.max(1, header.clientWidth);
      const ch = Math.max(1, header.clientHeight);
      dpr = Math.max(1, Math.min(MAX_DPR, window.devicePixelRatio || 1));
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

    const updateVisibilityFallback = () => {
      const rect = header.getBoundingClientRect();
      const viewport = window.innerHeight || document.documentElement.clientHeight || 0;
      isHeaderVisible = rect.bottom > 0 && rect.top < viewport * 1.1;
    };

    if (typeof IntersectionObserver !== 'undefined') {
      const io = new IntersectionObserver((entries) => {
        if (!entries || !entries.length) return;
        const entry = entries[0];
        isHeaderVisible = entry.isIntersecting || entry.intersectionRatio > 0.05;
      }, { threshold: [0, 0.05, 0.2, 0.4, 0.6] });
      io.observe(header);
    } else {
      window.addEventListener('scroll', updateVisibilityFallback, { passive: true });
      window.addEventListener('resize', updateVisibilityFallback, { passive: true });
      updateVisibilityFallback();
    }

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
      const nowTs = now();
      if (nowTs - lastFrameTime < FRAME_INTERVAL) {
        requestAnimationFrame(tick);
        return;
      }
      lastFrameTime = nowTs;

      if (!isHeaderVisible) {
        if (!pausedForVisibility) {
          ctx.clearRect(0, 0, w, h);
          pausedForVisibility = true;
        }
        requestAnimationFrame(tick);
        return;
      }
      pausedForVisibility = false;

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
      const tnow = nowTs;
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
    const GUTTER_BUFFER = 18; // keep a small gap between rain and readable content

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
      const pxWidth = displayWidth * dpr;
      const spacingPx = Math.max(24 * dpr, state.stepX * 1.9);
      const minSpacingPx = Math.max(18 * dpr, state.stepX * 1.45);
      let cols = Math.max(1, Math.floor((pxWidth + spacingPx * 0.35) / spacingPx));
      if (pxWidth > spacingPx * 1.2) cols += 1;
      if (pxWidth > spacingPx * 2.4) cols += 1;
      const maxCols = Math.max(1, Math.floor(pxWidth / minSpacingPx));
      state.cols = Math.min(cols, maxCols);
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
      const usableWidth = Math.max(0, maxX - minX);
      const lane = state.cols > 0 ? usableWidth / state.cols : usableWidth;
      for (let i = 0; i < state.cols; i++) {
        const jitterRange = lane * 0.28;
        const candidate =
          minX +
          lane * (i + 0.5) +
          (Math.random() - 0.5) * jitterRange;
        const clamped = Math.max(minX, Math.min(maxX - dpr, candidate));
        positions.push(clamped);
      }
      positions.sort((a, b) => a - b);
      state.colPositions = positions;
    };

    const resizeAll = () => {
      const wrapperRect = wrapper.getBoundingClientRect();
      const contentRect = contentArea ? contentArea.getBoundingClientRect() : wrapperRect;
      const viewportWidth = document.documentElement.clientWidth || window.innerWidth || wrapperRect.width;
      const rawLeftWidth = Math.max(0, Math.floor(contentRect.left));
      const rawRightWidth = Math.max(0, Math.floor(viewportWidth - contentRect.right));
      const rawInsetLeft = Math.max(0, Math.round(contentRect.left - wrapperRect.left));
      const rawInsetRight = Math.max(0, Math.round(wrapperRect.right - contentRect.right));
      const leftWidth = Math.max(0, rawLeftWidth - GUTTER_BUFFER);
      const rightWidth = Math.max(0, rawRightWidth - GUTTER_BUFFER);
      const insetLeft = Math.max(0, rawInsetLeft - GUTTER_BUFFER);
      const insetRight = Math.max(0, rawInsetRight - GUTTER_BUFFER);
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
          const chainLen = 12 + (c % 7);
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

    try { window.dispatchEvent(new Event('scroll')); } catch (_) {}

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
        'Programming experience: C/C++, Python, Java, Assembly (Nios II), JavaScript, VHDL, Qt framework',
        'Libraries and Frameworks: Qt, Matplotlib, Pandas, Scikit-learn, Seaborn, h5py',
        'Tools: Git, Arduino, LTspice, SolidWorks',
        'Databases: SQL, HDF5',
        'Web: HTML, CSS'
      ]
    },
    projects: {
      output: [
        { text: '1. Running & Jumping Detection (Python ML)', href: '#project-running-jumping' },
        { text: '2. Dynamic Time Allocating Calendar (C++/Qt)', href: '#project-dynamic-calendar' },
        { text: '3. 911 Dispatcher Training Device (Web + Arduino)', href: '#project-911-training' },
        { text: '4. Fluid Dispensing Device (Arduino)', href: '#project-fluid-dispensing' },
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
        'Seeking a 12-16 month co-op placement in Computer Engineering related fields',
      ]
    },
    work: {
      output: [
        'TRAFFIC SERVICES INTERN @ City of Ottawa\n(May - Aug 2025)',
        '  -Applied data analysis to pedestrian & vehicle',
        '    survey data',
        '  -Used GIS tools to map and analyze traffic patterns',
        '  -Automated form collection with Microsoft Power',
        '   Automate',
        '\n',
        'GRAFFITI MANAGEMENT ASSISTANT @ City of Ottawa\n(May - Aug 2024)',
        '  -Managed city-wide graffiti database',
        '  -Tracked service requests and task completion',
        '  -Operated specialized removal equipment',
        '\n',
        'CAMP COUNSELLOR @ Mountain Bike Kids\n(Jun - Aug 2022)',
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
        'Why did the computer engineer get stuck in the shower?\nThe shampoo bottle said: "Lather, Rinse, Repeat."',
        'What\'s the object-oriented way to become wealthy?\nInheritance.',
        'A programmer\'s wife tells him: "Run to the store and pick up a loaf of bread.\nIf they have eggs, get a dozen."\nThe programmer comes home with 12 loaves of bread.',
        '"Knock, knock."\n"Who\'s there?"\n...\n...\nvery long pause...\n"Python."',
        'Why did the computer show up late to work?\nIt had a hard drive!',
        'Why was the computer engineer reported missing?\nBecause he didn\'t return in a while'
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
        '  statut\t- Afficher mon statut',
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
        { text: '3. Appareil de formation pour opérateur 911 (Web + Arduino)', href: '#project-911-training' },
        { text: '4. Dispositif de distribution de liquide (Arduino)', href: '#project-fluid-dispensing' },
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
        'STAGIAIRE AUX SERVICES DE LA CIRCULATION @ Ville d\'Ottawa\n(mai - août 2025)',
        '  -Analyse de données piétonnes et routières',
        '  -Outils SIG pour cartographier les modèles de circulation',
        '  -Automatisation avec Microsoft Power Automate',
        '\n',
        'ASSISTANT À LA GESTION DES GRAFFITIS @ Ville d\'Ottawa\n(mai - août 2024)',
        '  -Gestion de la base de données municipale de graffitis',
        '  -Suivi des demandes de service et de l’avancement des tâches',
        '  -Utilisation d\'équipements spécialisés de nettoyage',
        '\n',
        'ANIMATEUR DE CAMP @ Mountain Bike Kids\n(juin - août 2022)',
        '  -Supervision de campeurs âgés de 8 à 14 ans',
        '  -Organisation de sorties en vélo de montagne et excursions',
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

COMMANDS_FR.statut = COMMANDS_FR.status;


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

    let wrapper = header.querySelector('#headerTerminalWrapper');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.id = 'headerTerminalWrapper';
      header.appendChild(wrapper);
    }

    let term = header.querySelector('#headerTerminal');
    if (!term) {
      term = document.createElement('div');
      term.id = 'headerTerminal';
      term.setAttribute('role', 'application');
      term.setAttribute('aria-label', 'Interactive terminal');
    } else {
      term.setAttribute('role', 'application');
      term.setAttribute('aria-label', 'Interactive terminal');
    }
    if (term.parentElement !== wrapper) {
      wrapper.appendChild(term);
    }

    // Remove any legacy inline hint nodes from previous builds
    term.querySelectorAll('.term-hint').forEach(node => node.remove());

    let hintOverlay = wrapper.querySelector('#headerTerminalHint');
    if (!hintOverlay) {
      hintOverlay = header.querySelector('#headerTerminalHint');
    }
    if (!hintOverlay) {
      hintOverlay = document.createElement('div');
      hintOverlay.id = 'headerTerminalHint';
    }
    hintOverlay.setAttribute('role', 'status');
    hintOverlay.setAttribute('aria-live', 'polite');
    if (term && term.parentElement === wrapper) {
      if (hintOverlay.parentElement !== wrapper) {
        wrapper.insertBefore(hintOverlay, term);
      } else if (hintOverlay.nextElementSibling !== term) {
        wrapper.insertBefore(hintOverlay, term);
      }
    } else if (hintOverlay.parentElement !== wrapper) {
      wrapper.appendChild(hintOverlay);
    }

    let activeLang = currentLanguage();
    let history = [];
    let historyIndex = -1;
    let activeInputLine = null;
    let activeInput = null;
    let activeCursor = null;
    let pendingAutoCommand = null;
    const autoCommandRun = { en: false, fr: false };
    const MAX_LINES = 250;
    const scrollTerminalToBottom = () => {
      if (!term) return;
      requestAnimationFrame(() => {
        term.scrollTop = term.scrollHeight;
      });
    };

    const enforceMaxLines = () => {
      const lines = term.querySelectorAll('.term-line:not(.term-input-line):not(.term-hint)');
      while (lines.length > MAX_LINES) {
        lines[0].remove();
        const updatedLines = term.querySelectorAll('.term-line:not(.term-input-line):not(.term-hint)');
        if (updatedLines.length <= MAX_LINES) break;
      }
    };

    const addPermanentHint = () => {
      if (!hintOverlay) return;
      hintOverlay.textContent = activeLang === 'fr'
        ? "# TERMINAL INTERACTIF: Tapez 'aide' pour voir les commandes disponibles"
        : "# INTERACTIVE TERMINAL: Type 'help' to see available commands";
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

    const clearTerminal = ({ hiddenInput = false } = {}) => {
      term.innerHTML = '';
      term.scrollTop = 0;
      addPermanentHint();
      activeInputLine = null;
      activeInput = null;
      activeCursor = null;
      createInputLine({ hidden: hiddenInput });
    };

    const printOutput = async (lines, { lineDelay = 15, charDelay = 0 } = {}) => {
      for (const line of lines) {
        if (charDelay > 0 && typeof line === 'string') {
          const outputNode = document.createElement('div');
          outputNode.className = 'term-line term-output';
          term.insertBefore(outputNode, term.lastElementChild);
          enforceMaxLines();
          scrollTerminalToBottom();
          const text = String(line);
          for (const char of text) {
            outputNode.textContent += char;
            await new Promise(resolve => setTimeout(resolve, charDelay));
          }
          await new Promise(resolve => setTimeout(resolve, lineDelay));
          continue;
        }

        const outputNode = createOutputLine(line);
        if (!outputNode) continue;
        term.insertBefore(outputNode, term.lastElementChild);
        enforceMaxLines();
        scrollTerminalToBottom();
        await new Promise(resolve => setTimeout(resolve, lineDelay));
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
      scrollTerminalToBottom();
    };

    const hideInputLine = () => {
      if (!activeInputLine) return;
      activeInputLine.style.visibility = 'hidden';
      activeInputLine.style.pointerEvents = 'none';
      if (activeInput) {
        activeInput.disabled = true;
        activeInput.blur();
      }
      if (activeCursor) {
        activeCursor.style.display = 'none';
      }
    };

    const showInputLine = () => {
      if (!activeInputLine) {
        createInputLine();
        return;
      }
      activeInputLine.style.visibility = '';
      activeInputLine.style.pointerEvents = '';
      if (activeCursor) {
        activeCursor.style.display = 'inline-block';
      }
      if (activeInput) {
        activeInput.disabled = false;
        setTimeout(() => {
          activeInput.focus();
          scrollTerminalToBottom();
        }, 0);
      }
    };

    const executeCommand = async (input, options = {}) => {
      const {
        recordHistory = true,
        outputOptions = undefined
      } = options;
      const cmd = input.trim().toLowerCase();
      const commands = getCommands(activeLang);

      // Only add non-empty commands to history
      if (recordHistory && cmd !== '') {
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
          await printOutput(randomJoke.split('\n'), outputOptions);
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
                await printOutput(lines, outputOptions);
                handled = true;
              }
            }
          }

          if (!handled && commandDef.output) {
            await printOutput(commandDef.output, outputOptions);
          }
        }
      } else {
        const notFound = activeLang === 'fr'
          ? `Commande non trouvée : ${cmd}. Tapez 'aide' pour voir les commandes disponibles.`
          : `Command not found: ${cmd}. Type 'help' to see available commands.`;
        await printOutput([notFound], outputOptions);
      }
    };

    const runAutoStatusCommand = ({ force = false } = {}) => {
      const langKey = activeLang === 'fr' ? 'fr' : 'en';
      if (!force && autoCommandRun[langKey]) {
        return Promise.resolve();
      }
      autoCommandRun[langKey] = true;
      const autoCommand = langKey === 'fr' ? 'statut' : 'status';
      hideInputLine();
      const execPromise = executeCommand(autoCommand, {
        recordHistory: false,
        outputOptions: { charDelay: 8, lineDelay: 28 }
      });
      pendingAutoCommand = execPromise;
      return execPromise
        .catch((err) => {
          console.error('Automatic status command failed', err);
        })
        .finally(() => {
          if (pendingAutoCommand === execPromise) {
            pendingAutoCommand = null;
          }
          showInputLine();
        });
    };

    function createInputLine({ hidden = false } = {}) {
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
      scrollTerminalToBottom();

      activeInputLine = line;
      activeInput = input;
      activeCursor = cursor;

      if (hidden) {
        line.style.visibility = 'hidden';
        line.style.pointerEvents = 'none';
        input.disabled = true;
        cursor.style.display = 'none';
      } else {
        line.style.visibility = '';
        line.style.pointerEvents = '';
        input.disabled = false;
        cursor.style.display = 'inline-block';
      }

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

      if (!hidden) {
        setTimeout(() => input.focus(), 100);
      }
    }

    const handleLanguageChange = async (event) => {
      const lang = event && event.detail && event.detail.lang ? event.detail.lang : currentLanguage();
      if (lang !== activeLang) {
        if (pendingAutoCommand) {
          try {
            await pendingAutoCommand;
          } catch (_) {
            // errors already logged in runAutoStatusCommand
          }
        }
        activeLang = lang;
        clearTerminal({ hiddenInput: true });
        runAutoStatusCommand({ force: true });
      }
    };

    window.addEventListener('portfolio:languagechange', handleLanguageChange);

    // Initialize terminal with permanent hint
    addPermanentHint();
    createInputLine({ hidden: true });

    const bootstrapAutoStatus = () => {
      runAutoStatusCommand();
    };

    if (document.readyState === 'complete') {
      bootstrapAutoStatus();
    } else {
      document.addEventListener('DOMContentLoaded', bootstrapAutoStatus, { once: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeaderTerminal, { once: true });
  } else {
    initHeaderTerminal();
  }
})();
