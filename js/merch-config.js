/* ============================================================================
   TUES MERCH — CATALOGUE CONFIGURATION
   ----------------------------------------------------------------------------
   This is the file you edit to change products, prices, stock and options.
   The merch page (merch.html) builds itself from the list below.

   HOW TO EDIT (all in GitHub's web editor — pencil icon, then commit):
     - Change a price ......... edit "price"
     - Mark something sold out  set "active": false  (hides it from the page)
     - Update stock ........... edit the "stock" number on each option
     - Add a new product ...... copy a whole { ... } block, paste it in the
                                list, change the details, give it a new "id"

   RULES:
     - Every "id" must be unique and lowercase-with-dashes (used internally).
     - "image" is a filename inside images/merch/
     - Money is a plain number (no "$"). Cents are fine: 16.22 is valid.
     - Each option's "stock" is advisory — it shows buyers "only N left" and
       blocks ordering more than that, but YOU are the real gate: an order is
       "pending payment" until you see the bank transfer. Decrement stock when
       you confirm a sale. See MAINTAINING-MERCH.md.
   ============================================================================ */

const MERCH_CONFIG = {

  /* --------------------------------------------------------------------------
     CONTACT & FORM SERVICE  (shared with the fencing page)
     -------------------------------------------------------------------------- */
  SOCIETY_EMAIL: "president.engineering.utas@gmail.com",
  WEB3FORMS_ACCESS_KEY: "2e32bd28-2823-4e4e-ad71-0ccd95325fe5",

  /* Where students collect their orders, shown on the confirmation screen. */
  PICKUP_INFO: "UTAS Sandy Bay campus — we'll email you a time and place once your payment clears.",

  /* --------------------------------------------------------------------------
     PRODUCTS
     --------------------------------------------------------------------------
     "options" is the list of buyable variants (sizes/colours). A product with
     one option (e.g. the stubby holder) still needs one entry — use a label
     like "One size". "note" is optional small print under the product.
     -------------------------------------------------------------------------- */
  PRODUCTS: [
    {
      id: "hoodie-new",
      name: "Engi Society Hoodie",
      price: 25,
      image: "hoodie-new.jpg",
      active: true,
      badge: "Back in stock",
      blurb: "Our beloved hoodie, remade. Asphalt marble (dark grey), regular fit, mid-weight 290 GSM 80/20 cotton-poly anti-pill fleece, pullover hood. Front logo, \u201cENGI SOCIETY\u201d in bold white on the back.",
      note: "Sizing runs small \u2014 see the size guide. Body width (cm): XS 49, S 52, M 55, L 58, XL 61, XXL 64. Body length (cm): XS 65, S 71, M 74, L 77, XL 80, XXL 82.",
      options: [
        { label: "XS", stock: 1 },
        { label: "S",  stock: 1 },
        { label: "M",  stock: 1 },
        { label: "L",  stock: 1 },
        { label: "XL", stock: 1 }
        /* Total was 5 across sizes — adjust each as you count real stock. */
      ]
    },
    {
      id: "quarter-zip",
      name: "Navy Quarter-Zip",
      price: 47,
      image: "quarter-zip.jpg",
      active: true,
      badge: "Last chance",
      blurb: "Remaining stock from the 2025 order. Cotton navy quarter-zip with white embroidered Engi Society logo and \u201cSchool of Engineering\u201d text. Has pockets.",
      note: "Only small and medium remain.",
      options: [
        { label: "S", stock: 2 },
        { label: "M", stock: 2 }
        /* 4 remaining total — split across S/M; correct as needed. */
      ]
    },
    {
      id: "hoodie-old",
      name: "Old Logo Hoodie",
      price: 16.22,
      image: "hoodie-old.jpg",
      active: true,
      badge: "Clearance",
      blurb: "Last chance for merch with our old logo. Maroon pullover hoodie with the classic ENGI Society crest.",
      note: "Clearance price. Limited sizes \u2014 update the options below with what's left.",
      options: [
        { label: "One size", stock: 3 }
        /* 3 left total. If you know the sizes, replace this single option
           with per-size entries like the hoodie above. */
      ]
    },
    {
      id: "cord-hat",
      name: "Engi Cord Hat",
      price: 35,
      image: "cord-hat.jpg",
      active: true,
      badge: "Limited",
      blurb: "Corduroy cap brought to you by the Cord Boys. Embroidered Engi Society crest.",
      note: "",
      options: [
        { label: "Black",           stock: 2 },
        { label: "White / black brim", stock: 2 }
        /* 4 total across colours — adjust. */
      ]
    },
    {
      id: "sticker",
      name: "Vinyl Sticker",
      price: 3.40,
      image: "sticker.jpg",
      active: true,
      badge: "",
      blurb: "Weatherproof vinyl Engi Society logo sticker. Slap it on a laptop, water bottle, or hard hat.",
      note: "",
      options: [
        { label: "10cm white",    stock: 50 },
        { label: "8.5cm glitter", stock: 50 }
        /* 100 total — split evenly as a starting guess; correct to real counts. */
      ]
    },
    {
      id: "stubby",
      name: "Stubby Holder",
      price: 6.99,
      image: "stubby.jpg",
      active: true,
      badge: "",
      blurb: "Black neoprene stubby holder with the white Engi Society logo. Holds one can.",
      note: "",
      options: [
        { label: "One size", stock: 10 }
      ]
    }
  ]
};
