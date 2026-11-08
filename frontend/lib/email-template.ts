import type { Briefing } from "@/lib/briefing";
import { defaultBrand, type BriefingBrand } from "@/lib/product";
import { renderPreviewEml, renderReceivedMail } from "@/lib/newsletter/render-received-mail.mjs";

/** Builds an email-client preview, not a sent message. */
export function createBriefingEml(briefing: Briefing, serviceUrl: string, brand: BriefingBrand = defaultBrand) {
  return renderPreviewEml(renderReceivedMail(briefing, serviceUrl, brand.name), brand.name);
}

export function createEmailHtml(briefing: Briefing, serviceUrl: string, brand: BriefingBrand = defaultBrand) {
  return renderReceivedMail(briefing, serviceUrl, brand.name).html;
}
