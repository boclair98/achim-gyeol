"use client";

import { useState } from "react";
import type { Story } from "@/lib/briefing";

type StoryVisualProps = {
  story: Story;
  variant?: "card" | "article" | "row" | "hero";
  priority?: boolean;
};

const responsiveSizes = {
  hero: "(max-width: 600px) 72vw, 320px",
  row: "(max-width: 600px) 100vw, 560px",
  card: "(max-width: 850px) 92vw, 760px",
  article: "(max-width: 850px) 92vw, 840px",
} as const;

export function StoryVisual({ story, variant = "card", priority = false }: StoryVisualProps) {
  const [failed, setFailed] = useState(false);
  const [imageFit, setImageFit] = useState<"cover" | "contain">("cover");

  if (!story.imageUrl || failed) return null;

  return (
    <figure className={`story-visual story-visual-${variant}${imageFit === "contain" ? " story-visual-contain" : ""}`}>
      {/* Remote news domains vary daily, so the verified source URL is rendered without Next image-host restrictions. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={story.imageUrl}
        alt={`${story.title} 관련 기사 대표 이미지`}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        sizes={responsiveSizes[variant]}
        referrerPolicy="no-referrer"
        onLoad={(event) => {
          const { naturalWidth, naturalHeight } = event.currentTarget;
          const ratio = naturalWidth / Math.max(naturalHeight, 1);
          // Preserve infographics and unusually tall/wide source images instead
          // of cropping away the context readers need on another viewport.
          if (variant !== "hero" && (ratio < 0.78 || ratio > 2.25)) setImageFit("contain");
        }}
        onError={() => setFailed(true)}
      />
      {variant !== "hero" && <figcaption><span>{story.category}</span>{story.imagePublisher ? `${story.imagePublisher} 기사 이미지` : "기사 대표 이미지"}</figcaption>}
    </figure>
  );
}
