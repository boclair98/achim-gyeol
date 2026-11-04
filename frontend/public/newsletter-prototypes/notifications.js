(() => {
  const list = document.getElementById("notifications");
  const loading = document.getElementById("notification-loading");
  const error = document.getElementById("notification-error");
  const retry = document.getElementById("retry-notifications");
  async function load() {
    loading.hidden = false;
    error.hidden = true;
    retry.disabled = true;
    try {
      const data = await window.AchimPreviewData.load();
      document.getElementById("notification-date").textContent = `${data.dateLabel} · 보관판`;
      // One edition-level notification, never one notification per article.
      const entries = [data].map(edition => {
        const item = document.createElement("li");
        const link = document.createElement("a");
        link.className = "notification-card";
        link.href = `mail.html?date=${edition.briefingDate}`;
        const icon = document.createElement("img");
        icon.src = "edition-icon.svg";
        icon.alt = "";
        icon.width = 40;
        icon.height = 40;
        const content = document.createElement("span");
        content.className = "notification-content";
        const label = document.createElement("span");
        label.className = "notification-label";
        label.textContent = "아침결 · 뉴스 메일";
        const title = document.createElement("span");
        title.className = "notification-title";
        title.textContent = "아침결 한 통이 도착했어요";
        const description = document.createElement("span");
        description.className = "notification-description";
        description.textContent = `중요한 뉴스 ${edition.stories.length}개, 핵심부터 배경까지 한 번에 읽어보세요.`;
        content.append(label, title, description);
        link.append(icon, content);
        item.append(link);
        return item;
      });
      list.replaceChildren(...entries);
    } catch { error.hidden = false; }
    finally { loading.hidden = true; retry.disabled = false; }
  }
  retry.addEventListener("click", load);
  load();
})();
