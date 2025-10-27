
// --- See More / See Less Button on Job History --- 
const btn       = document.getElementById('toggleJobs');
const moreJobs  = document.querySelector('.more-jobs');
const labelSpan = btn.querySelector('.lang-text');
btn.addEventListener('click', () => {
  const isOpen = moreJobs.classList.toggle('show');
  const lang = document.body.classList.contains('fr') ? 'fr' : 'en';
  const key  = isOpen ? 'hide' : 'show';
  const attr = `data-${lang}-${key}`;
  labelSpan.textContent = btn.getAttribute(attr);
});

// Set the footer year dynamically
document.getElementById('year').textContent = new Date().getFullYear();

// Sidebar follow‑scroll animation (init early + prevent flash)
document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const header  = document.querySelector('header.header-flex');
  if (!sidebar || !header) return;

  const unlockThreshold = 260;
  let offsetTop = 0;
  let currentY = 0;

  sidebar.style.position = 'absolute';
  // Hide until we compute the correct position to avoid a flash
  if (!sidebar.style.visibility) sidebar.style.visibility = 'hidden';

  const recompute = () => {
    const headerHeight = header.getBoundingClientRect().height || header.offsetHeight || 0;
    offsetTop = headerHeight + 10;
    if (currentY === 0) currentY = offsetTop;
    sidebar.style.top = `${currentY}px`;
  };

  // Initial compute
  recompute();

  // Reveal after first compute in next frame
  requestAnimationFrame(() => {
    sidebar.style.visibility = 'visible';
  });

  // Keep in sync with header size changes (image load, responsive)
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => recompute());
    ro.observe(header);
  } else {
    window.addEventListener('resize', recompute);
    window.addEventListener('load', recompute);
  }

  function animate() {
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const targetY = scrollY < unlockThreshold ? offsetTop : scrollY + 100;
    currentY += (targetY - currentY) * 0.4;
    sidebar.style.top = `${currentY}px`;
    requestAnimationFrame(animate);
  }
  animate();
});


// Open video in new tab buttons
document.getElementById('openVideoBtn').addEventListener('click', function() {
    window.open('Media/APSC101Demo.mp4', '_blank');
});

document.getElementById('openVideoBtn2').addEventListener('click', function() {
    window.open('Media/APSC103Demo.mp4', '_blank');
});

document.getElementById('openVideoBtn3').addEventListener('click', function() {
    window.open('Media/ELEC292Demo.mp4', '_blank');
});



// language + theme switch
const langButton = document.getElementById('langButton');
const body = document.body;
const texts = document.querySelectorAll('.lang-text');

function updateLanguage(isFr) {
  body.classList.toggle('fr', isFr);
  langButton.textContent = isFr ? 'English' : 'Français';

  texts.forEach(el => {
    el.textContent = isFr
      ? el.getAttribute('data-fr')
      : el.getAttribute('data-en');
  });

  const params = new URLSearchParams(window.location.search);
  params.set('lang', isFr ? 'fr' : 'en');
  history.replaceState(null, '', `?${params.toString()}`);
}

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const isFr = params.get('lang') === 'fr';
  updateLanguage(isFr);
});

langButton.addEventListener('click', () => {
  const isCurrentlyFr = body.classList.contains('fr');
  updateLanguage(!isCurrentlyFr);
});


