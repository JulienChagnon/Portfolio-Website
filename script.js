
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

// Sidebar follow‑scroll animation
window.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const header  = document.querySelector('header.header-flex');
  const offsetTop = header.offsetHeight + 10;
  const unlockThreshold = 260;
  let currentY = offsetTop;   

  sidebar.style.position = 'absolute';
  sidebar.style.top = `${offsetTop}px`;

  function animate() {
    const scrollY = window.scrollY;
    const targetY = scrollY < unlockThreshold
      ? offsetTop
      : scrollY + 100;

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


window.addEventListener("DOMContentLoaded", () => {
  const chromeIcon = document.getElementById("chrome-icon");
  const lang = document.documentElement.lang;

  if (lang === "fr") {
    chromeIcon.src = "Media/JC_logoFR.png";
  } else {
    chromeIcon.src = "Media/JC_logo.png";
  }
});

