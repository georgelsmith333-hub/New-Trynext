import { COMMERCE_CATEGORY_CONTENT } from "../artifacts/trynex-storefront/src/content/commerceSeoContent";
import { renderCommerceCategory } from "./_commerce-category";

export const onRequest = ({ request, env }: { request: Request; env: { ASSETS?: { fetch(request: Request): Promise<Response> } } }) =>
  renderCommerceCategory(request, env, COMMERCE_CATEGORY_CONTENT.drinkware);
