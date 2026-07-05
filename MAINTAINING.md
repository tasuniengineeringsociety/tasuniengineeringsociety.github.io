# Fencing Hire — Maintainer Guide

Everything the fencing hire page needs lives in three files:

| File | What it holds | How often you touch it |
|---|---|---|
| `js/fencing-config.js` | Prices, stock count, fees, contact email, form key | Rarely — when rates change |
| `data/fencing-bookings.json` | Every booking + its status | Every time a booking arrives / changes |
| `js/fencing.js` | The page logic | Basically never |

All edits can be done in GitHub's web editor (open the file → pencil icon →
commit). GitHub Pages redeploys automatically in about a minute.

---

## 1. One-time setup: Web3Forms (5 minutes)

Booking requests are emailed to you by [Web3Forms](https://web3forms.com)
(free tier: 250 submissions/month — plenty).

1. Go to https://web3forms.com and create an access key using
   `president.engineering.utas@gmail.com` (it emails you a verification link).
2. Paste the key into `js/fencing-config.js` → `WEB3FORMS_ACCESS_KEY`.
3. In the Web3Forms dashboard, turn on **Auto Respond** so requesters get an
   automatic confirmation email. Suggested template (their editor lets you
   insert form fields):

   > Subject: We've received your fencing hire request ({{booking_reference}})
   >
   > Thanks {{from_name field: name}} — your request is **pending** and the TUES
   > committee will confirm within 2 business days.
   >
   > {{summary}}
   >
   > To change or cancel, reply to this email quoting your reference.

**Until the key is set up** the page still works: submissions fall back to
opening a pre-filled email in the requester's mail app, addressed to the
society email. So nothing is ever lost — the form service just makes it
smoother.

## 2. When a booking request arrives (the core workflow)

Every request email contains a ready-made summary including a reference like
`TUES-FH-260718-K4QZ`. To put it on the calendar:

1. Open `data/fencing-bookings.json` on GitHub → Edit.
2. Copy an existing booking block, paste it into the `bookings` array, and
   fill in the details from the email. Set `"status": "pending"`.
3. Commit. The calendar now holds those panels so nobody can double-book them.
4. When the committee decides: change `status` to `"confirmed"` (and reply to
   the requester) or `"declined"` (frees the stock again).
5. After the panels come back: change `status` to `"completed"` (frees the
   stock) and add a condition note (see below).

**Statuses and what they do:**

- `pending` / `confirmed` → panels are held on the calendar
- `declined` / `completed` → panels are free again

⚠️ JSON is picky: every booking except the last needs a trailing comma, and
dates must be `"YYYY-MM-DD"` in quotes. If the calendar shows "couldn't load
availability" after an edit, you've probably dropped a comma or quote — GitHub
shows the diff, so just fix and re-commit. Pasting the file into
https://jsonlint.com before committing is a good habit.

The website form blocks overlapping requests, but it's only a convenience —
**this file is the source of truth**, and you're the final gate: a request
only holds stock once you add it here.

## 3. Condition log (hire-out and return)

Photo uploads were deliberately left out — keep it as short text notes on the
booking record. When panels go out and when they come back, add an entry to
that booking's `conditionLog`:

```json
"conditionLog": [
  { "date": "2026-07-18", "type": "hire-out", "note": "25 panels + 26 feet, all straight, hirer signed off." },
  { "date": "2026-07-20", "type": "return",   "note": "All returned. One foot bent — $25 off bond." }
]
```

These are your internal record (they're in a public repo, so keep them
factual and don't put anything sensitive in them). Count panels *with* the
hirer at both handovers.

## 4. Changing prices, stock, or rules

Open `js/fencing-config.js` — every value is commented. Common ones:

- Bought more panels → `TOTAL_PANELS`
- New rates → `RATE_PER_PANEL_PER_WEEK` / `RATE_PER_PANEL_PER_DAY`
- Delivery fee → `DELIVERY_FEE`
- Bond / late / damage fees → `BOND`, `LATE_FEE_PER_DAY`, `DAMAGE_FEE_PER_PANEL`

The quote calculator, hero stats **and the Hire Terms section** all read from
this file, so one edit updates everything consistently.

## 5. Known limits (by design — it's a static site)

- **No true self-service cancel/edit.** The confirmation email and success
  screen give requesters a pre-filled "change/cancel" email instead. You
  update the JSON.
- **Overlap-blocking is client-side.** A determined person could bypass it,
  but every booking lands as *pending* and you confirm manually, so nothing
  can actually double-book without you.
- **Calendar freshness = your last commit.** The page cache-busts on every
  load, so visitors always see the latest committed JSON.
- **Delete the three `TUES-FH-SAMPLE-*` bookings** once you have real ones —
  they exist so the calendar demos properly.
