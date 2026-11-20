export type EditorialFaq = { question: string; answer: string };

export type EditorialGuide = {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  category: string;
  productCategoryIds: number[];
  contentMarkdown: string;
  faqs: EditorialFaq[];
  relatedLinks: Array<{ title: string; href: string }>;
};

export const EDITORIAL_GUIDES: EditorialGuide[] = [
  {
    slug: "how-to-design-a-custom-photo-mug",
    title: "How to Design a Custom Photo Mug",
    description: "Learn how to prepare a clear phone photo, choose a simple layout and review a personalized mug design before checkout in Bangladesh.",
    excerpt: "A good custom photo mug pairs a clear, well-lit image with a simple layout and a personal message that is easy to read.",
    category: "Mug Design",
    productCategoryIds: [3],
    contentMarkdown: `Whether you are making a birthday gift in Dhaka, a keepsake for family in Chattogram, or a surprise for someone far away, start with [Trynext’s custom mugs in Bangladesh](/custom-mugs-bangladesh), or browse [mugs in the product catalogue](/products?category=mugs).

## Prepare your photo on your phone

Use the original image saved on your phone rather than a screenshot or a copy forwarded through a chat app. Screenshots and compressed copies can lose detail, especially when enlarged. If you have the choice, select the sharpest original at its full resolution.

Good light matters. A photo taken near a window or outdoors in soft daylight usually shows faces and colours more clearly than a dim, grainy indoor shot. Check that the subject is in focus by zooming in before you upload. Avoid strong backlighting, heavy filters, and busy backgrounds that compete with the person or pet you want to feature.

Consider the shape of the image and the space available in the design. A square crop can suit a centred portrait or a simple collage; a landscape photo can work well for a wider scene or family group. Whichever you choose, leave breathing room around faces, hands, and any important details. Keep faces and text away from the edges, where cropping or placement may make them harder to see. If the image includes a greeting or date, check that it remains readable at a glance.

## Choose a layout and a message

One strong photo often makes a cleaner design than several small images. For a family gift, try a favourite shared moment; for a pet lover, choose a close-up with a simple background. A travel memory from Cox’s Bazar, a special celebration, or a candid moment at home can all make the mug feel personal.

If you add a message, keep it short: a name, a date, “Best Dad,” or a brief phrase in English or Bangla can complement the photo. These are design ideas, not a promise about which scripts or text options an editor supports. Check the available personalization options before settling on wording. Leave enough visual space so the image and message do not feel crowded.

## A simple design process

1. **Choose a photo.** Find the sharp original in your phone’s gallery and check its lighting, focus, and crop.
2. **Open the mug options.** Visit [Design Studio](/design-studio) or the relevant mug listing to see the options currently offered.
3. **Upload and personalize.** Add your image and use the personalization options shown, if available. Keep the composition simple and avoid placing essential details at the edges.
4. **Review before ordering.** Check the image, crop, message spelling, and overall balance in the preview or review step where offered. If something looks unclear, try a better photo or a shorter message.
5. **Confirm the order details.** Read the current checkout terms and the [shipping policy](/shipping-policy) before completing your order. Checkout may require 25% advance with the balance by COD where applicable; confirm the terms shown for your order.`,
    faqs: [
      { question: "Can I use a photo from Facebook or a messaging app?", answer: "Use the original file where possible. Social and messaging apps may compress photos, so avoid screenshots and choose the clearest copy you have permission to use. Zoom in to check focus and detail before uploading; if the only version looks soft or grainy, choose another image rather than expecting the design process to restore it." },
      { question: "Should I use one photo or several?", answer: "One sharp, well-composed photo is a reliable starting point. Use multiple images only if the available design options support them and each picture remains easy to see at the final size. A simple collage with enough space around faces is usually clearer than many tiny images competing for attention." },
      { question: "Can I add Bangla text?", answer: "A short Bangla phrase may be a thoughtful design idea, but available text and script support can vary. Check the personalization options shown for the product and inspect the exact wording in the review step before ordering. Do not assume a particular script or font will render correctly until you have checked it." },
      { question: "What should I check before checkout?", answer: "Review the selected mug, photo crop, message spelling and placement, then check the full cart total and current delivery and payment terms. The product listing, Design Studio and checkout are the source of truth for options and prices. For delivery details, refer to the current [shipping policy](/shipping-policy)." },
    ],
    relatedLinks: [
      { title: "Browse custom mugs", href: "/custom-mugs-bangladesh" },
      { title: "Open Design Studio", href: "/design-studio" },
      { title: "View the current mug catalogue", href: "/products?category=mugs" },
    ],
  },
  {
    slug: "custom-mug-gift-ideas-for-couples",
    title: "Custom Mug Gift Ideas for Couples in Bangladesh",
    description: "Find personal mug ideas for couples, from favourite travel photos and shared dates to inside jokes, with practical image and ordering tips.",
    excerpt: "A custom couple’s mug can make a shared photo, small joke or meaningful date part of an everyday routine.",
    category: "Personalized Gift Ideas",
    productCategoryIds: [3],
    contentMarkdown: `A good couple’s gift does not need to be grand to feel personal. A custom mug can turn a shared photo, a small joke or a meaningful date into something the two recipients can use in everyday routines. It is thoughtful because it shows you chose a detail that belongs to them—not because a mug can guarantee a particular reaction or relationship outcome.

For a wedding, anniversary, birthday or simple surprise, begin with a memory they will recognise. Browse [custom mugs in Bangladesh](/custom-mugs-bangladesh), explore [custom drinkware](/custom-drinkware-bangladesh), or see the [mugs collection](/products?category=mugs).

## Eight ideas to make the design theirs

1. **A favourite travel photo:** Choose a picture from a trip they still talk about—a Cox’s Bazar beach walk, a Sylhet tea-garden stop or a weekend in Old Dhaka. Add a place name or month if it helps tell the story.
2. **A relationship timeline:** Arrange milestones such as “first coffee,” “first trip” and “today.” Keep labels short; use dates only if the couple is comfortable sharing them.
3. **Their initials:** Pair both initials with a small motif connected to a shared interest. This is a restrained option if a large photo or message would not suit their style.
4. **An inside joke:** Use a harmless phrase, nickname or recurring bit of humour. Make sure both people will enjoy it—and would not be embarrassed if someone else saw it.
5. **Handwritten-note inspiration:** Take a short phrase from a card or note you have permission to use. Reproduce a few words as a design cue, or pair a typed line with a detail that recalls the original.
6. **A wedding or anniversary date:** Give the date a clean, easy-to-read layout. You might pair it with “Since 2021,” if accurate and wanted.
7. **A pet photo:** Include the cat, dog or other much-loved companion. One well-lit image is often clearer than a collage of small pictures.
8. **A short message:** Keep it warm and specific, such as “Tea tastes better together” or “Our little pause.” A concise line is easier to read than a long declaration.

## Keep photos and text clear

Use the original, full-resolution photo where possible, rather than a screenshot or an image forwarded repeatedly through messaging apps. Pick a sharp, well-lit picture with visible faces; avoid stretching a small file to fill a large area. If combining photo and words, leave breathing room between them.

For text, choose strong contrast and lettering that remains readable at a glance. Very thin scripts, tiny captions and long paragraphs can be difficult to make out on a curved surface. Check spelling, names and dates before submitting. If you need help arranging an idea, try the [Design Studio](/design-studio) and review the options available there; do not assume a guaranteed preview.

## A practical way to order

1. Decide the occasion, the recipients’ style and whether you want one shared design or a pair with complementary details.
2. Gather the image and final wording. Check that you have permission to use any photo or handwriting you did not create.
3. Choose a suitable mug and prepare the artwork and text to fit the available design options. Keep a copy of the final details for reference.
4. Enter delivery information carefully and review the cart and checkout terms before confirming. Where applicable, checkout terms may require a 25% advance, with the remaining balance due by cash on delivery (COD); rely on the terms shown at checkout for your order.
5. Read the [shipping policy](/shipping-policy), especially if the gift is for a specific occasion. Do not assume a delivery date unless the checkout or policy confirms it.

A personalised mug works best when it reflects something the couple genuinely shares. Choose one memorable detail, keep the design legible and check the order carefully: a simple way to make an everyday gift feel distinctly theirs.`,
    faqs: [
      { question: "Can two mugs have different designs?", answer: "That depends on the product and customization flow you select. Review the options for each mug and confirm that the cart shows the intended photo, name or message for every item. If the listing does not clearly support separate designs, contact Trynext through the Contact page before assuming a multi-design order can be placed." },
      { question: "Can I use a handwritten note or a personal photo?", answer: "You can use material you have permission to reproduce, but upload and text options depend on the selected product. A clear scan or original photo is easier to review than a low-resolution screenshot. Check the available design tools, placement and spelling in the review step before adding the item to your cart." },
      { question: "How far ahead should I order a couple’s gift?", answer: "Plan with enough time for the current production and delivery process, especially around an occasion. Timing depends on the product and delivery destination, so read the shipping policy and the estimate shown in checkout before placing the order. This guide does not promise a fixed arrival date or turnaround." },
      { question: "Can I add Bangla wording to the design?", answer: "A short Bangla phrase can be a meaningful idea, but script support can vary by product and editor. Use the text option shown for the chosen mug and inspect the exact characters in the preview or review step. If the wording does not display clearly, choose another layout or message rather than assuming it will be corrected later." },
    ],
    relatedLinks: [
      { title: "Browse personalized mugs", href: "/custom-mugs-bangladesh" },
      { title: "Explore current drinkware", href: "/custom-drinkware-bangladesh" },
      { title: "Open Design Studio", href: "/design-studio" },
    ],
  },
  {
    slug: "custom-drinkware-gifts-in-bangladesh",
    title: "Custom Drinkware Gifts in Bangladesh: Mugs vs Water Bottles",
    description: "Compare customizable mugs and water bottles for everyday gifting in Bangladesh, with practical artwork and order checks for Trynext.",
    excerpt: "Choose a mug or water bottle by the recipient’s routine, then check the exact product’s design options and live checkout terms.",
    category: "Drinkware Gift Ideas",
    productCategoryIds: [3, 7],
    contentMarkdown: `A useful gift does not have to be complicated. A mug for a familiar tea break or a water bottle to carry through the day can feel more personal when it reflects someone’s name, a favourite phrase, a shared memory or a simple design they would choose themselves. In Bangladesh, where tea and coffee breaks are part of many home and work routines, customizable mugs and water bottles offer two straightforward ways to make everyday drinkware feel considered.

Trynext’s [custom drinkware collection](/custom-drinkware-bangladesh) focuses here on those two product classes: [custom mugs](/custom-mugs-bangladesh) and water bottles. They suit different routines, so begin with how the recipient is likely to use the gift rather than choosing a design first.

## Choose for the person and the occasion

A personalized mug can be a fitting choice for home or a desk: think of a small birthday present for a friend who enjoys a quiet tea break, or a cheerful reminder for someone settling into a new study or work space. Browse the [mug options](/products?category=mugs) and consider a name, a short message, or artwork linked to an interest you know well.

A custom water bottle may make more sense for someone who wants a drink container as part of a school, work or fitness routine. It can also be a thoughtful gift for a sibling starting a new term, a colleague beginning a new role, or a friend who regularly heads out for exercise. Explore the [water-bottle options](/products?category=water-bottles). Keep the choice grounded in the recipient’s habits; avoid assuming that one item suits every routine.

For either class, a personal detail is often enough. A shared joke, a favourite colour, or a clean graphic can make a gift feel specific without crowding the design. If you are unsure what the recipient would like, choose a simple concept they can use in more than one setting.

## Before you place an order

A few checks can make the process smoother:

1. **Pick the product class first.** Decide whether a mug or water bottle better matches the recipient’s day-to-day use, then review the relevant product listing.
2. **Settle on a clear idea.** Keep names and messages concise, check spelling carefully, and make sure you have permission to use any personal photo or artwork.
3. **Prepare the image.** Use a clear, high-resolution file where possible. Avoid tiny text, fine details, or important elements placed close to the edge, since the final appearance depends on the design and product layout. Review the preview in the [Design Studio](/design-studio) before ordering.
4. **Check the listing and checkout.** Confirm the selected item, personalization details, delivery address, and the live terms shown at checkout. Product availability and order terms can change, so do not rely on an old screenshot or an assumed price.
5. **Review delivery information.** Read the current [shipping policy](/shipping-policy) and confirm the checkout details before submitting the order. Where applicable, the current arrangement is 25% advance with the balance due by cash on delivery (COD); confirm the live checkout terms for your order.

If you are creating a gift for a particular date, leave room for the order and delivery process, and check the current information rather than assuming a specific delivery timeframe. The product listing and checkout are the best places to verify what applies to your selection.`,
    faqs: [
      { question: "Which should I choose: a mug or a water bottle?", answer: "Consider the recipient’s routine. A mug may suit a home or desk break, while a water bottle may fit school, work or fitness routines. These are everyday-use ideas rather than product-performance claims. Review the current catalog and the selected listing’s available design options before choosing." },
      { question: "Can I use my own design or photo?", answer: "Use the Design Studio or product flow linked from the selected listing to see which options are available. Only upload artwork you have permission to use, and check the preview or review step for spelling, legibility and placement. The available tools can differ between a mug and a water-bottle product." },
      { question: "Can I add Bangla text?", answer: "Check the text options for the selected product and inspect the exact wording in the preview or review step. Script and font support can vary, so do not assume a particular character set will render as intended. If the text is not clear, use another supported design or leave the wording out." },
      { question: "What will the gift cost, and when will it arrive?", answer: "Prices, stock and delivery information can change. Review the selected product page, any customization charge shown in the design flow, the shipping policy and the live checkout total. This guide makes no fixed price or delivery-time claim; the current listing and checkout are the sources to confirm your order details." },
    ],
    relatedLinks: [
      { title: "Compare current custom drinkware", href: "/custom-drinkware-bangladesh" },
      { title: "Browse personalized mugs", href: "/custom-mugs-bangladesh" },
      { title: "Browse water bottles", href: "/products?category=water-bottles" },
    ],
  },
];

export function getEditorialGuide(slug: string | undefined): EditorialGuide | undefined {
  return EDITORIAL_GUIDES.find((guide) => guide.slug === slug);
}
