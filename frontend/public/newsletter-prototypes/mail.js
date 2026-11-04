// A single full email preview, not a mailbox provider or a send integration.
(() => {
  const frame = document.getElementById("mail-body");
  const bodyError = document.getElementById("mail-body-error");
  const metadataError = document.getElementById("mail-metadata-error");
  const retryMetadata = document.getElementById("retry-mail-metadata");
  window.AchimPreviewFrames.attach(frame);
  function inspectBody() {
    try {
      const doc = frame.contentDocument;
      if (!doc || doc.URL === "about:blank") return;
      bodyError.hidden = Boolean(doc.querySelector("[data-story-id]"));
    } catch { bodyError.hidden = false; }
  }
  frame.addEventListener("load", inspectBody);
  if (frame.contentDocument?.readyState === "complete" && frame.contentDocument.URL !== "about:blank") inspectBody();
  document.getElementById("retry-mail-body").addEventListener("click", () => {
    bodyError.hidden = true;
    try { frame.contentWindow.location.replace(new URL("letter.html", location.href).href); }
    catch { frame.src = "letter.html"; }
  });
  async function loadMetadata() {
    retryMetadata.disabled = true;
    metadataError.hidden = true;
    try {
      const data = await window.AchimPreviewData.load();
      document.getElementById("mail-subject").textContent = `${data.dateLabel} 아침결`;
      document.getElementById("mail-date").textContent = `${data.dateLabel} 보관판 · 뉴스 ${data.stories.length}개`;
      document.title = `아침결 | ${data.dateLabel} 전체 뉴스 메일`;
      const url = new URL(location.href);
      const requested = url.searchParams.get("date");
      const notice = document.getElementById("mail-date-notice");
      notice.hidden = !requested || requested === data.briefingDate;
      notice.textContent = `요청한 날짜의 메일이 없어 ${data.dateLabel} 보관판을 보여드려요.`;
      url.searchParams.set("date", data.briefingDate);
      try { history.replaceState(null, "", url); } catch { /* Restricted file viewers retain the full-mail fallback. */ }
    } catch { metadataError.hidden = false; }
    finally { retryMetadata.disabled = false; }
  }
  retryMetadata.addEventListener("click", loadMetadata);
  loadMetadata();
})();
