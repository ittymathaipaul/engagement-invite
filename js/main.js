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
    initInvitation();
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
   SECTION NAVIGATION
════════════════════════════════════════════ */
const SECTION_IDS = ['announcement', 'countdown-section', 'details', 'closing'];
let currentIdx = 0;

function activateSection(idx) {
  const screens = SECTION_IDS.map(id => document.getElementById(id));
  if (idx < 0 || idx >= screens.length) return;

  screens[currentIdx].classList.remove('is-active');
  currentIdx = idx;

  const sec = screens[idx];
  sec.classList.add('is-active');
  sec.scrollTop = 0;

  // Trigger fade-up animations for newly visible section
  sec.querySelectorAll('.anim-fadeup:not(.visible)').forEach((el, i) => {
    setTimeout(() => el.classList.add('visible'), i * 80);
  });

  // Sync dots
  document.querySelectorAll('.section-dot').forEach((dot, i) => {
    dot.classList.toggle('is-active', i === idx);
  });
}

function initInvitation() {
  // Mark elements for staggered fade-up animation
  [
    '.announce__pre', '.announce__headline', '.rings-art',
    '.announce__names', '.announce__date-badge',
    '.announce__families', '.announce__shared',
    '.event-card', '.map-section',
    '.timeline__item', '.closing__verse',
    '.closing__message', '.closing__couple',
  ].forEach(sel => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add('anim-fadeup');
      el.style.transitionDelay = `${i * 0.08}s`;
    });
  });

  // Show nav dots
  const dots = document.getElementById('sectionDots');
  dots.removeAttribute('aria-hidden');
  dots.classList.add('visible');

  // Activate first section
  activateSection(0);

  // Dot click
  document.querySelectorAll('.section-dot').forEach(dot => {
    dot.addEventListener('click', () => activateSection(+dot.dataset.section));
  });

  // Swipe — navigate only when the section is scrolled to its boundary
  const inv = document.getElementById('invitation');
  let tY = 0;

  inv.addEventListener('touchstart', e => {
    tY = e.touches[0].clientY;
  }, { passive: true });

  inv.addEventListener('touchend', e => {
    const dy  = tY - e.changedTouches[0].clientY;
    if (Math.abs(dy) < 50) return;
    const scr    = e.target.closest('.screen');
    const atBot  = !scr || scr.scrollTop + scr.clientHeight >= scr.scrollHeight - 4;
    const atTop  = !scr || scr.scrollTop <= 4;
    if (dy > 0 && atBot) activateSection(currentIdx + 1);
    if (dy < 0 && atTop) activateSection(currentIdx - 1);
  }, { passive: true });

  // Keyboard
  document.addEventListener('keydown', e => {
    if (document.getElementById('invitation').classList.contains('hidden')) return;
    if (e.key === 'ArrowDown') activateSection(currentIdx + 1);
    if (e.key === 'ArrowUp')   activateSection(currentIdx - 1);
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
