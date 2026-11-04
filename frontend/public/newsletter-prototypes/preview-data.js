// Static archive metadata only. Never reads subscribers or calls an application API.
window.AchimPreviewData = {
  async load() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch("reader-manifest.json", { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error("manifest unavailable");
      const data = await response.json();
      if (data.preview !== true || typeof data.dateLabel !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data.briefingDate) || !Array.isArray(data.stories) || !data.stories.length || data.stories.length > 15 || new Set(data.stories.map(story => story?.id)).size !== data.stories.length || !data.stories.every(story => Number.isSafeInteger(story?.id) && story.id > 0 && typeof story.title === "string" && story.title.trim() && typeof story.category === "string" && story.file === `story-${story.id}.html`)) throw new Error("invalid manifest");
      return data;
    } finally { clearTimeout(timeout); }
  },
};
