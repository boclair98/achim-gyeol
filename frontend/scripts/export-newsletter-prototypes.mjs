import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { newsletterVariants, renderNewsletter } from "../lib/newsletter/render-newsletter.mjs";
import { renderReaderArticle } from "../lib/newsletter/render-reader-article.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const imageDescriptions = { 1284: "쌓여 있는 미국 달러 지폐", 1289: "파란 하늘 아래 중국 국기", 1291: "경기장에 함께 있는 한국 축구 대표팀", 1286: "이태원 참사 특별조사위원회 관계자의 발언", 1287: "식당에서 주문 기기를 사용하는 사람", 1293: "잠금장치 그래픽과 휴대폰을 든 사람" };
const stories = JSON.parse(await readFile(resolve(root, "components/prototype/archive-fixture.json"), "utf8")).map((story) => ({ ...story, imageAlt: imageDescriptions[story.id] }));
const directory = resolve(root, "public/newsletter-prototypes");
await mkdir(directory, { recursive: true });
const fontConfig = JSON.parse(await readFile(resolve(directory, "fonts/font-config.json"), "utf8"));
const metadata = [];
for (const variant of newsletterVariants) {
  const edition = renderNewsletter({ briefingDate: "2026-09-16", dateLabel: "2026년 9월 16일 수요일", stories }, { variant, preview: true, fontFaces: fontConfig.faces, fontLicenseConfirmed: fontConfig.licenseConfirmed });
  await writeFile(resolve(directory, `${variant}.html`), edition.html, "utf8");
  await writeFile(resolve(directory, `${variant}.txt`), edition.text, "utf8");
  metadata.push({ variant, subject: edition.subject, preheader: edition.preheader, storyCount: edition.storyCount, bytes: Buffer.byteLength(edition.html), preview: true, fontFamily: fontConfig.family, fontStatus: fontConfig.status });
}
await writeFile(resolve(directory, "metadata.json"), `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
const articleManifest = { briefingDate: "2026-09-16", dateLabel: "2026년 9월 16일", preview: true, stories: [] };
for (const story of stories) {
  if (!Number.isSafeInteger(story.id) || story.id <= 0) throw new Error("Focused article export requires a positive numeric ID");
  const file = `story-${story.id}.html`;
  const article = renderReaderArticle(story, { briefingDate: "2026-09-16", dateLabel: "2026년 9월 16일" });
  await writeFile(resolve(directory, file), article, "utf8");
  articleManifest.stories.push({ id: story.id, title: story.title, category: story.category, file });
}
await writeFile(resolve(directory, "reader-manifest.json"), `${JSON.stringify(articleManifest, null, 2)}\n`, "utf8");
console.log(`Exported ${metadata.length} local-only mail designs and ${articleManifest.stories.length} focused articles. No mail was sent.`);
