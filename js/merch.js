/* ============================================================================
   TUES MERCH — PAGE LOGIC
   ----------------------------------------------------------------------------
   Products come from js/merch-config.js. You shouldn't need to edit this file.

   Map:
     1. Helpers + toasts
     2. Render the product grid from config
     3. The order modal (open, variant pick, quantity, live total)
     4. Validation + submission (Web3Forms, with mailto fallback)
   ============================================================================ */

(function () {
  'use strict';
  const CFG = MERCH_CONFIG;
  const $ = (s) => document.querySelector(s);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Money: show whole dollars as "$25", cents as "$16.22"
  function money(n) {
    return '$' + (Number.isInteger(n) ? n.toString() : n.toFixed(2));
  }

  // Total stock across a product's options
  function totalStock(p) {
    return p.options.reduce((sum, o) => sum + Math.max(0, o.stock || 0), 0);
  }

  /* ---- Toasts ------------------------------------------------------------- */
  function toast(msg, type) {
    const el = document.createElement('div');
    el.className = 'toast' + (type === 'ok' ? ' ok' : type === 'warn' ? ' warn' : '');
    el.textContent = msg;
    $('#toasts').appendChild(el);
    setTimeout(() => { el.classList.add('leaving'); setTimeout(() => el.remove(), 320); }, 4200);
  }

  /* ==========================================================================
     2. RENDER PRODUCT GRID
     ==========================================================================
     Built with createElement + textContent (not innerHTML with data) so product
     copy from the config can never inject markup — safe by construction.
     ========================================================================== */
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function stockLine(p) {
    const total = totalStock(p);
    if (total <= 0) return { text: 'Sold out', out: true };
    if (total <= 5) return { text: 'Only ' + total + ' left', out: false };
    return { text: 'In stock', out: false };
  }

  function renderGrid() {
    const grid = $('#grid');
    grid.textContent = '';
    const products = CFG.PRODUCTS.filter(p => p.active !== false);

    if (!products.length) {
      grid.appendChild(el('p', null, 'No merch available right now — check back soon.'));
      return;
    }

    products.forEach((p) => {
      const total = totalStock(p);
      const soldOut = total <= 0;

      const card = el('div', 'm-card reveal');

      const imgWrap = el('div', 'm-card-img');
      const img = el('img');
      img.src = 'images/merch/' + p.image;
      img.alt = p.name;
      img.loading = 'lazy';
      imgWrap.appendChild(img);
      if (p.badge || soldOut) {
        const badge = el('span', 'm-card-badge' + (soldOut ? ' soldout' : ''), soldOut ? 'Sold out' : p.badge);
        imgWrap.appendChild(badge);
      }
      card.appendChild(imgWrap);

      const body = el('div', 'm-card-body');
      body.appendChild(el('h3', null, p.name));
      body.appendChild(el('div', 'm-card-price', money(p.price)));
      body.appendChild(el('div', 'm-card-blurb', p.blurb || ''));

      const sl = stockLine(p);
      body.appendChild(el('div', 'm-card-stockline' + (sl.out ? ' out' : ''), sl.text));

      const btn = el('button', 'm-card-btn', soldOut ? 'Sold out' : 'Order');
      btn.disabled = soldOut;
      if (!soldOut) btn.addEventListener('click', () => openModal(p));
      body.appendChild(btn);

      card.appendChild(body);
      grid.appendChild(card);
    });

    // Trigger the reveal animation for freshly-added cards
    revealObserver.disconnect();
    document.querySelectorAll('.reveal').forEach((r) => revealObserver.observe(r));
  }

  /* ==========================================================================
     3. ORDER MODAL
     ========================================================================== */
  let activeProduct = null;
  let activeVariant = null; // the chosen option object

  function openModal(p) {
    activeProduct = p;
    activeVariant = null;

    $('#modalImg').src = 'images/merch/' + p.image;
    $('#modalImg').alt = p.name;
    $('#modalTitle').textContent = p.name;
    $('#modalPrice').textContent = money(p.price);

    // Note line: product note + sizing, if any
    const note = $('#modalNote');
    note.textContent = p.note || 'Select an option below.';

    // Build variant pills
    const row = $('#variantRow');
    row.textContent = '';
    p.options.forEach((opt) => {
      const b = el('button', 'm-variant', opt.label + (opt.stock <= 0 ? ' — sold out' : ''));
      b.type = 'button';
      b.disabled = opt.stock <= 0;
      if (!b.disabled) {
        b.addEventListener('click', () => {
          activeVariant = opt;
          document.querySelectorAll('#variantRow .m-variant').forEach(v => v.classList.toggle('on', v === b));
          $('#oQty').value = 1;
          clampQty();
          updateTotal();
          $('#variantField').classList.remove('invalid-field');
        });
      }
      row.appendChild(b);
    });
    // If there's only one option, auto-select it
    const firstEnabled = p.options.find(o => o.stock > 0);
    if (p.options.length === 1 && firstEnabled) {
      row.querySelector('.m-variant:not(:disabled)').click();
    }

    // Reset the form + show it (hide any previous success)
    $('#orderForm').reset();
    $('#orderForm').style.display = '';
    $('#orderSuccess').classList.remove('show');
    $('#oQty').value = 1;
    ['oName', 'oEmail'].forEach(id => $('#' + id).classList.remove('invalid'));
    $('#ackWrap').classList.remove('invalid');
    updateTotal();

    $('#modalScrim').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    $('#modalScrim').classList.remove('open');
    document.body.style.overflow = '';
    activeProduct = null; activeVariant = null;
  }

  function clampQty() {
    const input = $('#oQty');
    let v = parseInt(input.value, 10);
    if (isNaN(v) || v < 1) v = 1;
    // Cap at the selected variant's stock (or 10 if none picked yet)
    const cap = activeVariant ? Math.max(1, activeVariant.stock) : 10;
    if (v > cap) { v = cap; toast('Only ' + cap + ' of that option left.', 'warn'); }
    input.value = v;
    $('#qtyMinus').disabled = v <= 1;
    $('#qtyPlus').disabled = activeVariant ? v >= activeVariant.stock : false;
    return v;
  }

  function updateTotal() {
    const qty = clampQty();
    const total = activeProduct ? activeProduct.price * qty : 0;
    $('#orderTotal').textContent = money(Math.round(total * 100) / 100);
  }

  /* ==========================================================================
     4. VALIDATION + SUBMISSION
     ========================================================================== */
  function makeRef() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let r = '';
    const buf = new Uint8Array(4);
    (window.crypto && crypto.getRandomValues) ? crypto.getRandomValues(buf)
      : buf.forEach((_, i) => buf[i] = Math.floor(Math.random() * 255));
    for (const b of buf) r += chars[b % chars.length];
    const d = new Date();
    return 'TUES-MERCH-' + String(d.getFullYear()).slice(2) +
      String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + '-' + r;
  }

  function validate() {
    if (!activeVariant) { $('#variantField').classList.add('invalid-field'); return 'Please choose an option.'; }
    const name = $('#oName'), email = $('#oEmail');
    name.classList.toggle('invalid', !name.value.trim());
    if (!name.value.trim()) return 'Please enter your name.';
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
    email.classList.toggle('invalid', !emailOk);
    if (!emailOk) return 'Please enter a valid email — it\u2019s where your payment details go.';
    const ack = $('#oAck').checked;
    $('#ackWrap').classList.toggle('invalid', !ack);
    if (!ack) return 'Please tick the box to acknowledge how payment and pickup work.';
    return null;
  }

  function buildSummary(ref, qty, total) {
    return [
      'Order reference: ' + ref,
      'Product: ' + activeProduct.name,
      'Option: ' + activeVariant.label,
      'Quantity: ' + qty,
      'Unit price: ' + money(activeProduct.price),
      'Order total: ' + money(Math.round(total * 100) / 100),
      '',
      'Name: ' + $('#oName').value.trim(),
      'Email: ' + $('#oEmail').value.trim(),
      'Phone: ' + ($('#oPhone').value.trim() || '—'),
      'Notes: ' + ($('#oNotes').value.trim() || '—'),
      '',
      'ACTION: email the buyer bank-transfer details + a pickup time, quoting the reference.',
      'Payment: bank transfer (pending). Decrement stock in merch-config.js once paid.'
    ].join('\n');
  }

  async function submitOrder(e) {
    e.preventDefault();
    const err = validate();
    if (err) { toast(err, 'warn'); return; }

    const qty = clampQty();
    const total = activeProduct.price * qty;
    const ref = makeRef();
    const btn = $('#orderSubmit');
    btn.classList.add('busy');
    btn.innerHTML = '<span class="spinner"></span>Placing order\u2026';

    const keyOk = CFG.WEB3FORMS_ACCESS_KEY && !CFG.WEB3FORMS_ACCESS_KEY.startsWith('REPLACE_');
    let sent = false;

    if (keyOk) {
      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            access_key: CFG.WEB3FORMS_ACCESS_KEY,
            subject: 'Merch order ' + ref + ' — ' + activeProduct.name + ' (' + activeVariant.label + ') ×' + qty,
            from_name: 'TUES Merch Store',
            replyto: $('#oEmail').value.trim(),
            order_reference: ref,
            summary: buildSummary(ref, qty, total),
            botcheck: $('#oBot').checked
          })
        });
        const out = await res.json();
        sent = !!out.success;
      } catch (_) { sent = false; }
    }

    if (!sent) {
      const mail = 'mailto:' + CFG.SOCIETY_EMAIL +
        '?subject=' + encodeURIComponent('Merch order ' + ref) +
        '&body=' + encodeURIComponent(buildSummary(ref, qty, total));
      window.location.href = mail;
      $('#orderSuccessMsg').textContent =
        'We\u2019ve opened a pre-filled email in your mail app — press send to place your order. We\u2019ll reply with payment details and a pickup time.';
      toast('Opened your email app to send the order.', 'warn');
    } else {
      toast('Order placed — check your inbox.', 'ok');
    }

    btn.classList.remove('busy');
    btn.textContent = 'Place order';
    $('#orderRef').textContent = ref;
    $('#orderForm').style.display = 'none';
    $('#orderSuccess').classList.add('show');
  }

  /* ==========================================================================
     WIRING
     ========================================================================== */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) en.target.classList.add('visible'); });
  }, { threshold: 0.08 });

  $('#navToggle').addEventListener('click', () => $('#navLinks').classList.toggle('open'));
  $('#modalClose').addEventListener('click', closeModal);
  $('#successDone').addEventListener('click', closeModal);
  $('#modalScrim').addEventListener('click', (e) => { if (e.target === $('#modalScrim')) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#modalScrim').classList.contains('open')) closeModal(); });

  $('#qtyMinus').addEventListener('click', () => { $('#oQty').value = (parseInt($('#oQty').value, 10) || 1) - 1; updateTotal(); });
  $('#qtyPlus').addEventListener('click', () => { $('#oQty').value = (parseInt($('#oQty').value, 10) || 0) + 1; updateTotal(); });
  $('#oQty').addEventListener('input', updateTotal);
  ['oName', 'oEmail'].forEach(id => $('#' + id).addEventListener('input', (e) => e.target.classList.remove('invalid')));
  $('#oAck').addEventListener('change', () => $('#ackWrap').classList.remove('invalid'));
  $('#orderForm').addEventListener('submit', submitOrder);

  renderGrid();
})();
