
//See More Button on Job History
(() => {
  const btn = document.getElementById('toggleJobs');
  const moreJobs = document.querySelector('.more-jobs');
  if (!btn || !moreJobs) return;
  const labelSpan = btn.querySelector('.lang-text') || btn;
  const updateToggleLabel = (isOpen) => {
    const lang = document.body.classList.contains('fr') ? 'fr' : 'en';
    const key  = isOpen ? 'hide' : 'show';
    const attr = `data-${lang}-${key}`;
    const baseLabel = btn.getAttribute(attr);
    if (baseLabel) {
      labelSpan.textContent = baseLabel;
    }
    btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  };

  // Animate the actual height, duration scales with distance
  const COLLAPSED_HEIGHT = moreJobs.getBoundingClientRect().height;
  const EXPAND_EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
  const COLLAPSE_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
  const durationFor = (distance) => Math.min(750, Math.max(420, distance * 1.2));
  let anchorFrame = 0;

  const stopAnchoring = () => cancelAnimationFrame(anchorFrame);

  const settle = () => {
    stopAnchoring();
    if (moreJobs.classList.contains('show')) {
      moreJobs.style.height = 'auto'; // let it resize with content
      moreJobs.classList.add('is-settled');
    } else {
      moreJobs.style.height = '';
    }
  };

  moreJobs.addEventListener('transitionend', (event) => {
    if (event.target === moreJobs && event.propertyName === 'height') settle();
  });

  // Keep the button in place while collapsing, unless the user scrolls
  const anchorButton = () => {
    const anchorTop = btn.getBoundingClientRect().top;
    const keep = () => {
      const drift = btn.getBoundingClientRect().top - anchorTop;
      if (Math.abs(drift) > 0.5) {
        window.scrollTo({ top: window.scrollY + drift, behavior: 'instant' });
      }
      anchorFrame = requestAnimationFrame(keep);
    };
    anchorFrame = requestAnimationFrame(keep);
    window.addEventListener('wheel', stopAnchoring, { once: true, passive: true });
    window.addEventListener('touchstart', stopAnchoring, { once: true, passive: true });
  };

  const setOpen = (open) => {
    stopAnchoring();
    const from = moreJobs.getBoundingClientRect().height;
    moreJobs.classList.remove('is-settled');
    moreJobs.style.height = from + 'px';
    moreJobs.classList.toggle('show', open);
    updateToggleLabel(open);

    const to = open ? moreJobs.scrollHeight : COLLAPSED_HEIGHT;
    const lite = document.documentElement.classList.contains('lite-mode');
    if (lite || Math.abs(to - from) < 1) {
      settle();
      return;
    }

    if (!open && moreJobs.getBoundingClientRect().top < 0) {
      anchorButton();
    }
    moreJobs.style.transitionDuration = durationFor(Math.abs(to - from)) + 'ms';
    moreJobs.style.transitionTimingFunction = open ? EXPAND_EASE : COLLAPSE_EASE;
    void moreJobs.offsetHeight; // force reflow
    moreJobs.style.height = to + 'px';
  };

  btn.addEventListener('click', () => {
    setOpen(!moreJobs.classList.contains('show'));
  });
  updateToggleLabel(moreJobs.classList.contains('show'));
  window.addEventListener('portfolio:languagechange', () => {
    updateToggleLabel(moreJobs.classList.contains('show'));
  });
})();

// Timeline bar (SVG)
(() => {
  const ul = document.querySelector('.timeline ul');
  if (!ul) return;
  const jobs = Array.from(ul.querySelectorAll('li[data-job]'));
  if (jobs.length < 2) return;

  const moreEl = ul.querySelector('.more-jobs');
  const VIS = 3;
  const BX  = 34;
  const DX  = 10;
  const NS  = 'http://www.w3.org/2000/svg';

  // Build SVG
  const svg = document.createElementNS(NS, 'svg');
  svg.classList.add('timeline-bar');
  svg.setAttribute('aria-hidden', 'true');
  ul.prepend(svg);

  const defs = document.createElementNS(NS, 'defs');
  svg.appendChild(defs);

  // Fade mask when collapsed
  const mask = document.createElementNS(NS, 'mask');
  mask.id = 'tl-mask';
  mask.setAttribute('maskUnits', 'userSpaceOnUse');
  defs.appendChild(mask);

  const fadeGrad = document.createElementNS(NS, 'linearGradient');
  fadeGrad.id = 'tl-fade';
  fadeGrad.setAttribute('gradientUnits', 'userSpaceOnUse');
  const fgStops = ['white', 'white', 'black'].map(c => {
    const s = document.createElementNS(NS, 'stop');
    s.setAttribute('stop-color', c);
    fadeGrad.appendChild(s);
    return s;
  });
  defs.appendChild(fadeGrad);

  const maskRect = document.createElementNS(NS, 'rect');
  maskRect.setAttribute('fill', 'url(#tl-fade)');
  mask.appendChild(maskRect);

  function mkPath() {
    const p = document.createElementNS(NS, 'path');
    p.classList.add('timeline-bar-seg');
    svg.appendChild(p);
    return p;
  }

  // One segment between each pair of jobs
  const segs = [];
  for (let i = 0; i < jobs.length - 1; i++) {
    const g = document.createElementNS(NS, 'linearGradient');
    g.id = `tlg${i}`;
    g.setAttribute('gradientUnits', 'userSpaceOnUse');
    const s0 = document.createElementNS(NS, 'stop');
    s0.setAttribute('offset', '0%');
    const s1 = document.createElementNS(NS, 'stop');
    s1.setAttribute('offset', '100%');
    g.append(s0, s1);
    defs.appendChild(g);

    const el = mkPath();
    el.setAttribute('stroke', `url(#tlg${i})`);
    segs.push({ el, from: i, to: i + 1, g, s0, s1 });
  }

  // Helpers
  function offsetTo(el, ancestor) {
    let y = 0;
    while (el && el !== ancestor) { y += el.offsetTop; el = el.offsetParent; }
    return y;
  }

  function yOf(li) {
    const ic = li.querySelector('.icon');
    return offsetTo(ic, ul) + ic.offsetHeight / 2;
  }

  function jobColors() {
    const s = getComputedStyle(document.body);
    return jobs.map((_, i) => s.getPropertyValue(`--job-${i + 1}-accent`).trim());
  }

  // always use C so the CSS transition on d works
  function curve(x1, y1, x2, y2) {
    const dy = y2 - y1;
    if (x1 === x2) {
      const cp = dy / 3;
      return `path("M ${x1} ${y1} C ${x1} ${y1 + cp}, ${x2} ${y2 - cp}, ${x2} ${y2}")`;
    }
    let cp1y, cp2y;
    if (x1 > x2) {
      cp1y = y1 + dy * 0.12;
      cp2y = y2 - dy * 0.75;
    } else {
      cp1y = y1 + dy * 0.75;
      cp2y = y2 - dy * 0.12;
    }
    return `path("M ${x1} ${y1} C ${x1} ${cp1y}, ${x2} ${cp2y}, ${x2} ${y2}")`;
  }

  // Render
  let hov = -1;

  function render() {
    const ys = jobs.map(yOf);
    const cs = jobColors();
    const collapsed = moreEl ? !moreEl.classList.contains('show') : false;

    svg.setAttribute('width', ul.offsetWidth);
    svg.setAttribute('height', ys[ys.length - 1] + 40);

    segs.forEach(seg => {
      const { from, to } = seg;
      const x1 = hov === from ? BX + DX : BX;
      const x2 = hov === to   ? BX + DX : BX;
      seg.el.style.d = curve(x1, ys[from], x2, ys[to]);

      seg.g.setAttribute('x1', x1); seg.g.setAttribute('y1', ys[from]);
      seg.g.setAttribute('x2', x2); seg.g.setAttribute('y2', ys[to]);
      seg.s0.setAttribute('stop-color', cs[from] || '#999');
      seg.s1.setAttribute('stop-color', cs[to]   || '#999');
    });

    // Fade the bar out over the hidden jobs
    if (collapsed && moreEl) {
      const mTop = offsetTo(moreEl, ul);
      const fadeEnd = mTop;
      const fadeStart = Math.max(0, mTop - 145);
      const pct = fadeEnd > 0 ? (fadeStart / fadeEnd * 100).toFixed(1) : '80';

      fadeGrad.setAttribute('x1', '0');  fadeGrad.setAttribute('y1', '0');
      fadeGrad.setAttribute('x2', '0');  fadeGrad.setAttribute('y2', String(fadeEnd));
      fgStops[0].setAttribute('offset', '0%');
      fgStops[1].setAttribute('offset', pct + '%');
      fgStops[2].setAttribute('offset', '100%');

      maskRect.setAttribute('x', '0');   maskRect.setAttribute('y', '0');
      maskRect.setAttribute('width', String(ul.offsetWidth));
      maskRect.setAttribute('height', String(fadeEnd));
      mask.setAttribute('x', '0');       mask.setAttribute('y', '0');
      mask.setAttribute('width', String(ul.offsetWidth));
      mask.setAttribute('height', String(fadeEnd));

      svg.setAttribute('mask', 'url(#tl-mask)');
    } else {
      svg.removeAttribute('mask');
    }
  }

  // Events
  // Only on devices with hover (taps leave it stuck)
  if (window.matchMedia('(hover: hover)').matches) {
    jobs.forEach((li, i) => {
      li.addEventListener('mouseenter', () => { hov = i; render(); });
      li.addEventListener('mouseleave', () => { hov = -1; render(); });
    });
  }

  new MutationObserver(() => requestAnimationFrame(render))
    .observe(document.body, { attributes: true, attributeFilter: ['class'] });

  new ResizeObserver(() => requestAnimationFrame(render)).observe(ul);
  window.addEventListener('load', render);
  render();
})();

// Lite mode: reduced motion, data saver or ?lite=1 (?lite=0 to force off)
(() => {
  const root = document.documentElement;
  const liteParam = new URLSearchParams(window.location.search).get('lite');
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = navigator.connection?.saveData === true;
  const setLite = (enabled) => root.classList.toggle('lite-mode', enabled);

  if (liteParam === '1' || liteParam === '0') {
    setLite(liteParam === '1');
    return;
  }
  setLite(motionQuery.matches || saveData);
  motionQuery.addEventListener('change', (event) => setLite(event.matches || saveData));
})();

// Lazy load images
(() => {
  const isCriticalImage = (img) => img.classList.contains('headshot');
  const applyLazyDefaults = () => {
    document.querySelectorAll('img').forEach((img) => {
      if (!isCriticalImage(img) && !img.hasAttribute('loading')) {
        img.loading = 'lazy';
      }
      if (!img.hasAttribute('decoding')) {
        img.decoding = 'async';
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyLazyDefaults, { once: true });
  } else {
    applyLazyDefaults();
  }
})();

// Keep project cards open while pointer stays inside the stack
(() => {
  const stack = document.querySelector('.project-stack');
  if (!stack) return;
  const cards = Array.from(stack.querySelectorAll('.project-card'));
  if (!cards.length) return;
  const collapseBtn = document.getElementById('collapseProjects');
  const isMobileProjects = window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
  // Remember scroll position so closing cards returns to it
  let hasOpenCards = false;
  let openSessionScrollY = null;
  let scrolledDuringOpen = false;

  const startOpenSession = () => {
    if (hasOpenCards) return;
    hasOpenCards = true;
    openSessionScrollY = window.scrollY;
    scrolledDuringOpen = false;
  };

  const resetOpenSession = () => {
    hasOpenCards = false;
    openSessionScrollY = null;
    scrolledDuringOpen = false;
  };

  const toggleLabelsFor = (isOpen) => ({
    en: isOpen ? 'See less' : 'See more',
    fr: isOpen ? 'Voir moins' : 'Voir plus'
  });

  const applyToggleLabel = (toggle, isOpen) => {
    const labels = toggleLabelsFor(isOpen);
    toggle.setAttribute('data-en', labels.en);
    toggle.setAttribute('data-fr', labels.fr);
    toggle.textContent = document.body.classList.contains('fr') ? labels.fr : labels.en;
  };

  const syncToggleButtons = () => {
    cards.forEach((card) => {
      const toggle = card.querySelector('.project-see-more');
      if (toggle) {
        const isOpen = card.classList.contains('is-open');
        toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        applyToggleLabel(toggle, isOpen);
      }
    });
  };

  // Don't lock scroll while the user is scrolling
  const SCROLL_SETTLE_DELAY = 220;
  const ANCHOR_TOP_BUFFER = 220; // px
  let recentlyScrolled = false;
  let scrollTimer = null;
  const markScroll = () => {
    recentlyScrolled = true;
    if (hasOpenCards) {
      scrolledDuringOpen = true;
    }
    if (scrollTimer) clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      recentlyScrolled = false;
      flushPendingClose();
    }, SCROLL_SETTLE_DELAY);
  };
  window.addEventListener('scroll', markScroll, { passive: true });
  window.addEventListener('wheel', markScroll, { passive: true });
  window.addEventListener('touchmove', markScroll, { passive: true });

  const closeAll = () => {
    const openCards = cards.filter((card) => card.classList.contains('is-open'));
    if (!openCards.length) return;
    const singleOpenCard = openCards.length === 1 ? openCards[0] : null;
    const preserveInitialScroll = hasOpenCards && !scrolledDuringOpen && openSessionScrollY !== null;
    const desiredScrollY = preserveInitialScroll ? openSessionScrollY : null;

    const collapseNow = () => {
      openCards.forEach((card) => card.classList.remove('is-open'));
      syncToggleButtons();
      resetOpenSession();
    };

    if (recentlyScrolled) {
      collapseNow();
      return;
    }

    const scrollY = window.scrollY;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const viewportTop = scrollY;
    const viewportBottom = scrollY + viewportHeight;

    const hasContentAboveScroll = openCards.some((card) => {
      const rect = card.getBoundingClientRect();
      const cardTop = scrollY + rect.top;
      return cardTop < (scrollY - ANCHOR_TOP_BUFFER);
    });

    if (!hasContentAboveScroll) {
      collapseNow();
      return;
    }

    const stackRect = stack.getBoundingClientRect();
    const stackTop = scrollY + stackRect.top;
    const stackBottom = scrollY + stackRect.bottom;

    let skipScrollCompensation = !(
      viewportBottom > stackTop && viewportTop < stackBottom
    );
    if (singleOpenCard) {
      skipScrollCompensation = false;
    }
    if (preserveInitialScroll) {
      skipScrollCompensation = false;
    }

    let anchor = null;
    let anchorTopBefore = 0;

    if (!skipScrollCompensation && !preserveInitialScroll) {
      if (singleOpenCard) {
        const rect = singleOpenCard.getBoundingClientRect();
        // Only anchor to this card if it's still near the viewport
        if (rect.top > -ANCHOR_TOP_BUFFER) {
          anchor = singleOpenCard;
          anchorTopBefore = rect.top;
        }
      }

      // Find lowest open project
      if (!anchor) {
        let lowestOpenIndex = -1;
        cards.forEach((card, index) => {
          if (card.classList.contains('is-open')) {
            lowestOpenIndex = index;
          }
        });

        if (lowestOpenIndex !== -1) {
          const lowestOpenCard = cards[lowestOpenIndex];
          const lowestRect = lowestOpenCard.getBoundingClientRect();
          const lowestTop = lowestRect.top;
          const lowestBottom = lowestRect.bottom;

          // If the next closed project is visible, anchor to it
          const nextCard = cards[lowestOpenIndex + 1];
          if (nextCard && !nextCard.classList.contains('is-open')) {
            const nextRect = nextCard.getBoundingClientRect();
            if (nextRect.bottom > 0 && nextRect.top < viewportHeight) {
              anchor = nextCard;
              anchorTopBefore = nextRect.top;
            }
          }

          // Otherwise anchor to the lowest open one
          if (!anchor && lowestBottom > 0 && lowestTop < viewportHeight) {
            anchor = lowestOpenCard;
            anchorTopBefore = lowestTop;
          }
        }
      }

      // Fallback
      if (!anchor) {
        for (let i = 0; i < cards.length; i += 1) {
          const rect = cards[i].getBoundingClientRect();
          if (rect.top >= 0 && rect.top < viewportHeight) {
            anchor = cards[i];
            anchorTopBefore = rect.top;
            break;
          }
        }
      }

      if (!anchor) {
        for (let i = 0; i < cards.length; i += 1) {
          const card = cards[i];
          const rect = card.getBoundingClientRect();
          if (rect.top < 0 && rect.bottom > 0) {
            anchor = card;
            anchorTopBefore = rect.top;
            break;
          }
        }
      }
      if (!anchor && !preserveInitialScroll) {
        skipScrollCompensation = true;
      }
    }

    collapseNow();
    if (skipScrollCompensation) return;

    // Keep anchor in place while cards animate
    const htmlEl = document.documentElement;
    const originalScrollBehavior = htmlEl.style.scrollBehavior;
    htmlEl.style.scrollBehavior = 'auto';

    let animating = true;
    const startTime = performance.now();
    const duration = 650;

    const finishCollapse = () => {
      animating = false;
      htmlEl.style.scrollBehavior = originalScrollBehavior;
    };

    const maintainPosition = () => {
      if (!animating) return;

      if (preserveInitialScroll && desiredScrollY !== null) {
        const currentScroll = window.scrollY;
        if (Math.abs(currentScroll - desiredScrollY) > 0.5) {
          window.scrollTo(0, Math.max(0, desiredScrollY));
        }
      } else if (anchor && anchor.getBoundingClientRect) {
        const currentTop = anchor.getBoundingClientRect().top;
        if (Math.abs(currentTop - anchorTopBefore) > 0.5) {
          const shift = currentTop - anchorTopBefore;
          const currentScroll = window.scrollY;
          window.scrollTo(0, Math.max(0, currentScroll + shift));
        }
      } else {
        finishCollapse();
        return;
      }

      if (performance.now() - startTime < duration + 50) {
        requestAnimationFrame(maintainPosition);
      } else {
        finishCollapse();
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
    if (modalOpen || recentlyScrolled) {
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
      startOpenSession();
      card.classList.add('is-open');
      syncToggleButtons();
      clearPending();
    };

    // Only open on real pointer movement, not when the page scrolls under a still cursor.
    // Moving the mouse opens right away, even while the smooth scroll is still settling.
    const hoverOpen = (event) => {
      if (!pointerActivates(event)) return;
      const moved = event.type === 'pointermove' && (event.movementX || event.movementY);
      if (recentlyScrolled && !moved) return;
      if (!card.classList.contains('is-open')) markOpen();
    };

    if (!isMobileProjects) {
      card.addEventListener('pointerenter', hoverOpen);
      card.addEventListener('pointermove', hoverOpen);
      card.addEventListener('focusin', markOpen);
    }

    const toggleButton = card.querySelector('.project-see-more');
    if (toggleButton) {
      toggleButton.addEventListener('click', (event) => {
        if (!isMobileProjects) return;
        event.preventDefault();
        const isOpen = card.classList.contains('is-open');
        if (isOpen) {
          card.classList.remove('is-open');
        } else {
          startOpenSession();
          card.classList.add('is-open');
        }
        syncToggleButtons();
        if (!cards.some((entry) => entry.classList.contains('is-open'))) {
          resetOpenSession();
        }
      });
    }
  });

  const handleStackFocusOut = (event) => {
    const next = event.relatedTarget;
    if (next && stack.contains(next)) return;
    requestClose();
  };

  if (!isMobileProjects) {
    stack.addEventListener('pointerleave', requestClose);
    stack.addEventListener('pointercancel', requestClose);
    stack.addEventListener('mouseleave', requestClose);
    stack.addEventListener('focusout', handleStackFocusOut);
    stack.addEventListener('focusin', clearPending);
  }

  function flushPendingClose() {
    if (!pendingClose) return;
    if (modalOpen || recentlyScrolled) return;
    pendingClose = false;
    if (shouldCloseNow()) closeAll();
  }

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
  syncToggleButtons();

  if (collapseBtn) {
    collapseBtn.addEventListener('click', () => {
      pendingClose = false;
      closeAll();
    });
  }

  window.addEventListener('portfolio:languagechange', syncToggleButtons);
})();

// Sidebar - sticky positioning
document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const track = document.getElementById('sidebarTrack');
  const header = document.querySelector('header.header-flex');
  if (!sidebar || !track || !header) return;

  // Sidebar is sticky inside #sidebarTrack, JS just sizes the track
  const updateTrack = () => {
    const scrollY = window.scrollY;
    const trackTop = header.getBoundingClientRect().bottom + scrollY + 10; // 10px gap
    const pageBottom = document.body.getBoundingClientRect().bottom + scrollY;
    track.style.top = trackTop + 'px';
    track.style.height = Math.max(0, Math.floor(pageBottom - trackTop)) + 'px';
  };

  updateTrack();
  sidebar.style.visibility = 'visible';
  sidebar.style.opacity = '1';

  // Resize track when page height changes
  const ro = new ResizeObserver(updateTrack);
  ro.observe(header);
  ro.observe(document.body);
  window.addEventListener('resize', updateTrack);
});


// Pause header CRT effects when off screen
(() => {
  const header = document.querySelector('header.header-flex');
  if (!header) return;
  new IntersectionObserver(([entry]) => {
    header.classList.toggle('crt-offscreen', !entry.isIntersecting);
  }).observe(header);
})();

// Media modal (videos, PDFs)
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
    window.dispatchEvent(new CustomEvent('portfolio:media-modal', { detail: { open } }));
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
    // Focus video for keyboard controls (not the PDF, Escape stops working)
    requestAnimationFrame(() => {
      const focusTarget = content.querySelector('video') || dialog.querySelector('.media-modal__close');
      focusTarget.focus();
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


// Quick scroll to an element (faster than native smooth scroll)
// Re-aims every frame so it lands right even if the layout shifts mid-scroll
function quickScrollTo(el, { duration = 450, hold = 0, onArrive } = {}) {
  const html = document.documentElement;
  const targetY = () => {
    const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    const max = html.scrollHeight - window.innerHeight;
    return Math.min(max, Math.max(0, el.getBoundingClientRect().top + window.scrollY - margin));
  };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo({ top: targetY(), behavior: 'instant' });
    onArrive?.();
    return;
  }

  cancelAnimationFrame(quickScrollTo.frame);
  quickScrollTo.stop?.();

  const startY = window.scrollY;
  const start = performance.now();
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2);
  let arrived = false;

  // Let the user take over by scrolling
  const stop = () => {
    cancelAnimationFrame(quickScrollTo.frame);
    window.removeEventListener('wheel', stop);
    window.removeEventListener('touchstart', stop);
    if (!arrived) onArrive?.();
    arrived = true;
  };
  quickScrollTo.stop = stop;
  window.addEventListener('wheel', stop, { passive: true });
  window.addEventListener('touchstart', stop, { passive: true });

  const step = (now) => {
    const elapsed = now - start;
    const t = Math.min(1, elapsed / duration);
    const y = t < 1 ? startY + (targetY() - startY) * ease(t) : targetY();
    window.scrollTo({ top: y, behavior: 'instant' });
    if (t >= 1 && !arrived) {
      arrived = true;
      onArrive?.();
    }
    // Keep pinned while things above finish resizing
    if (elapsed < duration + hold) {
      quickScrollTo.frame = requestAnimationFrame(step);
    } else {
      stop();
    }
  };
  quickScrollTo.frame = requestAnimationFrame(step);
}

// Sidebar section links
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('#sidebar nav a[href^="#"]').forEach((link) => {
    if (link.closest('.sidebar-dropdown')) return; // projects handle their own clicks
    link.addEventListener('click', (event) => {
      const section = document.getElementById(link.getAttribute('href').slice(1));
      if (!section) return;
      event.preventDefault();
      history.pushState(null, '', link.getAttribute('href'));
      quickScrollTo(section, { duration: 450 });
    });
  });
});

// Sidebar projects dropdown
(() => {
  // Shorter names for the sidebar
  const PROJECT_LINK_LABELS = {
    'road-learning-tool':        { en: 'Road Learning Tool', fr: 'Outil d\'apprentissage des routes' },
    'project-cpu-risc':          { en: '32-Bit RISC Processor Design', fr: 'Conception d\'un processeur RISC 32 bits' },
    'project-running-jumping':   { en: 'Running and Jumping Detection', fr: 'Détection de course et saut' },
    'project-autonomous-car':    { en: 'Autonomous Taxi Car', fr: 'Voiture-taxi autonome' },
    'project-dynamic-calendar':  { en: 'Dynamic Time Allocating Calendar', fr: 'Calendrier dynamique' },
    'project-911-training':      { en: '911 Dispatcher Training Device', fr: 'Simulateur d\'opérateur 911' },
    'project-fluid-dispensing':  { en: 'Fluid and Powder Dispensing Device', fr: 'Distributeur fluide et poudre' },
    'project-portfolio-website': { en: 'Portfolio Website', fr: 'Site portfolio' },
  };

  const currentLang = () => (document.body.classList.contains('fr') ? 'fr' : 'en');

  const labelFor = (card) => {
    const lang = currentLang();
    const short = PROJECT_LINK_LABELS[card.id];
    if (short) return short[lang];
    const title = card.querySelector('.project-card-title .lang-text');
    return title ? (title.getAttribute(`data-${lang}`) || title.textContent).trim() : card.id;
  };

  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('projectsToggle');
    const dropdown = document.getElementById('projectsDropdown');
    const list = document.getElementById('projectsList');
    const sidebar = document.getElementById('sidebar');
    const projectsSection = document.getElementById('projects');
    if (!toggle || !dropdown || !list || !sidebar || !projectsSection) return;

    let closeTimer = null;

    const setOpen = (open) => {
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      sidebar.classList.toggle('sidebar-expanded', open);
      clearTimeout(closeTimer);
      if (open) {
        dropdown.hidden = false;
        dropdown.setAttribute('aria-hidden', 'false');
        requestAnimationFrame(() => dropdown.classList.add('open'));
      } else {
        dropdown.classList.remove('open');
        dropdown.setAttribute('aria-hidden', 'true');
        // Hide after transition
        closeTimer = setTimeout(() => {
          if (!dropdown.classList.contains('open')) dropdown.hidden = true;
        }, 360);
      }
    };

    const isOpen = () => dropdown.classList.contains('open');

    const applyToggleLabel = () => {
      const label = toggle.getAttribute(`data-${currentLang()}-label`);
      if (label) toggle.setAttribute('aria-label', label);
    };

    // Close open cards and scroll to the project at the same time, then open it
    // (hold keeps it pinned while the closed cards finish collapsing)
    const openProject = (card) => {
      document.querySelectorAll('.project-card.is-open').forEach((open) => {
        if (open !== card) open.classList.remove('is-open');
      });
      quickScrollTo(card, {
        duration: 400,
        hold: 350,
        onArrive: () => card.classList.add('is-open'),
      });
    };

    const buildList = () => {
      list.innerHTML = '';
      projectsSection.querySelectorAll('.project-card[id]').forEach((card, index) => {
        const li = document.createElement('li');
        li.style.setProperty('--i', index); // for stagger
        const link = document.createElement('a');
        link.href = `#${card.id}`;
        link.textContent = labelFor(card);
        link.dataset.label = link.textContent;
        link.addEventListener('click', (event) => {
          event.preventDefault();
          openProject(card);
        });
        li.appendChild(link);
        list.appendChild(li);
      });
    };

    toggle.addEventListener('click', (event) => {
      event.preventDefault();
      const nextState = !isOpen();
      setOpen(nextState);
      // Only move focus for keyboard
      if (nextState && event.detail === 0) list.querySelector('a')?.focus();
    });

    document.addEventListener('click', (event) => {
      if (isOpen() && !dropdown.contains(event.target) && !toggle.contains(event.target)) {
        setOpen(false);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });

    buildList();
    applyToggleLabel();
    setOpen(false);

    window.addEventListener('portfolio:languagechange', () => {
      buildList();
      applyToggleLabel();
    });
  });
})();

// Language switch (English / French)
(() => {
  const langButton = document.getElementById('langButton');
  const resumeLink = document.getElementById('resumeLink');
  const texts = document.querySelectorAll('.lang-text');

  const updateLanguage = (isFr) => {
    const langCode = isFr ? 'fr' : 'en';
    document.body.classList.toggle('fr', isFr);

    if (langButton) {
      langButton.setAttribute('aria-label', isFr ? 'Switch to English' : 'Passer en français');
      langButton.setAttribute('aria-pressed', isFr ? 'true' : 'false');
      langButton.dataset.lang = langCode;
    }

    if (resumeLink) {
      const targetHref = resumeLink.getAttribute(`data-${langCode}-href`);
      if (targetHref) resumeLink.setAttribute('href', targetHref);
      resumeLink.setAttribute('hreflang', langCode);
    }

    texts.forEach((el) => {
      el.textContent = el.getAttribute(`data-${langCode}`);
    });

    // Save language in URL
    const url = new URL(window.location.href);
    if (isFr) url.searchParams.set('lang', 'fr');
    else url.searchParams.delete('lang');
    history.replaceState(null, '', url);

    window.dispatchEvent(new CustomEvent('portfolio:languagechange', { detail: { lang: langCode } }));
  };

  document.addEventListener('DOMContentLoaded', () => {
    updateLanguage(new URLSearchParams(window.location.search).get('lang') === 'fr');
  });

  langButton?.addEventListener('click', () => {
    updateLanguage(!document.body.classList.contains('fr'));
  });
})();

// Smooth wheel scrolling (Lenis) so the speed is the same everywhere
(() => {
  if (typeof Lenis === 'undefined') return; // CDN failed, keep native
  const lenis = new Lenis({
    autoRaf: true,
    lerp: 0.35,              // higher = snappier (less glide after the wheel stops)
    wheelMultiplier: 0.8,     // a bit slower than native
    allowNestedScroll: true,  // terminal etc. scroll on their own
  });

  // Clicks and keys take over (nav links, scrollbar drag, card collapse)
  window.addEventListener('pointerdown', () => lenis.reset(), { capture: true, passive: true });
  window.addEventListener('keydown', () => lenis.reset(), { capture: true });

  // Pause while the media modal is open
  window.addEventListener('portfolio:media-modal', (event) => {
    if (event.detail && event.detail.open) lenis.stop();
    else lenis.start();
  });
})();

// Scrollbar colour (white on header, grey on content)
(() => {
  const header = document.querySelector('header.header-flex');
  if (!header) return;
  const COLOR_LIGHT = [255, 255, 255];
  const COLOR_DARK = [150, 150, 150];
  const COLOR_DARK_MODE = 'rgb(245, 245, 245)';
  const TRANSITION_RANGE = 220; // px

  const mix = (t) => `rgb(${COLOR_LIGHT.map((c, i) => Math.round(c + (COLOR_DARK[i] - c) * t)).join(', ')})`;

  const updateScrollbarColor = () => {
    let color = COLOR_DARK_MODE;
    if (!document.body.classList.contains('dark-mode')) {
      const headerBottom = header.offsetTop + header.offsetHeight;
      const transitionStart = Math.max(0, headerBottom - TRANSITION_RANGE);
      color = mix(Math.min(1, Math.max(0, (window.scrollY - transitionStart) / TRANSITION_RANGE)));
    }
    document.documentElement.style.setProperty('--scrollbar-color', color);
  };

  window.addEventListener('scroll', updateScrollbarColor, { passive: true });
  window.addEventListener('resize', updateScrollbarColor);
  window.addEventListener('load', updateScrollbarColor);
  updateScrollbarColor();
})();

// Custom scrollbar
(() => {
  const docEl = document.documentElement;
  const overlay = document.createElement('div');
  overlay.id = 'scrollbarOverlay';
  const thumb = document.createElement('div');
  thumb.id = 'scrollbarThumb';
  overlay.appendChild(thumb);
  document.body.appendChild(overlay);

  const MIN_THUMB = 32;
  let trackTop = 0;
  let maxThumbTop = 0;
  let maxScroll = 1;
  let dragging = false;
  let dragOffset = 0;
  let scrollIdleTimer = null;

  const computeMetrics = () => {
    const rect = overlay.getBoundingClientRect();
    const viewport = window.innerHeight;
    const scrollHeight = docEl.scrollHeight;
    const thumbHeight = Math.max(MIN_THUMB, Math.round(rect.height * Math.min(1, viewport / scrollHeight)));
    trackTop = rect.top;
    maxScroll = Math.max(1, scrollHeight - viewport);
    maxThumbTop = Math.max(0, rect.height - thumbHeight);
    thumb.style.height = `${thumbHeight}px`;
  };

  const updateOverlay = () => {
    if (dragging) return;
    computeMetrics();
    const t = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    thumb.style.transform = `translateY(${Math.round(maxThumbTop * t)}px)`;
  };

  // No transition while scrolling
  const onScroll = () => {
    if (dragging) return;
    thumb.classList.add('is-scrolling');
    updateOverlay();
    clearTimeout(scrollIdleTimer);
    scrollIdleTimer = setTimeout(() => thumb.classList.remove('is-scrolling'), 50);
  };

  const clientY = (event) => (event.touches ? event.touches[0].clientY : event.clientY);

  const onDrag = (event) => {
    event.preventDefault();
    const thumbTop = Math.min(maxThumbTop, Math.max(0, clientY(event) - trackTop - dragOffset));
    thumb.style.transform = `translateY(${Math.round(thumbTop)}px)`;
    const t = maxThumbTop ? thumbTop / maxThumbTop : 0;
    window.scrollTo({ top: t * maxScroll, behavior: 'instant' });
  };

  const endDrag = () => {
    dragging = false;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('touchend', endDrag);
    document.body.style.userSelect = '';
    thumb.classList.remove('dragging');
    updateOverlay();
  };

  const startDrag = (event) => {
    event.preventDefault();
    computeMetrics();
    const thumbRect = thumb.getBoundingClientRect();
    dragOffset = Math.max(0, Math.min(clientY(event) - thumbRect.top, thumbRect.height));
    dragging = true;
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('touchend', endDrag);
    document.body.style.userSelect = 'none';
    thumb.classList.add('dragging');
  };

  overlay.addEventListener('mousedown', startDrag);
  overlay.addEventListener('touchstart', startDrag, { passive: false });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', updateOverlay);
  // Update thumb when page height changes
  new ResizeObserver(updateOverlay).observe(document.body);
  updateOverlay();
})();

// Glyphs used by all the rain effects
const RAIN_ASCII_GLYPHS = '!"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';

// Simple int hash for per column randomness
const hash32 = (x) => {
  x |= 0;
  x = (x ^ 61) ^ (x >>> 16);
  x = x + (x << 3);
  x = x ^ (x >>> 4);
  x = Math.imul(x, 0x27d4eb2d);
  x = x ^ (x >>> 15);
  return x >>> 0;
};

const cssVar = (name, fallback) => (
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
);

// Digital rain renderer (used by header and sidebar)
const rainDpr = () => Math.max(1, Math.min(1.25, window.devicePixelRatio || 1)); // cap resolution

// seed: so two rain fields don't match
// cover: round grid up to fill the edges
// gridRows: total rows the strands cycle through (can be more than visible)
const createDigitalRain = (canvas, { seed = 0, cover = false, gridRows: gridRowsFor = null } = {}) => {
  const ctx = canvas.getContext('2d');
  const COLUMN_RATE_VARIANCE = 0.7; // 0 = uniform
  const COLUMN_RATE_SHIFT = 0.45;   // slows all columns
  const WHITE_HEAD_FRACTION = 0.4; // columns with a white head
  const COLUMN_SPEED_VARIANCE = 0.5; // speed variation per column
  const GLYPH_FADE_MS = 180; // glyph crossfade
  const CHANGE_INTERVAL = 280; // ms between changes
  const GRADIENT_DECAY = 0.9;
  const GRADIENT_MAX = 50;
  const GRADIENT_LERP = 0.6;
  const FILL = cssVar('--rain-color', 'rgba(0,255,140,0.75)');
  const GLOW = cssVar('--rain-glow', 'rgba(0,255,140,0.45)');
  const WHITE_FILL = 'rgba(225, 255, 235, 0.98)';
  const WHITE_GLOW = 'rgba(200, 255, 220, 0.95)';

  const rain = { dpr: 1, w: 0, h: 0, step: 14, stepX: 14, stepY: 14, cols: 0, rows: 0 };
  let gridRows = 0;
  let greenBlur = 0; // green glow
  let whiteBlur = 0; // white glow on heads
  let heads = [];
  let colRates = [];
  let colFadeRates = [];   // fade per step
  let colChainLens = [];   // strand length
  let colWhiteHead = [];
  let colSpeeds = [];      // scroll speed multiplier
  let colScrollAccums = [];
  let cellRowOffsets = []; // so rows don't all change together
  let cellPhases = [];
  let cellPrevPhases = [];
  let cellTransitionAt = [];
  let gradientMomentum = 0;
  let gradientTarget = 0.5;
  let gradientMix = 0.5;

  const glyphFor = (c, r, phase) => RAIN_ASCII_GLYPHS.charAt(
    hash32(((c + seed + 1) * 73856093) ^ ((r + 1) * 19349663) ^ (phase * 83492791)) % RAIN_ASCII_GLYPHS.length
  );

  rain.resize = (cssW, cssH, glyphPx) => {
    const dpr = rainDpr();
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    const w = canvas.width;
    const h = canvas.height;
    const step = Math.max(8, Math.round(glyphPx * dpr));
    const stepX = Math.max(6, Math.round(step * 0.8));
    const stepY = Math.max(step + 1, Math.round(step * 1.18));
    const fit = cover ? Math.ceil : Math.floor;
    const cols = Math.max(1, fit(w / stepX));
    const rows = Math.max(1, fit(h / stepY));
    Object.assign(rain, { dpr, w, h, step, stepX, stepY, cols, rows });
    gridRows = Math.max(rows, gridRowsFor ? gridRowsFor(rows) : rows);
    greenBlur = Math.round(step * 1.4);
    whiteBlur = Math.round(step * 2.6);

    // Keep strands in place on resize
    const prevHeads = heads;
    heads = new Array(cols);
    colRates = new Array(cols);
    colFadeRates = new Array(cols);
    colChainLens = new Array(cols);
    colWhiteHead = new Array(cols);
    colSpeeds = new Array(cols);
    colScrollAccums = new Array(cols);
    cellRowOffsets = new Array(cols);
    cellPhases = new Array(cols);
    cellPrevPhases = new Array(cols);
    cellTransitionAt = new Array(cols);
    const baseUnit = performance.now() / CHANGE_INTERVAL;
    for (let i = 0; i < cols; i++) {
      const k = i + seed;
      heads[i] = prevHeads[i] !== undefined ? prevHeads[i] % gridRows : Math.floor(Math.random() * gridRows);
      const rateHash = hash32(k * 9876541 + 12345);
      const rateRandom = (rateHash % 10001) / 10000;
      colRates[i] = Math.pow(2, (rateRandom - 0.5) * 2 * COLUMN_RATE_VARIANCE - COLUMN_RATE_SHIFT);
      // Different fade rate per column
      const fadeHash = hash32(k * 2246822519 + 7919);
      const fadeRandom = (fadeHash % 10001) / 10000;
      colFadeRates[i] = 0.045 + fadeRandom * 0.115;
      const lenHash = hash32(k * 374761393 + 2654435761);
      const lenRandom = (lenHash % 10001) / 10000;
      colChainLens[i] = 8 + Math.floor(lenRandom * 16); // 8..23
      const whiteHash = hash32(k * 1597334677 + 374761);
      colWhiteHead[i] = ((whiteHash % 10000) / 10000) < WHITE_HEAD_FRACTION;
      // Scroll speed 0.5x - 1.5x
      const speedHash = hash32(k * 2654435761 + 17);
      const speedRandom = (speedHash % 10001) / 10000;
      colSpeeds[i] = 1 + (speedRandom - 0.5) * 2 * COLUMN_SPEED_VARIANCE;
      colScrollAccums[i] = 0;
      const rowOffsets = new Float32Array(rows);
      const phases = new Int32Array(rows);
      const prevPhases = new Int32Array(rows);
      const transAt = new Float32Array(rows);
      const base = baseUnit * colRates[i];
      for (let r = 0; r < rows; r++) {
        const offHash = hash32((k + 1) * 374761393 ^ (r + 1) * 668265263);
        rowOffsets[r] = (offHash % 100000) / 100000; // 0..1
        // Start on current phase (no crossfade on resize)
        phases[r] = Math.floor(base + rowOffsets[r]);
        prevPhases[r] = phases[r];
        transAt[r] = -1e9;
      }
      cellRowOffsets[i] = rowOffsets;
      cellPhases[i] = phases;
      cellPrevPhases[i] = prevPhases;
      cellTransitionAt[i] = transAt;
    }
  };

  // Scroll delta since last frame
  rain.advance = (dy) => {
    if (dy) {
      gradientMomentum = gradientMomentum * GRADIENT_DECAY + dy;
      // Keep accumulator from growing forever
      gradientMomentum = Math.max(-GRADIENT_MAX, Math.min(GRADIENT_MAX, gradientMomentum));
      gradientTarget = 0.5 + 0.5 * (gradientMomentum / GRADIENT_MAX);
      gradientTarget = Math.max(0, Math.min(1, gradientTarget));
    }
    gradientMix += (gradientTarget - gradientMix) * GRADIENT_LERP;
    if (gradientMix < 0) gradientMix = 0;
    else if (gradientMix > 1) gradientMix = 1;

    for (let c = 0; c < rain.cols; c++) {
      if (dy) {
        colScrollAccums[c] += (dy / 25) * (colSpeeds[c] || 1);
        if (colScrollAccums[c] > 3) colScrollAccums[c] = 3;
        else if (colScrollAccums[c] < -3) colScrollAccums[c] = -3;
      }
      const a = colScrollAccums[c];
      let steps = 0;
      if (a >= 1) steps = Math.floor(a);
      else if (a <= -1) steps = Math.ceil(a);
      if (steps !== 0) {
        // Scrolling down moves heads up
        let head = heads[c] - steps;
        head %= gridRows; if (head < 0) head += gridRows;
        heads[c] = head;
        colScrollAccums[c] -= steps;
      }
    }
  };

  rain.clear = () => ctx.clearRect(0, 0, rain.w, rain.h);

  // shade(c, x, y) scales glyph opacity, ambient = false skips the strands
  rain.draw = (tnow, shade = null, ambient = true) => {
    const { w, h, cols, rows, step, stepX, stepY } = rain;
    ctx.clearRect(0, 0, w, h);
    ctx.font = Math.floor(step * 1.3) + 'px monospace';
    ctx.textBaseline = 'top';
    ctx.fillStyle = FILL;
    ctx.shadowColor = GLOW;
    ctx.shadowBlur = greenBlur;

    // Check which cells changed glyph
    const baseUnit = tnow / CHANGE_INTERVAL;
    for (let c = 0; c < cols; c++) {
      const rate = colRates[c] || 1;
      const base = baseUnit * rate;
      const offsets = cellRowOffsets[c];
      const phases = cellPhases[c];
      const prevPhases = cellPrevPhases[c];
      const transAt = cellTransitionAt[c];
      for (let r = 0; r < rows; r++) {
        const newPhase = Math.floor(base + offsets[r]);
        if (newPhase !== phases[r]) {
          prevPhases[r] = phases[r];
          phases[r] = newPhase;
          transAt[r] = tnow;
        }
      }
    }
    if (!ambient) return;

    const effectiveGradient = gradientMix;
    for (let c = 0; c < cols; c++) {
      const chainLen = colChainLens[c] || (10 + (c % 9));
      const fadeRate = colFadeRates[c] || 0.1;
      const head = heads[c];
      // Move the white head along the strand based on scroll direction
      const leadingPos = (1 - effectiveGradient) * (chainLen - 1);
      const phasesCol = cellPhases[c];
      const prevPhasesCol = cellPrevPhases[c];
      const transAtCol = cellTransitionAt[c];
      const x = c * stepX + Math.floor(stepX * 0.1);
      for (let i = 0; i < chainLen; i++) {
        const r = (head + i) % gridRows;
        if (r >= rows) continue; // off canvas
        const y = r * stepY;
        const colAlpha = shade ? shade(c, x, y) : 1;
        if (colAlpha <= 0) continue;

        const gradientIndex = Math.max(
          0,
          effectiveGradient * i + (1 - effectiveGradient) * ((chainLen - 1) - i)
        );
        const baseAlpha = gradientIndex <= 0.01 ? 0.95 : Math.max(0.18, 0.9 - gradientIndex * fadeRate);
        const drawAlpha = baseAlpha * colAlpha;
        if (drawAlpha <= 0.02) continue;

        const transAge = tnow - transAtCol[r];
        const tBlend = transAge >= GLYPH_FADE_MS ? 1 : Math.max(0, transAge) / GLYPH_FADE_MS;
        const ch = glyphFor(c, r, phasesCol[r]);
        const prevCh = tBlend < 1 ? glyphFor(c, r, prevPhasesCol[r]) : ch;

        // Whiteness peaks at the head
        const whiteness = colWhiteHead[c] ? Math.max(0, 1 - Math.abs(i - leadingPos)) : 0;
        if (whiteness > 0.01) {
          const wAlpha = colAlpha * whiteness;
          ctx.fillStyle = WHITE_FILL;
          ctx.shadowColor = WHITE_GLOW;
          ctx.shadowBlur = whiteBlur;
          if (tBlend < 1 && prevCh !== ch) {
            ctx.globalAlpha = wAlpha * (1 - tBlend);
            ctx.fillText(prevCh, x, y);
          }
          ctx.globalAlpha = wAlpha * (tBlend < 1 ? tBlend : 1);
          ctx.fillText(ch, x, y);
          // Second pass for more glow
          ctx.fillText(ch, x, y);
          ctx.fillStyle = FILL;
          ctx.shadowColor = GLOW;
          ctx.shadowBlur = greenBlur;
        }
        if (whiteness < 0.99) {
          const gAlpha = drawAlpha * (1 - whiteness);
          // Only blur the bright glyphs
          ctx.shadowColor = GLOW;
          ctx.shadowBlur = Math.abs(i - leadingPos) < 1.5 ? greenBlur : 0;
          if (tBlend < 1 && prevCh !== ch) {
            ctx.globalAlpha = gAlpha * (1 - tBlend);
            ctx.fillText(prevCh, x, y);
            ctx.globalAlpha = gAlpha * tBlend;
            ctx.fillText(ch, x, y);
          } else {
            ctx.globalAlpha = gAlpha;
            ctx.fillText(ch, x, y);
          }
        }
      }
    }
    ctx.globalAlpha = 1;
  };

  return rain;
};

// Header Digital Rain

(() => {

  function initHeaderRain() {
    const header = document.querySelector('header');
    if (!header) return;

    const FRAME_INTERVAL = 1000 / 30; //limit to 30fps
    const canvas = document.createElement('canvas');
    canvas.id = 'headerRainCanvas';
    header.appendChild(canvas);
    const rain = createDigitalRain(canvas);

    let lastFrameTime = performance.now();
    let isHeaderVisible = true;
    let pausedForVisibility = false;

    // Scroll distance for the rain to fill the header (header height on mobile)
    const compactQuery = window.matchMedia('(max-width: 768px)');
    let revealScrollRange = 1100;
    let sizedFor = '';

    function size() {
      const cw = Math.max(1, header.clientWidth);
      const ch = Math.max(1, header.clientHeight);
      // URL bar fires resize on mobile, only rebuild if the header size changed
      const key = cw + 'x' + ch + '@' + rainDpr();
      if (key === sizedFor) return;
      sizedFor = key;
      revealScrollRange = compactQuery.matches ? Math.max(240, ch * 0.55) : 1100;
      // Bigger glyphs on phones
      rain.resize(cw, ch, compactQuery.matches ? 11 : 10);
    }

    size();
    window.addEventListener('resize', size);
    window.addEventListener('load', size);

    new IntersectionObserver(([entry]) => {
      isHeaderVisible = entry.isIntersecting;
    }).observe(header);

    let lastY = window.scrollY;
    const RAIN_RAMP_EXPONENT = 0.75; // < 1 brightens sooner
    let colTops = new Float32Array(0);

    function tick() {
      const nowTs = performance.now();
      if (nowTs - lastFrameTime < FRAME_INTERVAL) {
        requestAnimationFrame(tick);
        return;
      }
      lastFrameTime = nowTs;

      if (!isHeaderVisible) {
        if (!pausedForVisibility) {
          rain.clear();
          pausedForVisibility = true;
        }
        requestAnimationFrame(tick);
        return;
      }
      pausedForVisibility = false;

      const nowY = window.scrollY;
      rain.advance(nowY - lastY);
      lastY = nowY;

      const scrollFactor = Math.max(0, Math.min(1, nowY / revealScrollRange));
      const ramp = Math.pow(scrollFactor, RAIN_RAMP_EXPONENT);
      if (ramp <= 0) {
        rain.clear();
        requestAnimationFrame(tick);
        return;
      }

      // Rain fills the header from the bottom up as you scroll
      const { h, step, cols } = rain;
      const visibleTopY = Math.floor((1 - ramp) * h);
      const featherPx = Math.round(8 * step);
      const bleedPx   = Math.round(3 * step);
      const jitterPx  = Math.round(10 * step);
      if (colTops.length !== cols) colTops = new Float32Array(cols);
      for (let c = 0; c < cols; c++) {
        const jitterSeed = hash32((c + 1) * 2654435761);
        const jitterUnit = (jitterSeed % 2001) / 1000 - 1; // [-1, 1]
        // Columns only trail the line, never lead it
        colTops[c] = visibleTopY + jitterUnit * jitterUnit * jitterPx;
      }

      rain.draw(nowTs, (c, x, y) => {
        const delta = y - colTops[c];
        if (delta < -bleedPx) return 0;
        if (delta < 0) return 0.15 + 0.40 * (1 + delta / bleedPx);
        if (delta < featherPx) return 0.25 + 0.75 * (delta / featherPx);
        return 1;
      });

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

// Sidebar digital rain + selected link effect

(() => {
  const FRAME_INTERVAL = 1000 / 30; // limit to 30fps
  const GLYPH_PX = 10;        // same as header
  const BAND_GLIDE = 0.35;    // glide speed
  const DECODE_LEAD_MS = 45;  // ms before decode starts
  const DECODE_CHAR_MS = 16;  // ms per char
  const DECODE_ROLL_MS = 45;  // ms between re-rolls

  const currentLang = () => (document.body.classList.contains('fr') ? 'fr' : 'en');
  const labelText = (link) => link.getAttribute(`data-${currentLang()}`) || link.dataset.label || link.textContent;

  // Decode text out of the rain, left to right (section links only)
  const decodeFrames = new WeakMap();
  const decodeLabel = (link) => {
    if (document.documentElement.classList.contains('lite-mode')) return;
    if (link.closest('.sidebar-dropdown')) return;
    cancelAnimationFrame(decodeFrames.get(link));
    const start = performance.now();
    const salt = (Math.random() * 1e9) | 0;
    // Lock height so the links below don't move
    link.style.height = `${link.getBoundingClientRect().height}px`;
    link.setAttribute('aria-label', labelText(link));

    const frame = (now) => {
      const text = labelText(link); // in case language changes
      const elapsed = now - start;
      const tip = Math.max(0, Math.floor((elapsed - DECODE_LEAD_MS) / DECODE_CHAR_MS));
      if (tip >= text.length) {
        link.textContent = text;
        link.style.height = '';
        link.removeAttribute('aria-label');
        decodeFrames.delete(link);
        return;
      }
      const roll = Math.floor(elapsed / DECODE_ROLL_MS);
      const glyph = (i) => (text[i] === ' '
        ? ' '
        : RAIN_ASCII_GLYPHS.charAt(hash32(salt + i * 7919 + roll * 104729) % RAIN_ASCII_GLYPHS.length));
      const tipSpan = document.createElement('span');
      tipSpan.className = 'rain-decode__tip';
      tipSpan.textContent = glyph(tip);
      const restSpan = document.createElement('span');
      restSpan.className = 'rain-decode__glyph';
      let rest = '';
      for (let i = tip + 1; i < text.length; i++) rest += glyph(i);
      restSpan.textContent = rest;
      link.replaceChildren(text.slice(0, tip), tipSpan, restSpan);
      decodeFrames.set(link, requestAnimationFrame(frame));
    };
    decodeFrames.set(link, requestAnimationFrame(frame));
  };

  function initSidebarRain() {
    const sidebar = document.getElementById('sidebar');
    const nav = sidebar?.querySelector('nav');
    if (!sidebar || !nav || sidebar.querySelector('#sidebarRainCanvas')) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'sidebarRainCanvas';
    sidebar.insertBefore(canvas, sidebar.firstChild);
    // Extra off-canvas rows so the density matches the header
    const rain = createDigitalRain(canvas, {
      seed: 7919,
      cover: true,
      gridRows: (rows) => Math.max(rows + 12, 64),
    });

    const dropdown = document.getElementById('projectsDropdown');
    const projectsList = document.getElementById('projectsList');
    const range = document.createRange();
    const band = { x0: 0, y0: 0, x1: 0, y1: 0, alpha: 0 }; // selected link
    const tree = { y0: 0, y1: 0 }; // open project list
    let hovered = null;
    let active = null;
    let selected = null;
    let spyDirty = true;
    let lastFrameTime = 0;
    let lastY = window.scrollY;

    // Links and their sections
    const sectionLinks = [...nav.querySelectorAll('a[href^="#"]')]
      .filter((link) => !link.closest('.sidebar-dropdown'))
      .map((link) => ({ link, section: document.getElementById(link.getAttribute('href').slice(1)) }))
      .filter(({ section }) => section);

    // Chevron counts as the Projects link
    const linkFor = (target) => {
      const hit = target instanceof Element ? target.closest('a, .sidebar-toggle') : null;
      if (!hit || !nav.contains(hit)) return null;
      return hit.matches('.sidebar-toggle') ? hit.parentElement.querySelector('a') : hit;
    };

    const select = () => {
      const next = [hovered, active].find((link) => link?.isConnected) || null;
      if (next === selected) return;
      selected?.classList.remove('is-selected');
      selected = next;
      if (next) {
        next.classList.add('is-selected');
        decodeLabel(next);
      }
    };

    // Current section is the one 35% down the screen (or the project card if the dropdown is open)
    // Over the last screen of scrolling the line slides to the bottom, so short sections at the end still get a turn
    const updateActive = () => {
      const vh = window.innerHeight;
      const remaining = document.documentElement.scrollHeight - vh - window.scrollY;
      const t = Math.min(1, Math.max(0, 1 - remaining / vh));
      const line = vh * (0.35 + 0.65 * t);
      let current = null;
      sectionLinks.forEach((entry) => {
        const rect = entry.section.getBoundingClientRect();
        if (rect.top <= line && rect.bottom > 0) current = entry;
      });
      let link = current ? current.link : null;
      if (current?.section.id === 'projects' && dropdown?.classList.contains('open')) {
        projectsList.querySelectorAll('a[href^="#"]').forEach((projectLink) => {
          const card = document.getElementById(projectLink.getAttribute('href').slice(1));
          if (card && card.getBoundingClientRect().top <= line) link = projectLink;
        });
      }
      if (link !== active) {
        active?.removeAttribute('aria-current');
        active = link;
        active?.setAttribute('aria-current', 'location');
      }
      select();
    };

    // Move band toward selected link
    const updateBand = () => {
      let target = null;
      if (selected) {
        range.selectNodeContents(selected);
        const text = range.getBoundingClientRect();
        let top = text.top;
        let bottom = text.bottom;
        const clip = selected.closest('.sidebar-dropdown');
        if (clip) {
          const box = clip.getBoundingClientRect();
          top = Math.max(top, box.top);
          bottom = Math.min(bottom, box.bottom);
        }
        if (text.width && bottom > top) {
          const box = sidebar.getBoundingClientRect();
          const ox = box.left + sidebar.clientLeft;
          const oy = box.top + sidebar.clientTop;
          const d = rain.dpr;
          target = { x0: (text.left - ox) * d, x1: (text.right - ox) * d, y0: (top - oy) * d, y1: (bottom - oy) * d };
        }
      }
      if (target) {
        const glide = band.alpha < 0.05 ? 1 : BAND_GLIDE;
        band.x0 += (target.x0 - band.x0) * glide;
        band.x1 += (target.x1 - band.x1) * glide;
        band.y0 += (target.y0 - band.y0) * glide;
        band.y1 += (target.y1 - band.y1) * glide;
        band.alpha += (1 - band.alpha) * 0.3;
      } else {
        band.alpha = band.alpha > 0.02 ? band.alpha * 0.7 : 0;
      }
    };

    // Dimmer rain behind project list
    const updateTree = () => {
      tree.y0 = tree.y1 = 0;
      if (!dropdown?.classList.contains('open')) return;
      const box = dropdown.getBoundingClientRect();
      const oy = sidebar.getBoundingClientRect().top + sidebar.clientTop;
      tree.y0 = (box.top - oy) * rain.dpr;
      tree.y1 = (box.bottom - oy) * rain.dpr;
    };

    // Clear rain behind selected text
    const shade = (c, x, y) => {
      const cx = x + rain.stepX * 0.4;
      const cy = y + rain.stepY * 0.5;
      const dim = cy > tree.y0 && cy < tree.y1 ? 0.45 : 1;
      if (band.alpha <= 0) return dim;
      const inside = cx > band.x0 - rain.stepX && cx < band.x1 + rain.stepX
        && cy > band.y0 - rain.stepY * 0.25 && cy < band.y1 + rain.stepY * 0.25;
      return inside ? dim * (1 - 0.85 * band.alpha) : dim;
    };

    const render = (now) => {
      // No sidebar rain in dark mode (gutters have it)
      const ambient = !document.body.classList.contains('dark-mode');
      rain.draw(now, shade, ambient);
    };

    const size = () => {
      if (!sidebar.clientWidth) return; // hidden on phones
      rain.resize(sidebar.clientWidth, sidebar.clientHeight, GLYPH_PX);
      render(performance.now()); // redraw after resize
    };

    const tick = (now) => {
      requestAnimationFrame(tick);
      if (now - lastFrameTime < FRAME_INTERVAL) return;
      lastFrameTime = now;
      if (!sidebar.clientWidth || !rain.cols) return;
      const y = window.scrollY;
      rain.advance(y - lastY);
      lastY = y;
      if (spyDirty) {
        spyDirty = false;
        updateActive();
      }
      updateBand();
      updateTree();
      render(now);
    };

    // Keep last hover in the gaps between links
    nav.addEventListener('pointerover', (event) => {
      const link = linkFor(event.target);
      if (link) {
        hovered = link;
        select();
      }
    });
    nav.addEventListener('pointerleave', () => {
      hovered = null;
      select();
    });
    nav.addEventListener('focusin', (event) => {
      hovered = linkFor(event.target);
      select();
    });
    nav.addEventListener('focusout', (event) => {
      if (nav.contains(event.relatedTarget)) return;
      hovered = null;
      select();
    });

    const markSpyDirty = () => { spyDirty = true; };
    window.addEventListener('scroll', markSpyDirty, { passive: true });
    window.addEventListener('resize', markSpyDirty);
    if (dropdown) new MutationObserver(markSpyDirty).observe(dropdown, { attributes: true, attributeFilter: ['class'] });
    if (projectsList) new MutationObserver(markSpyDirty).observe(projectsList, { childList: true });

    size();
    new ResizeObserver(size).observe(sidebar);
    window.addEventListener('resize', size); // zoom changes dpr
    requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebarRain);
  } else {
    initSidebarRain();
  }
})();

// Content gutter rain (dark mode only)

(() => {
  function initContentRain() {
    const wrapper = document.querySelector('.content-rain-wrapper');
    if (!wrapper) return;
    const canvases = wrapper.querySelectorAll('.content-rain-canvas');
    if (!canvases.length) return;
    const contentArea = wrapper.querySelector('main');
    const GUTTER_BUFFER = 18; // gap from content
    const COLUMN_RATE_VARIANCE = 0.7;
    const COLUMN_RATE_SHIFT = 0.45; // slows all columns
    const COLUMN_SPEED_VARIANCE = 0.5; // speed variation per column
    const GLYPH_FADE_MS = 180; // glyph crossfade
    const FRAME_INTERVAL = 1000 / 30; // limit to 30fps
    let lastFrameTime = performance.now();
    const RAIN_FILL = cssVar('--rain-color', 'rgba(0,255,140,0.75)');
    const RAIN_GLOW = cssVar('--rain-glow', 'rgba(0,255,140,0.45)');

    const createState = (canvas) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
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
        colRates: [],
        colSpeeds: [],
        colScrollAccums: [],
        cellRowOffsets: [],
        cellPhases: [],
        cellPrevPhases: [],
        cellTransitionAt: [],
        changeInterval: 260 + Math.random() * 140,
        lastScrollY: window.scrollY,
        gradientMomentum: 0,
        gradientTarget: 0.5,
        gradientMix: 0.5,
        jitterSeed: Math.floor(Math.random() * 0x7fffffff),
        pendingResize: null
      };
    };

    const states = Array.from(canvases, createState).filter(Boolean);
    if (!states.length) return;

    const applyResizeState = (state, wrapperHeight, sideWidth) => {
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
      state.colRates = new Array(state.cols);
      state.colSpeeds = new Array(state.cols);
      state.colScrollAccums = new Array(state.cols);
      state.cellRowOffsets = new Array(state.cols);
      state.cellPhases = new Array(state.cols);
      state.cellPrevPhases = new Array(state.cols);
      state.cellTransitionAt = new Array(state.cols);
      for (let i = 0; i < state.cols; i++) {
        const rateHash = hash32(i * 9876541 + 12345);
        const rateRandom = (rateHash % 10001) / 10000;
        state.colRates[i] = Math.pow(2, (rateRandom - 0.5) * 2 * COLUMN_RATE_VARIANCE - COLUMN_RATE_SHIFT);
        const speedHash = hash32(i * 2654435761 + 17);
        const speedRandom = (speedHash % 10001) / 10000;
        state.colSpeeds[i] = 1 + (speedRandom - 0.5) * 2 * COLUMN_SPEED_VARIANCE;
        state.colScrollAccums[i] = 0;
        const rowOffsets = new Float32Array(state.rows);
        const phases = new Int32Array(state.rows);
        const prevPhases = new Int32Array(state.rows);
        const transAt = new Float32Array(state.rows);
        for (let r = 0; r < state.rows; r++) {
          const offHash = hash32((i + 1) * 374761393 ^ (r + 1) * 668265263);
          rowOffsets[r] = (offHash % 100000) / 100000;
          phases[r] = 0;
          prevPhases[r] = 0;
          transAt[r] = -1e9;
        }
        state.cellRowOffsets[i] = rowOffsets;
        state.cellPhases[i] = phases;
        state.cellPrevPhases[i] = prevPhases;
        state.cellTransitionAt[i] = transAt;
      }

      const minX = Math.max(4 * dpr, state.stepX * 0.7);
      const maxX = Math.max(minX + dpr, state.width - minX);
      const positions = [];
      const usableWidth = Math.max(0, maxX - minX);
      const lane = state.cols > 0 ? usableWidth / state.cols : usableWidth;
      for (let i = 0; i < state.cols; i++) {
        const jitterRange = lane * 0.28;
        const jitterSeed = hash32(state.jitterSeed + (i + 1) * 2654435761);
        const jitterUnit = (jitterSeed % 2001) / 1000 - 1; // [-1, 1]
        const candidate =
          minX +
          lane * (i + 0.5) +
          jitterUnit * jitterRange;
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
        state.pendingResize = { wrapperHeight: targetHeight, sideWidth };
      });
    };

    const resizeObserver = new ResizeObserver(resizeAll);
    resizeObserver.observe(wrapper);
    states.forEach((state) => resizeObserver.observe(state.canvas));
    window.addEventListener('resize', resizeAll, { passive: true });
    resizeAll();

    let running = false;

    const tick = () => {
      if (!document.body.classList.contains('dark-mode')) {
        states.forEach((state) => state.ctx.clearRect(0, 0, state.width, state.height));
        running = false;
        return;
      }
      const now = performance.now();
      if (now - lastFrameTime < FRAME_INTERVAL) {
        requestAnimationFrame(tick);
        return;
      }
      lastFrameTime = now;
      const globalScroll = window.scrollY;

      states.forEach((state) => {
        if (state.pendingResize) {
          const pending = state.pendingResize;
          state.pendingResize = null;
          applyResizeState(state, pending.wrapperHeight, pending.sideWidth);
        }

        if (!state.cols || !state.rows || !state.width || !state.height) return;

        const dy = globalScroll - state.lastScrollY;
        state.lastScrollY = globalScroll;

        state.gradientMomentum = state.gradientMomentum * 0.9 + dy;
        state.gradientMomentum = Math.max(-40, Math.min(40, state.gradientMomentum));
        state.gradientTarget = 0.5 + 0.5 * (state.gradientMomentum / 40);
        state.gradientTarget = Math.max(0, Math.min(1, state.gradientTarget));
        state.gradientMix += (state.gradientTarget - state.gradientMix) * 0.2;
        if (state.gradientMix < 0) state.gradientMix = 0;
        else if (state.gradientMix > 1) state.gradientMix = 1;

        if (dy !== 0) {
          for (let c = 0; c < state.cols; c++) {
            state.colScrollAccums[c] += (dy / 25) * (state.colSpeeds[c] || 1);
            if (state.colScrollAccums[c] > 3) state.colScrollAccums[c] = 3;
            else if (state.colScrollAccums[c] < -3) state.colScrollAccums[c] = -3;
          }
        }
        for (let c = 0; c < state.cols; c++) {
          const a = state.colScrollAccums[c];
          let steps = 0;
          if (a >= 1) steps = Math.floor(a);
          else if (a <= -1) steps = Math.ceil(a);
          if (steps !== 0) {
            let head = state.heads[c] - steps;
            head %= state.rows;
            if (head < 0) head += state.rows;
            state.heads[c] = head;
            state.colScrollAccums[c] -= steps;
          }
        }

        // Check which cells changed glyph
        const baseUnit = now / state.changeInterval;
        for (let c = 0; c < state.cols; c++) {
          const rate = state.colRates[c] || 1;
          const base = baseUnit * rate;
          const offsets = state.cellRowOffsets[c];
          const phases = state.cellPhases[c];
          const prevPhases = state.cellPrevPhases[c];
          const transAt = state.cellTransitionAt[c];
          for (let r = 0; r < state.rows; r++) {
            const newPhase = Math.floor(base + offsets[r]);
            if (newPhase !== phases[r]) {
              prevPhases[r] = phases[r];
              phases[r] = newPhase;
              transAt[r] = now;
            }
          }
        }

        const ctx = state.ctx;
        ctx.clearRect(0, 0, state.width, state.height);
        ctx.font = Math.floor(state.step * 1.3) + 'px monospace';
        ctx.textBaseline = 'top';
        ctx.fillStyle = RAIN_FILL;
        ctx.shadowColor = RAIN_GLOW;
        const rainBlur = Math.round(state.step * 1.4); // green glow
        ctx.shadowBlur = 0;

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
          const leadingPos = (1 - effectiveGradient) * (chainLen - 1);
          const head = state.heads[c];
          const jitterSeed = hash32((c + 1) * 2654435761);
          const jitter = ((jitterSeed % 2001) / 1000 - 1) * jitterPx;
          const colTop = jitter;
          const baseX = colPositions[c] !== undefined ? colPositions[c] : (state.width * (c / Math.max(1, state.cols)));
          const phasesCol = state.cellPhases[c];
          const prevPhasesCol = state.cellPrevPhases[c];
          const transAtCol = state.cellTransitionAt[c];

          for (let i = 0; i < chainLen; i++) {
            const r = (head + i) % state.rows;
            const phaseNow = phasesCol[r];
            const phasePrev = prevPhasesCol[r];
            const transAge = now - transAtCol[r];
            const tBlend = transAge >= GLYPH_FADE_MS ? 1 : Math.max(0, transAge) / GLYPH_FADE_MS;
            const seedNow = ((c + 1) * 73856093) ^ ((r + 1) * 19349663) ^ (phaseNow * 83492791);
            const ch = RAIN_ASCII_GLYPHS.charAt(hash32(seedNow) % RAIN_ASCII_GLYPHS.length);
            let prevCh = ch;
            if (tBlend < 1) {
              const seedPrev = ((c + 1) * 73856093) ^ ((r + 1) * 19349663) ^ (phasePrev * 83492791);
              prevCh = RAIN_ASCII_GLYPHS.charAt(hash32(seedPrev) % RAIN_ASCII_GLYPHS.length);
            }
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
            // Only blur the bright glyphs
            ctx.shadowBlur = Math.abs(i - leadingPos) < 1.5 ? rainBlur : 0;
            if (tBlend < 1 && prevCh !== ch) {
              ctx.globalAlpha = drawAlpha * (1 - tBlend);
              ctx.fillText(prevCh, x, y);
              ctx.globalAlpha = drawAlpha * tBlend;
              ctx.fillText(ch, x, y);
            } else {
              ctx.globalAlpha = drawAlpha;
              ctx.fillText(ch, x, y);
            }
          }
        }

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      });

      requestAnimationFrame(tick);
    };

    const start = () => {
      if (running || !document.body.classList.contains('dark-mode')) return;
      running = true;
      requestAnimationFrame(tick);
    };
    new MutationObserver(start).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    start();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContentRain);
  } else {
    initContentRain();
  }
})();


/* Terminal disabled for now
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

  const FILE_LIST_EN = ['work.txt', '\nskills.txt', '\nprojects.txt'];
  const FILE_LIST_FR = ['travail.txt', '\nhabiletes.txt', '\nprojets.txt'];

  const PROJECT_LINKS_EN = [
    { prefix: '1. ', text: 'Road Learning Tool (React/TypeScript)', href: '#road-learning-tool' },
    { prefix: '2. ', text: '32-Bit RISC Processor Design (Verilog/FPGA)', href: '#project-cpu-risc' },
    { prefix: '3. ', text: 'Running & Jumping Detection (Python ML)', href: '#project-running-jumping' },
    { prefix: '4. ', text: 'Dynamic Time Allocating Calendar (C++/Qt)', href: '#project-dynamic-calendar' },
    { prefix: '5. ', text: '911 Dispatcher Training Device (Web + Arduino)', href: '#project-911-training' },
    { prefix: '6. ', text: 'Fluid and Powder Dispensing Device (Arduino)', href: '#project-fluid-dispensing' }
  ];

  const PROJECT_LINKS_FR = [
    { prefix: '1. ', text: 'Outil d\'apprentissage des routes (React/TypeScript)', href: '#road-learning-tool' },
    { prefix: '2. ', text: 'Conception d\'un processeur RISC 32 bits (Verilog/FPGA)', href: '#project-cpu-risc' },
    { prefix: '3. ', text: 'Détection de course et de saut (Python)', href: '#project-running-jumping' },
    { prefix: '4. ', text: 'Calendrier à allocation dynamique du temps (C++/Qt)', href: '#project-dynamic-calendar' },
    { prefix: '5. ', text: 'Appareil de formation pour opérateur 911 (Web + Arduino)', href: '#project-911-training' },
    { prefix: '6. ', text: 'Dispositif de distribution de fluide et de poudre (Arduino)', href: '#project-fluid-dispensing' }
  ];

  const SKILLS_OUTPUT_EN = [
    'PROGRAMMING EXPERIENCE: C/C++, Python, Java, Assembly (Nios II), JavaScript, VHDL, Qt framework',
    'LIBRARIES AND FRAMEWORKS: Qt, Matplotlib, Pandas, Scikit-learn, Seaborn, h5py',
    'TOOLS: Git, Arduino, LTspice, SolidWorks',
    'DATABASES: SQL, HDF5',
    'WEB: HTML, CSS'
  ];

  const SKILLS_OUTPUT_FR = [
    'LANGAGES: Python, C, C++, Java, JavaScript, Assembly (NIOS II), VHDL',
    'OUTILS: Git, Arduino, Qt, LTspice, SolidWorks',
    'BASES DE DONNÉES: SQL, HDF5',
    'WEB: HTML, CSS'
  ];

  const WORK_HISTORY_EN = [
    'RADIO SOFTWARE DEVELOPER INTERN @ Ericsson\n(May 2026 - Aug 2027)',
    '  -Develop and execute test strategies using Python',
    '    for 5G/LTE Radio software verification',
    '  -Configure lab environments and operate analysis',
    '    tools (Signal Analyzer, Oscilloscope, IXIA, VIAVI)',
    '  -Collaborate with design and product support teams',
    '\n',
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
  ];

  const WORK_HISTORY_FR = [
    'STAGIAIRE EN DÉVELOPPEMENT LOGICIEL RADIO @ Ericsson\n(mai 2026 - août 2027)',
    '  -Stratégies de test avec Python pour logiciels',
    '    radio 5G/LTE',
    '  -Configuration d\'environnements de laboratoire et',
    '    outils d\'analyse (analyseur de signal, oscilloscope)',
    '  -Collaboration avec les équipes de conception et',
    '    de support produit',
    '\n',
    'STAGIAIRE AUX SERVICES DE LA CIRCULATION @ Ville d\'Ottawa\n(mai - août 2025)',
    '  -Analyse de données piétonnes et routières',
    '  -Outils SIG pour cartographier les modèles de circulation',
    '  -Automatisation avec Microsoft Power Automate',
    '\n',
    'ASSISTANT À LA GESTION DES GRAFFITIS @ Ville d\'Ottawa\n(mai - août 2024)',
    '  -Gestion de la base de données municipale de graffitis',
    '  -Suivi des demandes de service et de l\'avancement des t\u00e2ches',
    '  -Utilisation d\'équipements spécialisés de nettoyage',
    '\n',
    'ANIMATEUR DE CAMP @ Mountain Bike Kids\n(juin - août 2022)',
    '  -Supervision de campeurs âgés de 8 à 14 ans',
    '  -Organisation de sorties en vélo de montagne et excursions',
  ];

  const VIRTUAL_FILES = {
    en: {
      'projects.txt': PROJECT_LINKS_EN,
      'skills.txt': SKILLS_OUTPUT_EN,
      'work.txt': WORK_HISTORY_EN,
      'projects': PROJECT_LINKS_EN,
      'skills': SKILLS_OUTPUT_EN,
      'work': WORK_HISTORY_EN,
    },
    fr: {
      'projets.txt': PROJECT_LINKS_FR,
      'habiletes.txt': SKILLS_OUTPUT_FR,
      'habiletés.txt': SKILLS_OUTPUT_FR,
      'travail.txt': WORK_HISTORY_FR,
      'projets': PROJECT_LINKS_FR,
      'habiletes': SKILLS_OUTPUT_FR,
      'habiletés': SKILLS_OUTPUT_FR,
      'travail': WORK_HISTORY_FR,
    },
  };

  const fileListFor = (lang) => (lang === 'fr' ? FILE_LIST_FR : FILE_LIST_EN);

  const COMMANDS_EN = {
    help: {
      output: [
        'Available commands:',
        //'  about\t\t- Learn more about me',
        '  dark\t\t- Toggle dark mode theme',
        '  ls\t\t- List files',
        '  cat <file>\t- View file contents',
        '  git status\t- Show my status',
        '  ifconfig\t- My contact information',
        '  fortune\t- Random programming joke',
        '  help\t\t- Show this help message',
        '  clear\t\t- Clear the terminal',
        'Use Tab to autocomplete commands, and up/down keys to navigate command history.'
      ]
    },
    ls: {
      output: [
        FILE_LIST_EN.join('  ')
      ]
    },
    ifconfig: {
      output: [
        'Email: julienchagnon9@gmail.com',
        'LinkedIn: linkedin.com/in/julienjchagnon',
        'GitHub: github.com/JulienChagnon'
      ]
    },
    dark: {
      action: toggleDarkMode
    },
    'git status': {
      output: [
        'Currently working as a Radio Software Developer Intern at Ericsson, Ottawa. Verifying 5G/LTE radio software through manual and automated testing with Python',
      ]
    },
    fortune: {
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
        '  ls\t\t- Lister les fichiers',
        '  cat <fichier>\t- Lire un fichier',
        '  git status\t- Afficher mon statut',
        '  ifconfig\t- Mes contacts',
        '  fortune\t- Blague de programmation',
        '  aide\t\t- Afficher ce message d\'aide',
        '  clear\t\t- Effacer le terminal',
        'Utilisez Tab pour compléter les commandes, et les flèches haut/bas pour naviguer dans l\'historique des commandes.'
      ]
    },
    ls: {
      output: [
        FILE_LIST_FR.join('  ')
      ]
    },
    ifconfig: {
      output: [
        'Courriel : julienchagnon9@gmail.com',
        'LinkedIn : linkedin.com/in/julienjchagnon',
        'GitHub : github.com/JulienChagnon'
      ]
    },
    sombre: {
      action: toggleDarkMode
    },
    'git status': {
      output: [
        'Pr\u00e9sentement en poste comme stagiaire en d\u00e9veloppement logiciel radio chez Ericsson, Ottawa. V\u00e9rification de logiciels radio 5G/LTE par tests manuels et automatis\u00e9s avec Python',
      ]
    },
    fortune: {
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
  const getVirtualFiles = (lang) => lang === 'fr' ? VIRTUAL_FILES.fr : VIRTUAL_FILES.en;
  const catFileNamesFor = (lang) => Object.keys(getVirtualFiles(lang) || {});
  const commandNamesFor = (lang) => {
    const names = Object.keys(getCommands(lang));
    catFileNamesFor(lang).forEach((file) => {
      const catName = `cat ${file}`;
      if (!names.includes(catName)) {
        names.push(catName);
      }
    });
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
    const disableTerminal = window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
    if (disableTerminal) {
      const existingWrapper = header.querySelector('#headerTerminalWrapper');
      if (existingWrapper) {
        existingWrapper.remove();
      }
      return;
    }

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

    // Remove old hint
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

    const focusWithoutScroll = (node) => {
      if (!node || typeof node.focus !== 'function') return;
      const prevX = window.scrollX || window.pageXOffset || 0;
      const prevY = window.scrollY || window.pageYOffset || 0;
      try {
        node.focus({ preventScroll: true });
      } catch (_) {
        node.focus();
      }
      const nextX = window.scrollX || window.pageXOffset || 0;
      const nextY = window.scrollY || window.pageYOffset || 0;
      if (nextX !== prevX || nextY !== prevY) {
        const htmlEl = document.documentElement;
        const originalBehavior = htmlEl && htmlEl.style ? htmlEl.style.scrollBehavior : '';
        if (htmlEl && htmlEl.style) {
          htmlEl.style.scrollBehavior = 'auto';
        }
        window.scrollTo(prevX, prevY);
        if (htmlEl && htmlEl.style) {
          htmlEl.style.scrollBehavior = originalBehavior;
        }
      }
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
      hintOverlay.innerHTML = activeLang === 'fr'
        ? "# EMULATEUR de TERMINAL: Tapez &apos;<span class=\"term-hint-keyword\">aide</span>&apos; pour voir les commandes disponibles"
        : "# TERMINAL EMULATOR: Type &apos;<span class=\"term-hint-keyword\">help</span>&apos; to see available commands";
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
          focusWithoutScroll(activeInput);
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

      const virtualFiles = getVirtualFiles(activeLang);
      const availableFiles = fileListFor(activeLang);
      if (cmd === 'cat') {
        const usageList = activeLang === 'fr'
          ? 'travail.txt, habiletes.txt (habiletés.txt), projets.txt'
          : availableFiles.join(', ');
        const usage = activeLang === 'fr'
          ? `Utilisation : cat <fichier>. Fichiers disponibles : ${usageList}`
          : `Usage: cat <file>. Available files: ${usageList}`;
        await printOutput([usage], outputOptions);
        return;
      }

      if (cmd.startsWith('cat ')) {
        const fileName = cmd.slice(4).trim().toLowerCase();
        if (!fileName) {
          const exampleFile = availableFiles[0] || 'projects.txt';
          const missing = activeLang === 'fr'
            ? `Veuillez préciser un fichier. Exemple : cat ${exampleFile}`
            : `Please specify a file. Example: cat ${exampleFile}`;
          await printOutput([missing], outputOptions);
          return;
        }
        if (virtualFiles[fileName]) {
          await printOutput(virtualFiles[fileName], outputOptions);
        } else {
          const notFoundFile = activeLang === 'fr'
            ? `Fichier introuvable : ${fileName}`
            : `File not found: ${fileName}`;
          await printOutput([notFoundFile], outputOptions);
        }
        return;
      }

      if (commands[cmd]) {
        // Random fortune
        if (cmd === 'fortune' && commands[cmd].jokes) {
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
      const autoCommand = 'git status';
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
        setTimeout(() => focusWithoutScroll(input), 100);
      }
    }

    const handleLanguageChange = async (event) => {
      const lang = event && event.detail && event.detail.lang ? event.detail.lang : currentLanguage();
      if (lang !== activeLang) {
        if (pendingAutoCommand) {
          try {
            await pendingAutoCommand;
          } catch (_) {
            // already logged
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
*/
