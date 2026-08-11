import type { Briefing, Story } from "@/lib/briefing";
import { defaultBrand, type BriefingBrand } from "@/lib/product";

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;

export type BriefingCard =
  | { id: string; kind: "cover"; briefing: Briefing; brand: BriefingBrand }
  | { id: string; kind: "story"; briefing: Briefing; story: Story; index: number; brand: BriefingBrand }
  | { id: string; kind: "closing"; briefing: Briefing; brand: BriefingBrand };

export function buildBriefingCards(briefing: Briefing, brand: BriefingBrand = defaultBrand): BriefingCard[] {
  return [
    { id: "cover", kind: "cover", briefing, brand },
    ...briefing.stories.map((story, index) => ({
      id: `story-${story.id}`,
      kind: "story" as const,
      briefing,
      story,
      index: index + 1,
      brand,
    })),
    { id: "closing", kind: "closing", briefing, brand },
  ];
}

export async function renderBriefingCard(card: BriefingCard, assetBase = ""): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable");

  ctx.textBaseline = "top";
  if (card.kind === "cover") await drawCover(ctx, card, assetBase);
  if (card.kind === "story") drawStory(ctx, card);
  if (card.kind === "closing") drawClosing(ctx, card);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Image export failed"))), "image/png", 1);
  });
}

async function drawCover(ctx: CanvasRenderingContext2D, card: Extract<BriefingCard, { kind: "cover" }>, assetBase: string) {
  const image = await loadImage(`${assetBase}/briefing-card-bg.png`);
  drawImageCover(ctx, image, 0, 0, CARD_WIDTH, CARD_HEIGHT);

  const shade = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
  shade.addColorStop(0, "rgba(6, 20, 44, .2)");
  shade.addColorStop(.48, "rgba(6, 20, 44, .72)");
  shade.addColorStop(1, "rgba(6, 20, 44, .96)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  ctx.fillStyle = card.brand.accent;
  roundRect(ctx, 72, 72, 310, 64, 32);
  ctx.fill();
  text(ctx, card.brand.descriptor, 104, 89, 26, 900, "#101722");

  text(ctx, card.brand.name, 72, 190, 48, 900, "#ffffff");
  text(ctx, card.briefing.dateLabel, 72, 260, 28, 700, "rgba(255,255,255,.72)");

  const headlineY = 570;
  text(ctx, "어제의 소음은 빼고,", 72, headlineY, 72, 900, "#ffffff");
  text(ctx, "오늘 필요한 뉴스만.", 72, headlineY + 94, 72, 900, "#ffffff");
  drawParagraph(ctx, card.briefing.lead, 72, headlineY + 218, 850, 42, 62, 3, "rgba(255,255,255,.82)", 600);

  ctx.strokeStyle = "rgba(255,255,255,.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(72, 1160);
  ctx.lineTo(1008, 1160);
  ctx.stroke();
  text(ctx, `${card.briefing.stories.length}개 핵심 뉴스`, 72, 1202, 32, 900, card.brand.accent);
  text(ctx, `교차 확인 ${card.briefing.verifiedCount}건 · 약 ${card.briefing.readMinutes}분`, 545, 1205, 28, 700, "#ffffff");
}

function drawStory(ctx: CanvasRenderingContext2D, card: Extract<BriefingCard, { kind: "story" }>) {
  const accent = card.brand.accent;
  ctx.fillStyle = "#f4f1e8";
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, CARD_WIDTH, 24);

  text(ctx, `${card.brand.name}  ·  AI NEWS SUMMARY`, 68, 64, 25, 900, "#101722");
  text(ctx, `${String(card.index).padStart(2, "0")} / ${String(card.briefing.stories.length).padStart(2, "0")}`, 850, 64, 25, 800, "#68707a");

  ctx.fillStyle = accent;
  roundRect(ctx, 68, 142, 144, 58, 29);
  ctx.fill();
  text(ctx, card.story.category, 104, 156, 27, 900, "#ffffff");
  const verified = card.story.verificationStatus === "VERIFIED";
  text(ctx, verified ? "● 교차 검증 완료" : "● 추가 보도 확인 중", 242, 158, 25, 800, verified ? "#147a56" : "#9a6517");

  const titleBottom = drawParagraph(ctx, card.story.title, 68, 246, 944, 70, 86, 4, "#101722", 900);
  ctx.fillStyle = accent;
  ctx.fillRect(68, titleBottom + 34, 118, 9);

  const summaryLabelY = titleBottom + 86;
  text(ctx, "AI 3줄 요약", 68, summaryLabelY, 28, 900, accent);
  const summaryBottom = drawParagraph(ctx, card.story.summary, 68, summaryLabelY + 54, 944, 39, 58, 5, "#3f4854", 650);

  const boxY = Math.max(summaryBottom + 52, 850);
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, 68, boxY, 944, 245, 34);
  ctx.fill();
  ctx.strokeStyle = "#101722";
  ctx.lineWidth = 3;
  roundRect(ctx, 68, boxY, 944, 245, 34);
  ctx.stroke();
  text(ctx, "왜 중요한가", 108, boxY + 38, 27, 900, accent);
  drawParagraph(ctx, card.story.whyItMatters, 108, boxY + 88, 860, 34, 50, 3, "#101722", 700);

  const sourceNames = card.story.sources.map((source) => source.publisher).join(" · ");
  text(ctx, `출처  ${sourceNames}`, 68, 1220, 25, 700, "#68707a");
  text(ctx, `최종 확인 ${card.briefing.lastVerifiedAt}`, 760, 1220, 25, 700, "#68707a");
  text(ctx, "중요한 판단 전에는 원문을 확인하세요.", 68, 1270, 23, 600, "#8a9199");
}

function drawClosing(ctx: CanvasRenderingContext2D, card: Extract<BriefingCard, { kind: "closing" }>) {
  ctx.fillStyle = "#101d32";
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  ctx.fillStyle = card.brand.accent;
  ctx.fillRect(0, 0, 28, CARD_HEIGHT);
  text(ctx, "TODAY IN ONE PAGE", 76, 78, 28, 900, card.brand.accent);
  text(ctx, "어제의 흐름,", 76, 152, 72, 900, "#ffffff");
  text(ctx, "이렇게 기억하세요.", 76, 242, 72, 900, "#ffffff");

  let y = 388;
  card.briefing.stories.forEach((story, index) => {
    ctx.fillStyle = index % 2 === 0 ? "rgba(255,255,255,.09)" : "rgba(21,88,233,.28)";
    roundRect(ctx, 76, y, 928, 156, 28);
    ctx.fill();
    text(ctx, String(index + 1).padStart(2, "0"), 108, y + 40, 35, 900, card.brand.accent);
    drawParagraph(ctx, story.title, 190, y + 30, 760, 31, 43, 2, "#ffffff", 760);
    y += 176;
  });

  text(ctx, card.brand.name, 76, 1178, 44, 900, "#ffffff");
  text(ctx, "출처를 확인하고 · 사실과 전망을 나누고 · 오류를 투명하게 고칩니다", 76, 1243, 24, 650, "rgba(255,255,255,.68)");
}

function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, size: number, weight: number, color: string) {
  ctx.font = `${weight} ${size}px "Pretendard", "Noto Sans KR", "Malgun Gothic", sans-serif`;
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

function drawParagraph(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
  lineHeight: number,
  maxLines: number,
  color: string,
  weight: number,
) {
  ctx.font = `${weight} ${size}px "Pretendard", "Noto Sans KR", "Malgun Gothic", sans-serif`;
  ctx.fillStyle = color;
  const lines = wrapLines(ctx, value, maxWidth, maxLines);
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

function wrapLines(ctx: CanvasRenderingContext2D, value: string, maxWidth: number, maxLines: number) {
  const words = value.trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    line = word;
    if (lines.length === maxLines - 1) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  const consumed = lines.join(" ");
  if (consumed.length < value.trim().length && lines.length) {
    let last = lines[lines.length - 1];
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    lines[lines.length - 1] = `${last.replace(/[,.]$/, "")}…`;
  }
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function drawImageCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}
