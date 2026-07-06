/* ============================================================================
   TUES FENCING HIRE — CONFIGURATION
   ----------------------------------------------------------------------------
   This is the ONLY file you need to edit to change prices, stock, or contact
   details. The calculator, calendar and booking form all read from here.

   HOW TO EDIT:
   1. Open this file on GitHub → click the pencil (Edit) icon
   2. Change a number below
   3. Commit — the live site updates in ~1 minute

   Don't rename any keys (the words in CAPITALS) — only change the values.
   ============================================================================ */

const FENCING_CONFIG = {

  /* --------------------------------------------------------------------------
     STOCK
     -------------------------------------------------------------------------- */
  TOTAL_PANELS: 40,           // Total fencing panels TUES owns.
                              // The calendar computes availability as
                              // TOTAL_PANELS minus panels in pending/confirmed
                              // bookings on each date.

  /* --------------------------------------------------------------------------
     PRICING  (all amounts in AUD, GST-free society hire)
     --------------------------------------------------------------------------
     How a quote is calculated, per panel:
       - Full weeks are charged at RATE_PER_PANEL_PER_WEEK
       - Leftover days are charged at RATE_PER_PANEL_PER_DAY each,
         but never more than another full week
     Example (defaults): 1 panel for 10 days
       = 1 week ($15) + 3 days (3 × $3 = $9) = $24
     -------------------------------------------------------------------------- */
  RATE_PER_PANEL_PER_DAY: 3,    // $ per panel per day
  RATE_PER_PANEL_PER_WEEK: 15,  // $ per panel per 7-day week (cheaper than 7 days)

  MINIMUM_HIRE_CHARGE: 30,      // $ — quotes below this are rounded up to this

  DELIVERY_FEE: 50,             // $ flat fee for delivery AND pickup (round trip),
                                //   within the Hobart area. Self-collect is free.

  BOND: 100,                    // $ refundable bond, returned after panels come
                                //   back complete and undamaged. Shown separately
                                //   in the quote (not added to the hire total).

  /* --------------------------------------------------------------------------
     FEES QUOTED IN THE T&Cs  (used for display text only)
     -------------------------------------------------------------------------- */
  LATE_FEE_PER_DAY: 10,             // $ per day past the agreed return date
  DAMAGE_FEE_PER_PANEL: 120,        // $ replacement cost per lost/damaged panel
  DAMAGE_FEE_PER_FOOT: 25,          // $ replacement cost per lost/damaged foot

  /* --------------------------------------------------------------------------
     BOOKING RULES
     -------------------------------------------------------------------------- */
  MAX_HIRE_DAYS: 42,            // Longest single hire (6 weeks). Longer hires:
                                //   "contact us" — keeps stock circulating.
  MONTHS_BOOKABLE_AHEAD: 6,     // How far into the future the calendar goes.
  MIN_NOTICE_DAYS: 2,           // Bookings must start at least this many days
                                //   from today (gives the committee time to
                                //   confirm and arrange handover).

  /* --------------------------------------------------------------------------
     CONTACT & FORM SERVICE
     -------------------------------------------------------------------------- */
  SOCIETY_EMAIL: "president.engineering.utas@gmail.com",

  // Web3Forms access key — get a free one at https://web3forms.com
  // (enter the society email, verify, paste the key here).
  // Until this is replaced, the form shows a helpful error instead of sending.
  WEB3FORMS_ACCESS_KEY: "2e32bd28-2823-4e4e-ad71-0ccd95325fe5"
};
