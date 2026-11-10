export type CommerceFaq = {
  question: string;
  answer: string;
};

export type CommerceProductGroup = {
  key: "mugs" | "water-bottles";
  label: string;
  categoryId: number;
  productLink: string;
  productLinkLabel: string;
};

export type CommerceCategoryContent = {
  kind: "mugs" | "drinkware";
  slug: string;
  title: string;
  description: string;
  keywords: string;
  h1: string;
  intro: string;
  directAnswer: string;
  primaryCtaLabel: string;
  personalizationIdeas: Array<{ title: string; description: string }>;
  businessInquiry?: { title: string; description: string };
  productGroups: CommerceProductGroup[];
  orderSteps: string[];
  giftIdeas: string[];
  imageTips: string[];
  comparison?: Array<{ feature: string; mugs: string; bottles: string }>;
  faqs: CommerceFaq[];
  relatedGuides: Array<{ title: string; href: string; description: string }>;
};

export const COMMERCE_CATEGORY_CONTENT: Record<"mugs" | "drinkware", CommerceCategoryContent> = {
  mugs: {
    kind: "mugs",
    slug: "custom-mugs-bangladesh",
    title: "Custom Photo Mugs in Bangladesh | Personalized Mugs",
    description: "Create a personalized mug with your photo or message. Browse current Trynext mugs and confirm design options, price and delivery at checkout.",
    keywords: "custom photo mug Bangladesh, personalized mug, photo mug, custom mug gift, mug design Bangladesh",
    h1: "Personalized Photo Mugs in Bangladesh",
    intro: "Trynext Lifestyle is a Bangladesh-based personalized-gift and custom apparel store. Personalize a currently listed mug with a photo, name, short message or artwork only where the selected product supports it. Start with a clear design, review the available options, and confirm the final details before checkout.",
    directAnswer: "A personalized photo mug is a mug personalized with a customer-chosen image or message where the selected product supports it. A sharp original photo, an uncluttered layout and enough space around faces and text help keep the design easy to see.",
    primaryCtaLabel: "Create your custom mug",
    personalizationIdeas: [
      { title: "Photos", description: "A family, couple, pet or travel image, when photo upload is offered on the selected mug." },
      { title: "Names and messages", description: "A name, date or short phrase, only when that product’s text controls support it." },
      { title: "Logo or business artwork", description: "Use a logo only where the listing or editor accepts that artwork; ask Trynext before planning a larger order." },
      { title: "Original illustration", description: "Artwork you created or have permission to reproduce, within the selected product’s available design tools." },
    ],
    productGroups: [
      { key: "mugs", label: "Currently listed customizable mugs", categoryId: 3, productLink: "/products?category=mugs", productLinkLabel: "Browse current mugs" },
    ],
    orderSteps: [
      "Browse the live mug listings and choose an available product marked customizable. Options and current prices can differ between products, so check the exact listing.",
      "Prepare the original photo or artwork you have permission to use. Prefer a sharp, well-lit file and keep faces, names and other important details away from the edges.",
      "Open the selected product’s design flow or the Design Studio. Add only the photo, text, logo or artwork options actually shown for that product.",
      "Review the crop, spelling, placement and selected product in the preview or review step where offered. If a control or preview is not shown, do not assume it is supported.",
      "Enter your Bangladesh delivery details and review current shipping charges, estimates, the product price and any displayed customization charge in the cart.",
      "Check the payment terms shown for your address. Where cash on delivery is offered, Trynext’s current arrangement may require a 25% advance; confirm the live checkout instruction.",
      "If COD is selected, follow checkout for the remaining balance on delivery. Confirm the selected design, total and payment terms before submitting the order.",
    ],
    giftIdeas: [
      "A favourite couple or family photo for a birthday, anniversary, engagement or wedding gift.",
      "A pet portrait, shared travel memory or friendship joke with one short caption.",
      "A name or concise English or Bangla message for a home, study or office desk, if the selected product supports that text.",
      "A simple photo-and-date layout for a personal keepsake or a long-distance gift.",
      "An office farewell, school-club celebration or team gift can start as an inquiry; confirm the product, quantity and terms with Trynext first.",
    ],
    imageTips: [
      "Choose the original full-resolution photo from your phone or camera; avoid screenshots and repeatedly forwarded or compressed copies.",
      "Use even light and a sharply focused subject. Check the image by zooming in before uploading, especially around faces and small details.",
      "Choose a crop that fits the available design area. Leave breathing room around faces, hands and text so essential details do not sit against an edge.",
      "Keep the layout simple. If the selected product supports multiple images or text, review the available preview and make sure each element remains readable.",
    ],
    faqs: [
      { question: "Can I use my own photo on a Trynext mug?", answer: "Choose a currently available mug listing marked customizable and follow the product or Design Studio flow shown for that item. The exact file, text and layout options can vary by product. Upload only a photo you have permission to use, then inspect the available design or review step before adding the item to your cart." },
      { question: "What kind of photo works best for a custom mug?", answer: "Use the original, full-resolution image rather than a screenshot or a copy repeatedly forwarded through chat. Pick a well-lit, sharply focused photo with a clear subject and avoid heavy filters or a busy background. Check the crop and leave room around faces and important details; the final layout depends on the options shown for your selected mug." },
      { question: "Can I combine a photo, name and message?", answer: "Some product flows may offer a photo together with text, but supported controls differ by item. Open the exact mug listing or Design Studio and check which options are available for that product. Keep a name or message concise, then review spelling and placement in the shown preview or order-review step before checkout." },
      { question: "Can I add Bangla text to a personalized mug?", answer: "A short Bangla phrase can be a meaningful design idea, but script and font support may vary by product and editor. Enter the exact wording only if the available text tool accepts it, then inspect the preview carefully for missing or substituted characters. Do not assume a particular script will render until you have checked it." },
      { question: "How much does a personalized mug cost?", answer: "Use the live price shown on the selected product listing as the product price. Design Studio options or a customization charge can affect the final total, so review the amount displayed in the design flow, cart and checkout before confirming. This page avoids a fixed price range because catalog prices and available options can change." },
      { question: "How does payment work for a custom mug?", answer: "Available payment choices and their terms are shown in the live checkout. Where cash on delivery is offered, the current arrangement may require a 25% advance with the remaining balance due by COD. Confirm the options for your address and selected order at checkout; this page does not publish private merchant or payment-destination details." },
      { question: "Can I order a mug for delivery outside Dhaka?", answer: "Trynext offers delivery across Bangladesh, but the service, fee and estimated arrival information can depend on the destination and current operations. Enter the complete address and check the live checkout details and shipping policy before paying. This page does not promise a fixed delivery date or transit time." },
      { question: "Can I order just one custom mug?", answer: "You can select an available item from the live mug catalog and check the quantity and personalization options shown for that product. Each listing controls what can be ordered and customized. If you want several mugs with different designs, review each item separately and confirm the cart contents before submitting the order." },
      { question: "Will I see a design preview before checkout?", answer: "Use the preview or review step provided by the selected product or Design Studio, where available, to check the photo crop, message and placement. Preview tools can differ between products. If a preview is not shown, carefully review the saved design and selected product information in the cart before continuing." },
      { question: "How long does a custom mug order take?", answer: "Production and delivery timing can vary by item, address and current order volume. Check the shipping policy and the estimated information displayed in checkout before placing an order, especially if the mug is for a specific occasion. No fixed turnaround or guaranteed arrival date is stated on this page." },
    ],
    relatedGuides: [
      { title: "How to Design a Custom Photo Mug", href: "/blog/how-to-design-a-custom-photo-mug", description: "Prepare a clear phone photo, choose a simple layout and review your design." },
      { title: "Custom Mug Gift Ideas for Couples", href: "/blog/custom-mug-gift-ideas-for-couples", description: "Turn a shared memory, date or inside joke into a personal gift idea." },
      { title: "Explore Custom Drinkware", href: "/custom-drinkware-bangladesh", description: "Compare the live mug and water-bottle options in one place." },
    ],
  },
  drinkware: {
    kind: "drinkware",
    slug: "custom-drinkware-bangladesh",
    title: "Custom Drinkware in Bangladesh | Mugs & Water Bottles",
    description: "Explore current customizable mugs and water bottles in Bangladesh. Compare everyday uses, browse live products and confirm design and delivery terms.",
    keywords: "custom drinkware Bangladesh, personalized mug, custom water bottle Bangladesh, drinkware gift ideas, personalized bottle",
    h1: "Custom Drinkware in Bangladesh",
    intro: "Compare currently listed customizable mugs and water bottles, then choose the product that fits the recipient’s routine. Personalization options differ by listing, so use the live catalog and confirm the supported design and final checkout details for the exact item.",
    directAnswer: "Trynext’s current drinkware selection includes customizable mugs and water bottles. Choose between the two by how the recipient expects to use the item, and personalize it only with options shown on the selected product.",
    primaryCtaLabel: "Design your own drinkware",
    personalizationIdeas: [
      { title: "Photos or illustrations", description: "Use your own image or artwork only if upload is offered for the selected mug or water bottle." },
      { title: "Names and short messages", description: "Check the exact product’s text controls and review the final spelling where the design flow allows it." },
      { title: "Logo or brand artwork", description: "A logo is an option to ask about only when the listing/editor supports it; larger business requests need confirmation." },
      { title: "Simple gift designs", description: "A short phrase, date or clear graphic can be an idea; avoid assuming every item accepts every file or layout." },
    ],
    businessInquiry: {
      title: "Custom drinkware for teams and businesses",
      description: "For a larger team, event or logo request, contact Trynext to ask whether it can be handled. This is an inquiry only: no minimum quantity, bulk price, discount, production lead time or guaranteed availability is confirmed until Trynext replies.",
    },
    productGroups: [
      { key: "mugs", label: "Customizable mugs", categoryId: 3, productLink: "/products?category=mugs", productLinkLabel: "Browse mugs" },
      { key: "water-bottles", label: "Customizable water bottles", categoryId: 7, productLink: "/products?category=water-bottles", productLinkLabel: "Browse water bottles" },
    ],
    orderSteps: [
      "Choose the product class that best fits the recipient: a mug for a home or desk routine, or a water bottle for a routine that involves carrying a drink container.",
      "Open the matching live product listing and confirm that it is available and marked customizable. Product options and stock can change.",
      "Prepare an image, short message or artwork that fits the listed options. Use a clear file and keep important text or image details away from the edge.",
      "Add personalization only through the tools shown for the selected product. Review the preview or order details where available, including spelling, crop and placement.",
      "Check the selected item, current product total, any displayed customization charge, delivery details and available payment terms in cart and checkout.",
    ],
    giftIdeas: [
      "A personalized mug for a tea or coffee break at home, school or a work desk.",
      "A water bottle for someone’s school, work or fitness routine, subject to the selected listing’s current availability.",
      "A shared photo or brief message for a friend, family member or couple.",
      "A simple name or artwork concept for a birthday, new role or study milestone.",
    ],
    imageTips: [
      "Start with an original, high-resolution photo or artwork file rather than a screenshot or a compressed copy.",
      "Prefer a well-lit image with a clear subject and enough contrast to remain recognizable at a glance.",
      "Keep faces, names and other important elements away from the edges; the printable area and crop vary by selected product.",
      "Use short, readable text. Confirm the exact customization options and inspect the preview or review step where the product provides one.",
    ],
    comparison: [
      { feature: "Often suits", mugs: "Home, tea or coffee breaks, and desk use", bottles: "A routine that involves carrying a drink container to school, work or fitness" },
      { feature: "Personalization", mugs: "Check the selected listing for photo, text or artwork options", bottles: "Check the selected listing for the currently supported design options" },
      { feature: "Before ordering", mugs: "Confirm the current mug listing, design options and final cart total", bottles: "Confirm the current bottle listing, design options and final cart total" },
    ],
    faqs: [
      { question: "What drinkware can I order from Trynext?", answer: "The current live selection for this page is customizable mugs and water bottles. Availability may change as the catalog is updated, so use the product groups below and open the individual listing before deciding. This page does not represent an offer for products that are not present in the live catalog." },
      { question: "Should I choose a mug or a water bottle?", answer: "Think about how the recipient is likely to use the item. A mug may fit a home or desk routine, while a water bottle may suit someone who carries a drink container to school, work or fitness. These are use-case ideas, not performance claims; check the exact product listing for details." },
      { question: "Can I add my own photo or name to drinkware?", answer: "Personalization controls vary by listing. Select an item marked customizable and use only the photo, text or artwork options actually shown for that product or in the Design Studio. Review the design and final cart details before checkout rather than assuming every product supports the same combination." },
      { question: "Can I order custom drinkware for a team or event?", answer: "There is no separate automatic bulk or corporate ordering flow described on this page. If you have a larger request, contact Trynext through the Contact page to ask whether it can be handled. Do not assume a minimum quantity, discount, quote, production schedule or guaranteed availability until Trynext confirms it." },
      { question: "How much does custom drinkware cost?", answer: "Check the live price on each selected mug or water-bottle listing. Design Studio options or a customization charge may affect the final amount, so review the design flow, cart and checkout total before confirming. This page does not publish a fixed range that could become inaccurate when catalog prices or options change." },
      { question: "What payment options are available?", answer: "The current payment options are presented in checkout for the selected order and address. Where cash on delivery is offered, the arrangement may require a 25% advance and the remaining balance by COD. Confirm the exact terms displayed at checkout before submitting; this page does not publish private merchant details." },
      { question: "Can these products be delivered across Bangladesh?", answer: "Trynext offers delivery across Bangladesh, but the delivery service, charge and estimate depend on current settings and the destination. Enter the complete delivery address and check the shipping policy and live checkout information. No fixed fee or delivery timeframe is promised on this page." },
      { question: "Can I add Bangla text or a logo?", answer: "A short Bangla phrase or logo can be a design idea, but file and script support depends on the selected product and available editor controls. Check the listing, use the exact supported input option, and inspect the preview for legibility before checkout. Do not assume every format or script will render correctly." },
      { question: "Can I order just one item?", answer: "Select a currently available product and check the quantity and customization controls shown on that listing. If you want several items with different names or designs, confirm that each product can be configured as needed and that the cart reflects the correct design for every item before you submit." },
      { question: "How soon will my drinkware order arrive?", answer: "Production and shipping estimates can vary by product, order and delivery destination. Use the current shipping policy and information shown in checkout to plan an order for a birthday, event or other date. This guide does not state a fixed processing time or guarantee a delivery date." },
    ],
    relatedGuides: [
      { title: "Custom Drinkware Gifts in Bangladesh", href: "/blog/custom-drinkware-gifts-in-bangladesh", description: "Choose between mugs and water bottles with practical ordering and artwork checks." },
      { title: "How to Design a Custom Photo Mug", href: "/blog/how-to-design-a-custom-photo-mug", description: "A step-by-step guide to preparing a clear mug design." },
    ],
  },
};
