import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return {
    name: "아침결 — AI 뉴스 요약 카드",
    short_name: "아침결",
    description: "매일 아침 전날 핵심 뉴스의 AI 3줄 요약과 출처를 종합 카드로 전달합니다.",
    start_url: ".",
    display: "standalone",
    background_color: "#f7f7f5",
    theme_color: "#f7f7f5",
    icons: [
      { src: `${basePath}/icon.svg`, sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts: [
      { name: "오늘의 브리핑", short_name: "오늘", url: `${basePath}/`, icons: [{ src: `${basePath}/icon.svg`, sizes: "any", type: "image/svg+xml" }] },
      { name: "브리핑 보관함", short_name: "보관함", url: `${basePath}/archive/`, icons: [{ src: `${basePath}/icon.svg`, sizes: "any", type: "image/svg+xml" }] },
      { name: "내 브리핑 설정", short_name: "설정", url: `${basePath}/preferences/`, icons: [{ src: `${basePath}/icon.svg`, sizes: "any", type: "image/svg+xml" }] },
    ],
  };
}
