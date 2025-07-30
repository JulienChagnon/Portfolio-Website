
// 1) Toggle “See More” / “See Less” on the extra jobs
const btn = document.getElementById('toggleJobs');
const more = document.querySelector('.more-jobs');
btn.addEventListener('click', () => {
  more.classList.toggle('show');
  btn.textContent = more.classList.contains('show')
    ? 'See Less'
    : 'See More';
});

// 2) Set the footer year dynamically
document.getElementById('year').textContent = new Date().getFullYear();

// 3) Sidebar follow‑scroll animation
window.addEventListener('load', () => {
  const sidebar = document.getElementById('sidebar');
  const header  = document.querySelector('header.header-flex');
  const offsetTop = header.offsetHeight + 10;
  const unlockThreshold = 260;
  let currentY = offsetTop;    // ← start exactly under the header

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

document.getElementById('openVideoBtn').addEventListener('click', function() {
    window.open('APSC101Demo.mp4', '_blank');
});

document.getElementById('openVideoBtn2').addEventListener('click', function() {
    window.open('APSC103Demo.mp4', '_blank');
});

document.getElementById('openVideoBtn3').addEventListener('click', function() {
    window.open('ELEC292Demo.mp4', '_blank');
});

const openBtn  = document.getElementById('openVideoBtn');
const closeBtn = document.getElementById('closeVideoBtn');
const modal    = document.getElementById('videoModal');
const video    = document.getElementById('myVideo');

openBtn.addEventListener('click', () => {
  modal.style.display = 'flex';
  video.currentTime = 0;
  video.play();
});

closeBtn.addEventListener('click', () => {
  video.pause();
  modal.style.display = 'none';
});

// Optional: click outside video to close
modal.addEventListener('click', e => {
  if (e.target === modal) {
    video.pause();
    modal.style.display = 'none';
  }
});





