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

  // Scroll arrows → advance to next section
  document.querySelectorAll('.scroll-arrows').forEach(el => {
    el.addEventListener('click', e => { e.stopPropagation(); goTo(currentIdx + 1); });
    el.addEventListener('touchstart', e => { e.stopPropagation(); goTo(currentIdx + 1); }, { passive: true });
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
   WEDDING SECTION — PHOTO CARD STACK
   Tap the top card → it lifts and arcs off to
   the side, landing at the back of the pile.
   Cards cycle infinitely through all 7 photos.
════════════════════════════════════════════ */
(function () {
  const deck = document.getElementById('photoDeck');
  if (!deck) return;

  const cards = Array.from(deck.querySelectorAll('.photo-card'));
  const n     = cards.length;
  let   topIdx   = 0;     // index of the card currently on top
  let   busy     = false;
  let   flipDir  = 1;     // alternates: +1 = right, -1 = left

  /* A unique "natural" tilt for each photo — gives the casual dump feel */
  const tilts = [2, -3, 4, -2, 5, -1, 3, -4, 2, -2];

  /* depth(i) = how far card i is from the top (0 = top, n-1 = bottom) */
  function depth(i) { return (i - topIdx + n) % n; }

  /* Lay out all cards according to their current depth */
  function stack(skipIdx) {
    cards.forEach((card, i) => {
      if (i === skipIdx) return;   // mid-animation — leave it alone
      const d     = depth(i);
      const rot   = tilts[i] * (1 - d * 0.25);  // flatten deeper cards
      const yOff  = d * 2.5;
      const scale = 1 - d * 0.016;
      const dim   = Math.max(1 - d * 0.09, 0.45);

      card.style.transition = 'transform 0.50s cubic-bezier(0.22, 1, 0.36, 1), filter 0.50s ease';
      card.style.zIndex     = n - d;
      card.style.transform  = `rotate(${rot}deg) translateY(${yOff}px) scale(${scale})`;
      card.style.filter     = d === 0 ? 'none' : `brightness(${dim})`;
    });
  }

  /* Dismiss the top card: arc left or right, then fade as it exits */
  async function dismiss() {
    if (busy) return;
    busy = true;

    const card = cards[topIdx];
    const rot  = tilts[topIdx];
    const dir  = flipDir;
    flipDir   *= -1;

    /* Slide to the side with increasing tilt, fade starts mid-flight */
    const anim = card.animate([
      { opacity: 1,   transform: `rotate(${rot}deg) translateX(0)`,                                        offset: 0    },
      { opacity: 0.8, transform: `rotate(${rot + dir * 12}deg) translateX(${dir * 55}%)`,                  offset: 0.35 },
      { opacity: 0,   transform: `rotate(${rot + dir * 24}deg) translateX(${dir * 145}%) scale(0.92)`,     offset: 1    },
    ], { duration: 520, easing: 'ease-in', fill: 'forwards' });

    await anim.finished;

    /* Cancel fill:forwards so our inline styles can take over cleanly */
    anim.cancel();

    /* Advance the deck pointer — card is now at the bottom */
    topIdx = (topIdx + 1) % n;
    stack();           /* re-positions everything, including the old top card */

    busy = false;
  }

  /* Auto-advance every 2.8 s, alternating left/right */
  let timer = setInterval(dismiss, 2000);

  /* Tap resets the timer so it doesn't double-fire */
  function onTap(e) {
    e.preventDefault();
    clearInterval(timer);
    dismiss();
    timer = setInterval(dismiss, 2000);
  }

  deck.addEventListener('click',      onTap);
  deck.addEventListener('touchstart', onTap, { passive: false });

  /* Initial layout */
  stack();

  /* ── Inactivity vibrate: shake scroll arrows every 6 s of no interaction ── */
  const scrollArrows = document.getElementById('scrollArrows');
  let inactivityTimer = null;

  function triggerVibrate() {
    if (!scrollArrows) return;
    scrollArrows.classList.remove('is-vibrating');
    void scrollArrows.offsetWidth;            // force reflow to restart animation
    scrollArrows.classList.add('is-vibrating');
    scrollArrows.addEventListener('animationend', function () {
      scrollArrows.classList.remove('is-vibrating');
      inactivityTimer = setTimeout(triggerVibrate, 6000);
    }, { once: true });
  }

  function resetInactivity() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(triggerVibrate, 6000);
  }

  ['click', 'touchstart', 'scroll', 'mousemove', 'keydown'].forEach(function (evt) {
    document.addEventListener(evt, resetInactivity, { passive: true });
  });

  resetInactivity();
}());
