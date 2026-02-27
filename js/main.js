'use strict';

/* ════════════════════════════════════════════
   CONFIG
════════════════════════════════════════════ */
// Engagement date: April 11, 2026 at 11:30 AM IST (UTC+5:30)
const TARGET_DATE = new Date('2026-04-11T11:30:00+05:30');

/* ════════════════════════════════════════════
   LANDING FADE-IN (prevent blank green flash)
════════════════════════════════════════════ */
// Landing starts at opacity:0 in CSS. Only show it once ALL resources
// (including the wax-seal PNG) have fully loaded.
window.addEventListener('load', () => {
  requestAnimationFrame(() => {
    document.getElementById('landing').classList.add('ready');
  });
});

/* ════════════════════════════════════════════
   LANDING → INVITATION REVEAL
════════════════════════════════════════════ */
let _isRevealing = false;

function revealInvitation() {
  if (_isRevealing) return;
  _isRevealing = true;

  const creamCover = document.getElementById('creamCover');
  const landing    = document.getElementById('landing');
  const invitation = document.getElementById('invitation');

  // 1. Flash the envelope lines golden immediately on tap
  creamCover.classList.add('tapped');

  // 2. Fade the entire landing section out (inline style overrides .ready transition)
  setTimeout(() => {
    landing.style.transition    = 'opacity 1.25s ease';
    landing.style.opacity       = '0';
    landing.style.pointerEvents = 'none';
  }, 90);

  // 3. After fade completes, swap to the invitation
  setTimeout(() => {
    landing.style.display = 'none';
    invitation.classList.remove('hidden');
    invitation.removeAttribute('aria-hidden');
    startCountdown();
    initSections();
  }, 1400);
}

// Tapping anywhere on the landing screen triggers the dissolve
document.getElementById('landing').addEventListener('click', revealInvitation);

// Keyboard activation via the seal element
document.getElementById('sealWrap').addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') revealInvitation();
});

/* ════════════════════════════════════════════
   LIVE COUNTDOWN
════════════════════════════════════════════ */
let countdownInterval = null;

function pad(n) {
  return String(Math.max(0, n)).padStart(2, '0');
}

function updateCountdown() {
  const now  = new Date();
  const diff = TARGET_DATE - now;

  const elDays    = document.getElementById('cd-days');
  const elHours   = document.getElementById('cd-hours');
  const elMinutes = document.getElementById('cd-minutes');
  const elSeconds = document.getElementById('cd-seconds');

  if (diff <= 0) {
    // Event has passed / is now
    elDays.textContent    = '00';
    elHours.textContent   = '00';
    elMinutes.textContent = '00';
    elSeconds.textContent = '00';
    clearInterval(countdownInterval);

    const note = document.querySelector('.countdown__note');
    if (note) note.textContent = '🎉 The celebration has begun!';
    return;
  }

  const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  function setVal(el, val) {
    if (el.textContent !== pad(val)) {
      el.textContent = pad(val);
      el.classList.remove('tick');
      // Force reflow for re-trigger
      void el.offsetWidth;
      el.classList.add('tick');
      setTimeout(() => el.classList.remove('tick'), 200);
    }
  }

  setVal(elDays,    days);
  setVal(elHours,   hours);
  setVal(elMinutes, minutes);
  setVal(elSeconds, seconds);
}

function startCountdown() {
  updateCountdown();
  countdownInterval = setInterval(updateCountdown, 1000);
}

/* ════════════════════════════════════════════
   SECTION-BY-SECTION SLIDE NAVIGATION
════════════════════════════════════════════ */
const SECTION_IDS = ['announcement', 'countdown-section', 'details', 'wedding', 'closing'];
let currentIdx  = 0;
let isAnimating = false;

function getScreens() {
  return SECTION_IDS.map(id => document.getElementById(id));
}

function triggerFadeUp(sec) {
  sec.querySelectorAll('.anim-fadeup:not(.visible)').forEach((el, i) => {
    setTimeout(() => el.classList.add('visible'), i * 80);
  });
}

function goTo(idx) {
  if (isAnimating) return;
  const screens = getScreens();
  if (idx < 0 || idx >= screens.length || !screens[idx]) return;

  isAnimating = true;
  const prev = currentIdx;
  currentIdx  = idx;

  screens[prev].classList.remove('is-active');

  if (idx > prev) {
    // Going forward: previous slides up off screen
    screens[prev].classList.add('is-above');
    // next was below (no class) — slides up into view
  } else {
    // Going backward: previous slides down off screen (back to default below)
    // nothing to add — removing is-active puts it back to translateY(100%)
  }

  screens[idx].classList.remove('is-above');
  screens[idx].classList.add('is-active');
  screens[idx].scrollTop = 0;
  triggerFadeUp(screens[idx]);

  // Sync dots
  document.querySelectorAll('.section-dot').forEach((dot, i) => {
    dot.classList.toggle('is-active', i === idx);
  });

  setTimeout(() => { isAnimating = false; }, 660);
}

function initSections() {
  // Mark elements for staggered fade-up animations
  [
    '.announce__pre', '.announce__headline', '.rings-art',
    '.announce__names', '.announce__date-badge', '.announce__families',
    '.venue-card',
    '.closing__verse', '.closing__message', '.closing__couple',
  ].forEach(sel => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add('anim-fadeup');
      el.style.transitionDelay = `${i * 0.08}s`;
    });
  });

  // Position all screens correctly for starting at index 0
  const screens = getScreens();
  screens.forEach((s, i) => {
    s.classList.remove('is-active', 'is-above');
    // i > 0 stays at translateY(100%) — below (default via CSS)
  });
  screens[0].classList.add('is-active');
  triggerFadeUp(screens[0]);

  // Show dots
  const dotsNav = document.getElementById('sectionDots');
  dotsNav.removeAttribute('aria-hidden');
  dotsNav.classList.add('visible');
  document.querySelectorAll('.section-dot')[0].classList.add('is-active');

  // Dot click
  document.querySelectorAll('.section-dot').forEach(dot => {
    dot.addEventListener('click', () => goTo(+dot.dataset.section));
  });

  // Swipe
  const inv = document.getElementById('invitation');
  let tY = 0;
  inv.addEventListener('touchstart', e => { tY = e.touches[0].clientY; }, { passive: true });
  inv.addEventListener('touchend', e => {
    const dy  = tY - e.changedTouches[0].clientY;
    const scr = e.target.closest('.screen');
    if (Math.abs(dy) < 50) return;
    const atBot = !scr || scr.scrollTop + scr.clientHeight >= scr.scrollHeight - 4;
    const atTop = !scr || scr.scrollTop <= 4;
    if (dy > 0 && atBot) goTo(currentIdx + 1);
    if (dy < 0 && atTop) goTo(currentIdx - 1);
  }, { passive: true });

  // Mouse wheel (desktop)
  let lastWheel = 0;
  inv.addEventListener('wheel', e => {
    const now = Date.now();
    if (now - lastWheel < 800) return;
    lastWheel = now;
    if (e.deltaY > 30)  goTo(currentIdx + 1);
    if (e.deltaY < -30) goTo(currentIdx - 1);
  }, { passive: true });

  // Keyboard
  document.addEventListener('keydown', e => {
    if (document.getElementById('invitation').classList.contains('hidden')) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') goTo(currentIdx + 1);
    if (e.key === 'ArrowUp'   || e.key === 'PageUp')   goTo(currentIdx - 1);
  });
}

/* ════════════════════════════════════════════
   ADD TO CALENDAR
════════════════════════════════════════════ */
document.getElementById('addToCalendar').addEventListener('click', () => {
  const title    = encodeURIComponent('Ittymathew & Rosemary — Engagement');
  const location = encodeURIComponent("St. Antony's Forane Church, Pudukad, Thrissur, Kerala");
  const details  = encodeURIComponent(
    'Engagement Ceremony of Ittymathew Paul & Rosemary Antony.\n' +
    'Reception: Zion Parish Hall, Pudukad.\n' +
    'With love from Lidiya, Jobi & Mikhael.'
  );

  // Google Calendar format: YYYYMMDDTHHmmssZ
  const start = '20260411T060000Z'; // 11:30 AM IST = 06:00 UTC
  const end   = '20260411T090000Z'; // ~2:30 PM IST

  const gcalUrl =
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${title}` +
    `&dates=${start}/${end}` +
    `&details=${details}` +
    `&location=${location}` +
    `&sf=true&output=xml`;

  window.open(gcalUrl, '_blank', 'noopener,noreferrer');
});

/* ════════════════════════════════════════════
   ICS FILE DOWNLOAD (fallback for non-Google)
════════════════════════════════════════════ */
// Uncomment to add an ICS download button alongside the Google Calendar link
/*
function downloadICS() {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Engagement Invite//EN',
    'BEGIN:VEVENT',
    'DTSTART:20260411T060000Z',
    'DTEND:20260411T090000Z',
    "SUMMARY:Ittymathew & Rosemary — Engagement",
    "LOCATION:St. Antony's Forane Church\\, Pudukad\\, Thrissur",
    'DESCRIPTION:Engagement Ceremony. Reception at Zion Parish Hall.',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'engagement-ittymathew-rosemary.ics';
  a.click();
  URL.revokeObjectURL(url);
}
*/

/* ════════════════════════════════════════════
   FILMSTRIP GALLERY (inside wedding section)
   All 6 thumbnails always visible.
   Active one: scale(1.18) + shadow.
   Others: scale(0.84) + dimmed.
   Auto-advances every 2 s; pauses on hover.
════════════════════════════════════════════ */
(function () {
  const strip = document.getElementById('filmstrip');
  if (!strip) return;

  const items = Array.from(strip.querySelectorAll('.filmstrip__item'));
  const dots  = Array.from(document.querySelectorAll('#filmstripDots .filmstrip__dot'));
  const n     = items.length;
  let   active = 0;
  let   timer  = null;

  function setActive(i) {
    active = i;
    items.forEach((el, j) => el.classList.toggle('is-active', j === i));
    dots.forEach((d, j) => {
      d.classList.toggle('is-active', j === i);
      d.setAttribute('aria-selected', String(j === i));
    });
  }

  function advance() { setActive((active + 1) % n); }
  function startTimer() { timer = setInterval(advance, 2000); }
  function stopTimer()  { clearInterval(timer); }

  /* Dot clicks */
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { setActive(i); stopTimer(); startTimer(); });
  });

  /* Clicking a non-active thumbnail jumps to it */
  items.forEach((item, i) => {
    item.addEventListener('click', () => {
      if (i !== active) { setActive(i); stopTimer(); startTimer(); }
    });
  });

  /* Pause on hover (desktop) */
  strip.addEventListener('mouseenter', stopTimer);
  strip.addEventListener('mouseleave', startTimer);

  /* Horizontal swipe */
  let tx = 0;
  strip.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  strip.addEventListener('touchend', e => {
    const dx = tx - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 35) {
      setActive((active + (dx > 0 ? 1 : -1) + n) % n);
      stopTimer(); startTimer();
    }
  }, { passive: true });

  /* Init */
  setActive(0);
  startTimer();
}());
