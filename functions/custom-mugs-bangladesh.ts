import { renderCommerceCategory } from "./_commerce-category";

export const onRequest = ({ request, env }: { request: Request; env: { ASSETS?: { fetch(request: Request): Promise<Response> } } }) => renderCommerceCategory(request, env, {
  slug: "custom-mugs-bangladesh",
  title: "Personalized Photo Mugs in Bangladesh | Trynext Lifestyle",
  description: "Create a personalized photo mug in Bangladesh with your own photo, name, message, or artwork. Browse real Trynext mug products, customize your design, and order online.",
  h1: "Personalized Photo Mugs in Bangladesh",
  intro: "Turn a favorite photo, name, message, or illustration into an everyday mug. Trynext Lifestyle offers real customizable mug products that you can order online across Bangladesh.",
  categoryId: 3,
  productLink: "/products?category=mugs",
  productLabel: "Browse customizable mugs",
  bullets: ["Photo gifts for couples, birthdays, and anniversaries", "Name or message mugs for work and home", "Real live catalog products with current prices shown"],
  faqs: [
    { question: "Can I print my own photo on a mug?", answer: "Yes. Trynext's personalized mug products are marked customizable, so you can use your own photo, artwork, name, or message through the available product and Design Studio flow." },
    { question: "How much do personalized mugs cost?", answer: "The verified live mug catalog currently ranges from ৳349 to ৳599 after available discounts. The final amount depends on the selected product and options shown at checkout." },
    { question: "How does payment work for a custom mug?", answer: "Trynext checkout supports the Bangladesh 25% advance and cash-on-delivery balance flow where applicable. Available payment methods are shown from the live checkout configuration." },
  ],
});
