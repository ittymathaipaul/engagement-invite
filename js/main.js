'use strict';

/* ════════════════════════════════════════════
   CONFIG
════════════════════════════════════════════ */
// Engagement date: April 11, 2026 at 11:30 AM IST (UTC+5:30)
const TARGET_DATE = new Date('2026-04-11T11:30:00+05:30');

/* ════════════════════════════════════════════
   LANDING → INVITATION REVEAL
════════════════════════════════════════════ */
function revealInvitation() {
  const landing    = document.getElementById('landing');
  const invitation = document.getElementById('invitation');

  landing.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
  landing.style.opacity    = '0';
  landing.style.transform  = 'scale(1.04)';

  setTimeout(() => {
    landing.style.display = 'none';
    invitation.classList.remove('hidden');
    invitation.removeAttribute('aria-hidden');
    window.scrollTo({ top: 0, behavior: 'instant' });
    startCountdown();
    initScrollAnimations();
  }, 680);
}

document.getElementById('tapBtn').addEventListener('click', revealInvitation);
document.getElementById('sealWrap').addEventListener('click', revealInvitation);

// Also allow keyboard activation
document.getElementById('sealWrap').setAttribute('tabindex', '0');
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
   SCROLL ANIMATIONS (IntersectionObserver)
════════════════════════════════════════════ */
function initScrollAnimations() {
  // Add anim-fadeup class to key elements
  const targets = [
    '.announce__pre',
    '.announce__headline',
    '.rings-art',
    '.announce__names',
    '.announce__date-badge',
    '.announce__families',
    '.announce__shared',
    '.event-card',
    '.map-section',
    '.timeline__item',
    '.closing__verse',
    '.closing__message',
    '.closing__couple',
  ];

  targets.forEach(sel => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add('anim-fadeup');
      el.style.transitionDelay = `${i * 0.08}s`;
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.anim-fadeup').forEach(el => observer.observe(el));
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
