import { renderCommerceCategory } from "./_commerce-category";

export const onRequest = ({ request, env }: { request: Request; env: { ASSETS?: { fetch(request: Request): Promise<Response> } } }) => renderCommerceCategory(request, env, {
  slug: "custom-drinkware-bangladesh",
  title: "Custom Drinkware in Bangladesh | Bottles, Mugs & More | Trynext",
  description: "Shop customizable drinkware in Bangladesh, including personalized mugs and water bottles. Add a photo, name, message, or artwork and order from Trynext Lifestyle.",
  h1: "Custom Drinkware Designed for Everyday Moments",
  intro: "Choose customizable mugs and water bottles for gifts, work, school, fitness, or everyday use. Trynext Lifestyle helps customers in Bangladesh turn their own ideas into orderable drinkware designs.",
  categoryId: 7,
  productLink: "/products?category=water-bottles",
  productLabel: "Browse customizable water bottles",
  bullets: ["Personalized water bottles for daily use", "Custom gifts for couples, friends, and family", "The verified live catalog currently includes mugs and water bottles"],
  faqs: [
    { question: "What custom drinkware can I order from Trynext?", answer: "The verified live catalog currently includes customizable mugs and water bottles. Other drinkware types should only be advertised after a real orderable product is added and verified." },
    { question: "How much do custom water bottles cost?", answer: "The verified live water-bottle catalog currently ranges from ৳699 to ৳1,199 after available discounts. The final amount depends on the selected product and options shown at checkout." },
    { question: "Do you offer custom tumblers or bulk drinkware orders?", answer: "This page does not claim tumbler availability or a separate bulk-order workflow because those capabilities were not confirmed in the current production catalog. Contact Trynext for a factual availability check." },
  ],
});
