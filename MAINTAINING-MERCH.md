# Merch Store — Maintainer Guide

The merch page (`merch.html`) builds itself from one file:

| File | What it holds |
|---|---|
| `js/merch-config.js` | Every product: name, price, photo, options, stock |
| `images/merch/` | Product photos |
| `js/merch.js` | Page logic — you shouldn't need to touch it |

All edits are done in GitHub's web editor (pencil icon → commit). The live
site updates about a minute later.

## How an order works

1. A student picks an item, size and quantity, and submits their details.
2. Web3Forms emails the order to `president.engineering.utas@gmail.com` with a
   reference like `TUES-MERCH-260706-K4QZ`, and auto-confirms to the student.
3. **You reply to the student with the society's bank details and a pickup
   time**, quoting the reference. (Bank details are deliberately NOT on the
   website — you send them per-order.)
4. When the transfer lands, the order is confirmed. Hand over the item at
   pickup and **decrement that option's `stock` in `merch-config.js`.**

Payment is bank transfer only — no online payment — matching TUSA's rules.
The reference number is how you match a bank deposit to an order.

## One-time: turn on the auto-confirmation

In the [Web3Forms dashboard](https://web3forms.com) for this access key, enable
**Auto Respond** so students get an instant "order received" email. Suggested
text:

> Subject: We've received your merch order ({{order_reference}})
>
> Thanks! We'll email your payment details and a pickup time shortly. Your
> order is held once we receive your bank transfer.

(The same key is shared with the fencing page, so if you set that up already,
this is done.)

## Editing products

Open `js/merch-config.js`. Each product is a `{ ... }` block. Common edits:

- **Change a price** — edit `price` (plain number; `16.22` is fine).
- **Update stock** — edit the `stock` number on each option. When an option
  hits `0` it shows "sold out" and can't be ordered; when a product's options
  all hit `0`, the whole card shows "Sold out".
- **Hide a product** without deleting it — set `active: false`.
- **Add a product** — copy a whole block, paste it into `PRODUCTS`, give it a
  unique `id`, and add a photo (below).

### Adding a photo

Put the image in `images/merch/` and set the product's `image` to the
filename. Keep photos roughly square and under ~200 KB so the page stays fast
(resize/compress before uploading — the existing ones are ~900px wide JPEGs).

### Stock is advisory — you are the real gate

The stock counts prevent obvious over-ordering, but someone could order the
last item twice before you update the file. That's fine: every order is
"pending payment" until you see the transfer, so nothing is truly committed
until you confirm it. Just remember to decrement stock when you confirm a sale.

## Known limits (static site, no backend)

- No online payment (by design — TUSA rule). Bank transfer + pickup only.
- No live inventory sync. `merch-config.js` is the single source of truth;
  keep it current as you make sales.
- If Web3Forms is ever down or the key is removed, orders fall back to opening
  a pre-filled email in the student's mail app — so orders are never lost.
