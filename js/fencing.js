/* ============================================================================
   TUES FENCING HIRE — PAGE LOGIC
   ----------------------------------------------------------------------------
   You should rarely need to edit this file. Rates, stock and contact details
   live in js/fencing-config.js; bookings live in data/fencing-bookings.json.

   Map of this file:
     1. Small helpers (dates, money, DOM)
     2. Toast notifications
     3. Loading the bookings data (with skeleton + error states)
     4. Availability maths
     5. The calendar (renders availability AND acts as the date picker)
     6. Hero stat counters
     7. The live quote
     8. The booking form (steppers, validation, submission)
     9. Hire terms rendered from config
    10. Page furniture (mobile nav, scroll reveals)
   ============================================================================ */

(function () {
  'use strict';
  const CFG = FENCING_CONFIG; // from js/fencing-config.js

  /* ==========================================================================
     1. HELPERS
     ========================================================================== */
  const $ = (sel) => document.querySelector(sel);

  // All dates in this file are plain "YYYY-MM-DD" strings (local time).
  // They compare correctly with < and >, which keeps the logic simple.
  function toYMD(d) {
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }
  function fromYMD(s) {
    const p = s.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]); // local midnight
  }
  function addDays(ymd, n) {
    const d = fromYMD(ymd);
    d.setDate(d.getDate() + n);
    return toYMD(d);
  }
  // Inclusive day count: 2026-07-01 → 2026-07-03 is 3 days.
  function daysBetween(startYMD, endYMD) {
    return Math.round((fromYMD(endYMD) - fromYMD(startYMD)) / 86400000) + 1;
  }
  function prettyDate(ymd) {
    return fromYMD(ymd).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  const money = (n) => '$' + n.toLocaleString('en-AU');

  const TODAY = toYMD(new Date());
  const EARLIEST = addDays(TODAY, CFG.MIN_NOTICE_DAYS); // first bookable day

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ==========================================================================
     2. TOASTS — small notifications, bottom-right
     ========================================================================== */
  function toast(msg, type) { // type: 'ok' | 'warn' | 'err' (default red accent)
    const el = document.createElement('div');
    el.className = 'toast' + (type === 'ok' ? ' ok' : type === 'warn' ? ' warn' : '');
    el.textContent = msg;
    $('#toasts').appendChild(el);
    setTimeout(() => {
      el.classList.add('leaving');
      setTimeout(() => el.remove(), 320);
    }, 4200);
  }

  /* ==========================================================================
     3. DATA — load data/fencing-bookings.json
     ========================================================================== */
  let bookings = null; // null until loaded; then an array of booking objects

  // Bookings in these states hold stock on the calendar:
  const HOLDS_STOCK = { pending: true, confirmed: true };

  function showSkeleton() {
    // 7 weekday labels + 35 shimmering cells while we fetch
    let html = '<div class="cal-head"><div class="cal-month skel" style="width:140px;height:24px;border-radius:4px"></div>' +
      '<div class="cal-nav"><button class="skel" disabled></button><button class="skel" disabled></button></div></div>';
    html += '<div class="cal-dow">' + 'MTWTFSS'.split('').map(() => '<span>·</span>').join('') + '</div>';
    html += '<div class="cal-grid">';
    for (let i = 0; i < 35; i++) html += '<div class="cal-cell skel"><span class="d">0</span></div>';
    html += '</div>';
    $('#calWrap').innerHTML = html;
  }

  function showLoadError() {
    $('#calWrap').innerHTML =
      '<div class="cal-error">Couldn\u2019t load availability data. Check your connection and try again.' +
      '<br><button id="calRetry">Retry</button></div>';
    $('#calRetry').addEventListener('click', init);
  }

  async function loadBookings() {
    // Cache-bust so availability is always current, not a stale CDN copy.
    const res = await fetch('data/fencing-bookings.json?t=' + Date.now());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    return data.bookings || [];
  }

  /* ==========================================================================
     4. AVAILABILITY MATHS
     ========================================================================== */
  // How many panels are free on a given date?
  function freeOn(ymd) {
    let taken = 0;
    for (const b of bookings) {
      if (HOLDS_STOCK[b.status] && b.start <= ymd && ymd <= b.end) taken += b.panels;
    }
    return Math.max(0, CFG.TOTAL_PANELS - taken);
  }

  // The bottleneck across a range — the fewest free panels on any day of it.
  function minFreeInRange(startYMD, endYMD) {
    let min = Infinity;
    for (let d = startYMD; d <= endYMD; d = addDays(d, 1)) {
      min = Math.min(min, freeOn(d));
      if (min === 0) break;
    }
    return min;
  }

  /* ==========================================================================
     5. CALENDAR — availability display + date-range picker in one
     ========================================================================== */
  const now = new Date();
  let calYear = now.getFullYear();
  let calMonth = now.getMonth();       // 0-based
  let monthOffset = 0;                 // 0 = current month … MONTHS_BOOKABLE_AHEAD

  let selStart = null; // "YYYY-MM-DD" or null
  let selEnd = null;

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  // Last selectable day = end of the final bookable month
  const lastBookable = (() => {
    const d = new Date(now.getFullYear(), now.getMonth() + CFG.MONTHS_BOOKABLE_AHEAD + 1, 0);
    return toYMD(d);
  })();

  function renderCalendar() {
    const first = new Date(calYear, calMonth, 1);
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    // Monday-first grid: JS getDay() is 0=Sun, we want 0=Mon
    const lead = (first.getDay() + 6) % 7;

    let html = '<div class="cal-head">' +
      '<div class="cal-month">' + MONTHS[calMonth] + ' ' + calYear + '</div>' +
      '<div class="cal-nav">' +
      '<button id="calPrev" aria-label="Previous month"' + (monthOffset === 0 ? ' disabled' : '') + '>&#8249;</button>' +
      '<button id="calNext" aria-label="Next month"' + (monthOffset >= CFG.MONTHS_BOOKABLE_AHEAD ? ' disabled' : '') + '>&#8250;</button>' +
      '</div></div>';

    html += '<div class="cal-dow">' +
      ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => '<span>' + d + '</span>').join('') +
      '</div><div class="cal-grid">';

    for (let i = 0; i < lead; i++) html += '<div class="cal-cell empty"></div>';

    for (let day = 1; day <= daysInMonth; day++) {
      const ymd = toYMD(new Date(calYear, calMonth, day));
      const free = freeOn(ymd);
      const selectable = ymd >= EARLIEST && ymd <= lastBookable && free > 0;

      let cls = 'cal-cell';
      if (!selectable) cls += ' disabled';
      if (free === 0 && ymd >= TODAY) cls += ' full';
      else if (free < CFG.TOTAL_PANELS && ymd >= TODAY) cls += ' partial';
      if (ymd === TODAY) cls += ' today';
      if (selStart && selEnd && ymd > selStart && ymd < selEnd) cls += ' in-range';
      if (ymd === selStart) cls += ' range-start';
      if (ymd === selEnd) cls += ' range-end';

      // Show a free-count label on any future day that isn't fully free
      const label = (ymd >= TODAY && free < CFG.TOTAL_PANELS)
        ? '<span class="free">' + free + ' left</span>' : '';

      html += '<div class="' + cls + '" data-ymd="' + ymd + '" data-sel="' + (selectable ? 1 : 0) + '"' +
        ' role="button" aria-label="' + prettyDate(ymd) + ', ' + free + ' panels free">' +
        '<span class="d">' + day + '</span>' + label + '</div>';
    }
    html += '</div>';

    $('#calWrap').innerHTML = html;

    // Wire up month navigation
    const prev = $('#calPrev'), next = $('#calNext');
    if (prev) prev.addEventListener('click', () => stepMonth(-1));
    if (next) next.addEventListener('click', () => stepMonth(1));

    // Wire up date clicks (event delegation on the grid)
    $('#calWrap .cal-grid').addEventListener('click', (e) => {
      const cell = e.target.closest('.cal-cell');
      if (!cell || cell.dataset.sel !== '1') return;
      pickDate(cell.dataset.ymd);
    });
  }

  function stepMonth(dir) {
    monthOffset += dir;
    calMonth += dir;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar();
  }

  // Selection logic: first click sets the start, second sets the end,
  // a third click starts a fresh range.
  function pickDate(ymd) {
    if (!selStart || (selStart && selEnd)) {
      selStart = ymd; selEnd = null;
    } else if (ymd < selStart) {
      selStart = ymd; // clicked before the start — treat as a new start
    } else {
      // Enforce the maximum hire length before accepting the end date
      if (daysBetween(selStart, ymd) > CFG.MAX_HIRE_DAYS) {
        toast('Maximum hire is ' + (CFG.MAX_HIRE_DAYS / 7) + ' weeks — email us for longer hires.', 'warn');
        return;
      }
      selEnd = ymd;
    }
    renderCalendar();
    syncDateChips();
    updateQuote();
  }

  function clearDates() {
    selStart = selEnd = null;
    renderCalendar();
    syncDateChips();
    updateQuote();
  }

  function syncDateChips() {
    const cs = $('#chipStart'), ce = $('#chipEnd');
    cs.textContent = selStart ? prettyDate(selStart) : 'Pick a start date';
    cs.classList.toggle('set', !!selStart);
    ce.textContent = selEnd ? prettyDate(selEnd) : 'Pick an end date';
    ce.classList.toggle('set', !!selEnd);
    $('#clearDates').hidden = !selStart;
  }

  /* ==========================================================================
     6. HERO STAT COUNTERS — tick up once data loads
     ========================================================================== */
  function animateCount(el, target, suffix, prefix) {
    prefix = prefix || ''; suffix = suffix || '';
    if (reducedMotion) { el.innerHTML = prefix + target + suffix; return; }
    const dur = 900, t0 = performance.now();
    (function frame(t) {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      el.innerHTML = prefix + Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    })(t0);
  }

  function renderStats() {
    const freeToday = freeOn(TODAY);
    const s1 = $('#statTotal'), s2 = $('#statFree'), s3 = $('#statRate');
    [s1, s2, s3].forEach(s => s.classList.remove('loading'));
    animateCount(s1.querySelector('h3'), CFG.TOTAL_PANELS);
    animateCount(s2.querySelector('h3'), freeToday);
    animateCount(s3.querySelector('h3'), CFG.RATE_PER_PANEL_PER_WEEK, '', '$');
  }

  /* ==========================================================================
     7. THE LIVE QUOTE
     ==========================================================================
     Pricing model (see fencing-config.js for the numbers):
       per panel  = full weeks × weekly rate
                  + leftover days × daily rate (capped at one more weekly rate)
       hire       = per panel × panel count, floored at MINIMUM_HIRE_CHARGE
       total      = hire + delivery fee (if delivery chosen)
     The bond is displayed separately and not added to the total.
     ========================================================================== */
  let delivery = 'self'; // 'self' | 'delivery'

  function perPanelCost(days) {
    const weeks = Math.floor(days / 7);
    const rem = days % 7;
    return weeks * CFG.RATE_PER_PANEL_PER_WEEK +
      Math.min(rem * CFG.RATE_PER_PANEL_PER_DAY, CFG.RATE_PER_PANEL_PER_WEEK);
  }

  // Returns the full quote breakdown, or null if inputs are incomplete.
  function computeQuote() {
    const panels = clampPanels();
    if (!selStart || !selEnd || !panels) return null;
    const days = daysBetween(selStart, selEnd);
    const rawHire = panels * perPanelCost(days);
    const hire = Math.max(rawHire, CFG.MINIMUM_HIRE_CHARGE);
    const minAdj = hire - rawHire; // 0 unless the minimum kicked in
    const deliveryFee = delivery === 'delivery' ? CFG.DELIVERY_FEE : 0;
    return { panels, days, rawHire, hire, minAdj, deliveryFee, total: hire + deliveryFee };
  }

  function updateQuote() {
    const q = computeQuote();
    const empty = $('#quoteEmpty'), rows = $('#quoteRows'), avail = $('#quoteAvail');
    $('#quoteBondNote').textContent = 'Plus a ' + money(CFG.BOND) +
      ' refundable bond, returned when the panels come back complete and undamaged.';

    if (!q) {
      empty.hidden = false; rows.hidden = true;
      avail.className = 'quote-avail';
      return;
    }
    empty.hidden = true; rows.hidden = false;

    $('#qHireK').textContent = q.panels + ' panel' + (q.panels > 1 ? 's' : '') +
      ' × ' + q.days + ' day' + (q.days > 1 ? 's' : '');
    $('#qHireV').textContent = money(q.rawHire);
    $('#qDeliveryRow').hidden = q.deliveryFee === 0;
    $('#qDeliveryV').textContent = money(q.deliveryFee);
    $('#qMinRow').hidden = q.minAdj === 0;
    $('#qMinV').textContent = '+' + money(q.minAdj);
    $('#qTotalV').textContent = money(q.total);

    // Availability verdict for the selected range + panel count
    const free = minFreeInRange(selStart, selEnd);
    if (q.panels <= free) {
      avail.className = 'quote-avail ok';
      avail.textContent = '✓ Available — ' + free + ' of ' + CFG.TOTAL_PANELS + ' panels free across your dates.';
    } else {
      avail.className = 'quote-avail bad';
      avail.textContent = '✕ Only ' + free + ' panel' + (free === 1 ? ' is' : 's are') +
        ' free across your dates — reduce the count or shift the dates.';
    }
  }

  /* ==========================================================================
     8. THE BOOKING FORM
     ========================================================================== */
  function clampPanels() {
    const input = $('#fPanels');
    let v = parseInt(input.value, 10);
    if (isNaN(v)) return 0;
    v = Math.max(1, Math.min(CFG.TOTAL_PANELS, v));
    input.value = v;
    $('#panelsMinus').disabled = v <= 1;
    $('#panelsPlus').disabled = v >= CFG.TOTAL_PANELS;
    return v;
  }

  function bumpPanels(dir) {
    const input = $('#fPanels');
    input.value = (parseInt(input.value, 10) || 0) + dir;
    clampPanels();
    updateQuote();
  }

  // Booking reference: TUES-FH-<start date>-<4 random chars>
  function makeRef() {
    const datePart = (selStart || TODAY).slice(2).replace(/-/g, '');
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no confusable 0/O/1/I/L
    let rand = '';
    const buf = new Uint8Array(4);
    (window.crypto || {}).getRandomValues ? crypto.getRandomValues(buf) : buf.forEach((_, i) => buf[i] = Math.random() * 255);
    for (const b of buf) rand += chars[b % chars.length];
    return 'TUES-FH-' + datePart + '-' + rand;
  }

  // Validate everything; returns an error message or null if all good.
  function validate() {
    const mark = (el, bad) => el.classList.toggle('invalid', bad);
    const name = $('#fName'), email = $('#fEmail'), addr = $('#fAddr'), tc = $('#tcWrap');

    mark(name, !name.value.trim());
    if (!name.value.trim()) return 'Please enter your name.';

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
    mark(email, !emailOk);
    if (!emailOk) return 'Please enter a valid email — it\u2019s where your confirmation goes.';

    if (!selStart || !selEnd) return 'Pick your hire dates on the calendar above.';

    const q = computeQuote();
    const free = minFreeInRange(selStart, selEnd);
    if (q.panels > free) {
      return 'Those dates only have ' + free + ' panel' + (free === 1 ? '' : 's') +
        ' free — reduce your count or shift the dates.';
    }

    const needAddr = delivery === 'delivery';
    mark(addr, needAddr && !addr.value.trim());
    if (needAddr && !addr.value.trim()) return 'Please add a delivery address (or switch to self-collect).';

    const tcChecked = $('#fTerms').checked;
    tc.classList.toggle('invalid', !tcChecked);
    if (!tcChecked) return 'Please accept the hire terms to continue.';

    return null;
  }

  // Assemble the human-readable booking summary used in both the email to the
  // committee (via Web3Forms) and the mailto fallback.
  function buildSummary(ref, q) {
    return [
      'Booking reference: ' + ref,
      'Name: ' + $('#fName').value.trim(),
      'Organisation: ' + ($('#fOrg').value.trim() || '—'),
      'Email: ' + $('#fEmail').value.trim(),
      'Phone: ' + ($('#fPhone').value.trim() || '—'),
      'Dates: ' + prettyDate(selStart) + ' → ' + prettyDate(selEnd) + ' (' + q.days + ' days)',
      'Panels: ' + q.panels + ' of ' + CFG.TOTAL_PANELS,
      'Delivery: ' + (delivery === 'delivery' ? 'Delivery + pickup — ' + $('#fAddr').value.trim() : 'Self-collect'),
      'Estimated total: ' + money(q.total) + ' (+ ' + money(CFG.BOND) + ' refundable bond)',
      'Notes: ' + ($('#fNotes').value.trim() || '—'),
      'Status: PENDING (add to data/fencing-bookings.json to hold the dates)'
    ].join('\n');
  }

  async function submitForm(e) {
    e.preventDefault();
    const err = validate();
    if (err) { toast(err, 'warn'); return; }

    const q = computeQuote();
    const ref = makeRef();
    const btn = $('#submitBtn');
    btn.classList.add('busy');
    btn.innerHTML = '<span class="spinner"></span>Sending…';

    const keyConfigured = CFG.WEB3FORMS_ACCESS_KEY &&
      !CFG.WEB3FORMS_ACCESS_KEY.startsWith('REPLACE_');

    let sent = false;
    if (keyConfigured) {
      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            access_key: CFG.WEB3FORMS_ACCESS_KEY,
            subject: 'Fencing hire request ' + ref + ' — ' + $('#fName').value.trim(),
            from_name: 'TUES Fencing Hire',
            // replyto lets the committee hit Reply and reach the requester;
            // it's also the address Web3Forms' auto-responder replies to.
            replyto: $('#fEmail').value.trim(),
            booking_reference: ref,
            summary: buildSummary(ref, q),
            botcheck: document.querySelector('input[name="botcheck"]').checked
          })
        });
        const out = await res.json();
        sent = !!out.success;
      } catch (_) { sent = false; }
    }

    if (!sent) {
      // Fallback: open a pre-filled email in the requester's mail app. This
      // covers both "the form key isn't set up yet" and network failures, so
      // the tool is never a dead end.
      const mail = 'mailto:' + CFG.SOCIETY_EMAIL +
        '?subject=' + encodeURIComponent('Fencing hire request ' + ref) +
        '&body=' + encodeURIComponent(buildSummary(ref, q));
      window.location.href = mail;
      $('#successMsg').innerHTML = 'We\u2019ve opened a pre-filled email in your mail app — ' +
        '<strong>press send</strong> to complete your request. Your booking is <strong>pending</strong> until the committee confirms it.';
      toast('Opened your email app to send the request.', 'warn');
    } else {
      toast('Booking request sent — check your inbox for confirmation.', 'ok');
    }

    // Swap the form for the success panel
    $('#bookForm').style.display = 'none';
    const panel = $('#successPanel');
    $('#successRef').textContent = ref;
    $('#successEditLink').href = 'mailto:' + CFG.SOCIETY_EMAIL +
      '?subject=' + encodeURIComponent('Change/cancel fencing booking ' + ref);
    panel.classList.add('show');
    panel.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
  }

  /* ==========================================================================
     9. HIRE TERMS — generated from config so they never drift from the rates
     ========================================================================== */
  function renderTerms() {
    const li = (html) => '<li>' + html + '</li>';
    $('#termsPricing').innerHTML =
      li('<strong>' + money(CFG.RATE_PER_PANEL_PER_WEEK) + ' per panel per week</strong>, or ' +
         money(CFG.RATE_PER_PANEL_PER_DAY) + ' per panel per day for shorter hires.') +
      li('Minimum hire charge of <strong>' + money(CFG.MINIMUM_HIRE_CHARGE) + '</strong>.') +
      li('Delivery + pickup (Hobart area): flat <strong>' + money(CFG.DELIVERY_FEE) + '</strong>. Self-collection is free.') +
      li('A <strong>' + money(CFG.BOND) + ' refundable bond</strong> is payable before hire-out.');
    $('#termsLate').innerHTML =
      li('Panels are due back on the agreed end date.') +
      li('Late returns incur <strong>' + money(CFG.LATE_FEE_PER_DAY) + ' per day</strong>, deducted from the bond first.') +
      li('Running late? Tell us early — if no one\u2019s waiting on the stock we\u2019re usually flexible.');
    $('#termsDamage').innerHTML =
      li('The hirer is responsible for panels from hire-out until return.') +
      li('Lost or damaged panels are charged at <strong>' + money(CFG.DAMAGE_FEE_PER_PANEL) + ' each</strong>; feet at ' + money(CFG.DAMAGE_FEE_PER_FOOT) + ' each.') +
      li('Fair wear and tear is fine — we hire them out to be used.');
    // Small dynamic bits elsewhere on the page
    $('#hintNotice').textContent = CFG.MIN_NOTICE_DAYS;
    $('#noteMaxWeeks').textContent = Math.round(CFG.MAX_HIRE_DAYS / 7);
  }

  /* ==========================================================================
     10. PAGE FURNITURE — mobile nav + scroll reveals (same as index.html)
     ========================================================================== */
  $('#navToggle').addEventListener('click', () => $('#navLinks').classList.toggle('open'));

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) en.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach((el) => obs.observe(el));

  /* ==========================================================================
     WIRING + INIT
     ========================================================================== */
  $('#panelsMinus').addEventListener('click', () => bumpPanels(-1));
  $('#panelsPlus').addEventListener('click', () => bumpPanels(1));
  $('#fPanels').addEventListener('input', () => { clampPanels(); updateQuote(); });
  $('#clearDates').addEventListener('click', clearDates);
  $('#bookForm').addEventListener('submit', submitForm);

  // Delivery segmented control
  $('#deliverySeg').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    delivery = btn.dataset.val;
    document.querySelectorAll('#deliverySeg button').forEach((b) => b.classList.toggle('on', b === btn));
    $('#addrField').hidden = delivery !== 'delivery';
    updateQuote();
  });

  // Clear the red "invalid" outline as soon as the user fixes a field
  ['fName', 'fEmail', 'fAddr'].forEach((id) => {
    $('#' + id).addEventListener('input', (e) => e.target.classList.remove('invalid'));
  });
  $('#fTerms').addEventListener('change', () => $('#tcWrap').classList.remove('invalid'));

  async function init() {
    showSkeleton();
    renderTerms();
    try {
      bookings = await loadBookings();
    } catch (e) {
      showLoadError();
      return;
    }
    renderCalendar();
    renderStats();
    clampPanels();
  }

  init();
})();
