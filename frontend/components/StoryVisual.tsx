"use client";

import { useState } from "react";
import type { Story } from "@/lib/briefing";

export function StoryVisual({ story, variant = "card" }: { story: Story; variant?: "card" | "article" | "row" | "hero" }) {
  const [failed, setFailed] = useState(false);
  if (!story.imageUrl || failed) return null;

  return (
    <figure className={`story-visual story-visual-${variant}`}>
      {/* Remote news domains vary daily, so the verified source URL is rendered without Next image-host restrictions. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={story.imageUrl}
        alt={`${story.title} 관련 기사 대표 이미지`}
        loading={variant === "hero" ? "eager" : "lazy"}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
      {variant !== "hero" && <figcaption><span>{story.category}</span>{story.imagePublisher ? `${story.imagePublisher} 기사 이미지` : "기사 대표 이미지"}</figcaption>}
    </figure>
  );
}
