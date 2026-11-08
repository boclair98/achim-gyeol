import type { EvidenceClaim, Story } from "./briefing";

const nonWord = /[^\p{L}\p{N}]+/gu;
const tokenPattern = /[가-힣]+|[a-z][a-z0-9-]*|\d+(?:\.\d+)?/gi;
const commonEnding = /(?:되었습니다|됐습니다|되었다|됐다|하였습니다|했습니다|하였다|했다|하고|에서는|에서도|으로는|으로|에서|에게|부터|까지|은|는|이|가|을|를)$/u;
const quantityEnding = /^(건|곳|명|원|대|개)(?:이|은|는|을|를|으로)$/u;
const meaningfulQualifiers = [
  /확정|의결/u, /검토|논의/u, /예정|추진/u, /전망|추정|예측|가능성/u,
  /않|아니|아닌|없|못했|못하|미확인|부인|보류/u, /이상|초과/u, /이하|미만/u,
  /인하|하락|급락|감소/u, /인상|상승|급등|증가/u, /이전|앞서/u, /이후|뒤에/u,
  /보도|전했다/u, /금지|제한/u, /허용|해제/u,
];
const koreanDomainSuffixes = new Set(["co.kr", "or.kr", "go.kr", "ac.kr", "ne.kr"]);
const caveatPattern = /확인되지 않|확인할 수 없|확인하기 어려|확인하지 못|확정되지 않|확정할 수 없|확정하기 어려|판단하기 어려|특정할 수 없|알 수 없|출처.{0,25}엇갈/u;

const editorialGlossary = [
  {
    matches: /사이드카/u, categories: ["금융", "경제"],
    name: "사이드카",
    explanation: "시장이 급변할 때 프로그램매매 주문의 효력을 잠시 멈추는 장치예요. 모든 주식 거래가 멈추는 건 아니에요.",
    publisher: "한국거래소",
    url: "https://global.krx.co.kr/contents/GLB/01/0109/0109000000/guide_to_trading_in_the_korean_stock_market.pdf",
  },
  {
    matches: /\bELS\b|주가연계증권/iu, categories: ["금융", "경제"],
    name: "ELS(주가연계증권)",
    explanation: "연결된 주식이나 주가지수의 움직임에 따라 상환 금액이 달라져요. 상품 조건에 따라 원금을 잃을 수 있어요.",
    publisher: "금융위원회",
    url: "https://www.fsc.go.kr/no010107/84076",
  },
  {
    matches: /조류\s*인플루엔자|고병원성\s*AI\b/iu, categories: ["사회", "생활", "정책", "국제"],
    name: "조류인플루엔자(AI)",
    explanation: "여기서 AI는 인공지능이 아니라, 닭이나 오리 같은 조류에 주로 감염되는 바이러스성 질병을 뜻해요.",
    publisher: "질병관리청",
    url: "https://www.kdca.go.kr/bbs/kdca/42/310672/download.do",
  },
];

// These are sourced definitions, not evidence about the event itself.
export function relatedGlossaryTerm(story: Pick<Story, "title" | "category">) {
  return editorialGlossary.find(term => term.categories.includes(story.category) && term.matches.test(story.title)) ?? null;
}

function sentences(value?: string | null): string[] {
  return typeof value === "string"
    ? value.trim().split(/(?<=[.!?。！？])\s+|\r?\n+/u).map(text => text.trim()).filter(Boolean)
    : [];
}

function clean(value: string): string {
  return value.normalize("NFKC").toLowerCase().replace(/(?<=\d),(?=\d)/gu, "");
}

function figureSignature(value: string): string {
  const numbers = clean(value).match(/[+−-]?\d+(?:\.\d+)?\s*(?:%\s*(?:p|포인트|대)?|조|억|만|천|원|명|곳|건|대|년|월|일)?/gu);
  return (numbers ?? []).map(number => number.replace(/\s/g, "")).join("/");
}

function wordSequence(value: string): string[] {
  return (clean(value).match(tokenPattern) ?? []).map(word => {
    const unit = quantityEnding.exec(word)?.[1];
    if (unit) return unit;
    const root = word.replace(commonEnding, "");
    return root.length >= 2 ? root : word;
  });
}

/** Only hide a near repeat if the earlier sentence already contains its words in order. */
function alreadySaid(candidate: string, prior: string): boolean {
  if (figureSignature(candidate) !== figureSignature(prior)) return false;
  if (meaningfulQualifiers.some(signal => signal.test(candidate) !== signal.test(prior))) return false;
  if (clean(candidate).replace(nonWord, "") === clean(prior).replace(nonWord, "")) return true;
  const wanted = wordSequence(candidate);
  const earlier = wordSequence(prior);
  if (wanted.length < 4 || wanted.length < earlier.length * .75) return false;
  let index = 0;
  for (const token of earlier) if (token === wanted[index]) index++;
  return index === wanted.length;
}

function listedOutlets(claim: EvidenceClaim): number {
  if (!Array.isArray(claim.sources)) return 0;
  const outlets = new Set<string>();
  for (const source of claim.sources) {
    try {
      const url = new URL(source.url);
      if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) continue;
      const labels = url.hostname.toLowerCase().split(".");
      outlets.add(labels.slice(koreanDomainSuffixes.has(labels.slice(-2).join(".")) ? -3 : -2).join("."));
    } catch { /* An invalid link isn't evidence. */ }
  }
  return outlets.size;
}

export function composeReceivedReading(story: Story) {
  const headline = story.title.trim();
  const lead = sentences(story.oneLineSummary);
  const summary = sentences(story.summary);
  const plain = sentences(story.plainExplanation);
  const background = sentences(story.backgroundContext);
  const impact = sentences(story.whyItMatters);
  const watch = sentences(story.whatToWatch);
  const all = [...lead, ...plain, ...summary, ...background, ...impact, ...watch];
  const unique = (items: string[], seen: string[]) => items.filter(item => {
    if (seen.some(prior => alreadySaid(item, prior))) return false;
    seen.push(item);
    return true;
  });
  const cautions = unique([
    ...sentences(story.uncertainty),
    ...all.filter(sentence => caveatPattern.test(sentence)),
  ], []);
  const ordinary = (items: string[]) => items.filter(item => !caveatPattern.test(item) && !cautions.some(note => alreadySaid(item, note)));
  const coreCopy = ordinary([...lead, ...summary, ...plain]);
  const claims = Array.isArray(story.claims) && !["CONFLICTING", "SINGLE_SOURCE"].includes(story.verificationStatus)
    ? story.claims.flatMap(claim => {
      const text = typeof claim?.statement === "string" ? claim.statement.trim() : "";
      // Don't lift a detached claim into the lead. It must also be present
      // in this article's existing body, and have at least two linked outlets.
      return text && text.length <= 105 && !caveatPattern.test(text) && listedOutlets(claim) >= 2
        && coreCopy.some(sentence => alreadySaid(text, sentence) || alreadySaid(sentence, text))
        ? [text]
        : [];
    })
    : [];
  // A split headline can cover two facts with different numbers. Compare
  // against each full clause too, without discarding a new number or qualifier.
  const headlineClauses = headline.split(/…+|\.{3,}|\s+—\s+/u).map(part => part.trim()).filter(Boolean);
  const seen = headline ? [headline, ...headlineClauses] : [];
  const keyPoints: string[] = [];
  for (const item of ordinary([...lead, ...claims])) {
    if (keyPoints.length >= 2) break;
    if (item.length > 110 || keyPoints.join("").length + item.length > 165 || seen.some(prior => alreadySaid(item, prior))) continue;
    keyPoints.push(item);
    seen.push(item);
  }
  if (!keyPoints.length) {
    const next = ordinary([...summary, ...plain, ...lead])
      .find(item => item.length <= 145 && !seen.some(prior => alreadySaid(item, prior)));
    if (next) { keyPoints.push(next); seen.push(next); }
  }
  const body = unique(ordinary([...plain, ...summary, ...lead]), seen);
  const explanation = body.filter(text => text.length <= 165).slice(0, 2);
  const rest = body.filter(text => !explanation.includes(text));
  return {
    keyPoints,
    explanation,
    rest,
    background: unique(ordinary(background), seen),
    impact: unique(ordinary(impact), seen),
    watch: unique(ordinary(watch), seen),
    cautions,
  };
}
