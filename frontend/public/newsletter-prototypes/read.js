(() => {
  const frame = document.getElementById("article-frame");
  const errorBox = document.getElementById("reader-error");
  const notice = document.getElementById("article-notice");
  const buttons = [...document.querySelectorAll("[data-step]")];
  const copyButton = document.getElementById("copy-link");
  let stories = [];
  let selected = 0;
  let focusAfterLoad = false;
  window.AchimPreviewFrames.attach(frame);

  function fail(message) {
    document.getElementById("reader-error-text").textContent = message;
    errorBox.hidden = false;
    frame.hidden = true;
    copyButton.disabled = true;
    buttons.forEach(button => { button.disabled = true; });
    document.querySelectorAll("[data-count]").forEach(element => { element.textContent = "불러오기 실패"; });
  }

  function choose(index, push = false, focus = false) {
    if (!Number.isInteger(index) || index < 0 || index >= stories.length) return;
    selected = index;
    const story = stories[index];
    errorBox.hidden = true;
    frame.hidden = false;
    copyButton.disabled = false;
    document.querySelector(".copy-feedback").hidden = true;
    document.getElementById("manual-copy").hidden = true;
    focusAfterLoad = focus;
    frame.title = `${story.title} · 기사 전체 읽기`;
    frame.dataset.storyFile = story.file;
    document.getElementById("standalone").href = story.file;
    document.title = `아침결 | ${story.title}`;
    document.querySelectorAll("[data-count]").forEach(element => { element.textContent = `${index + 1} / ${stories.length} · ${story.category}`; });
    buttons.forEach(button => { button.disabled = index + Number(button.dataset.step) < 0 || index + Number(button.dataset.step) >= stories.length; });
    const url = new URL(location.href);
    url.searchParams.set("story", String(story.id));
    try { history[push ? "pushState" : "replaceState"]({ story: story.id }, "", url); } catch { /* File viewers may block history changes. */ }
    // Only the reader owns history. Changing iframe.src would add a second
    // subframe entry and make Back appear to stay on the same article.
    try { frame.contentWindow.location.replace(new URL(story.file, location.href).href); }
    catch { frame.src = story.file; }
  }

  function chooseFromUrl(focus = false) {
    const id = new URLSearchParams(location.search).get("story");
    const index = stories.findIndex(story => String(story.id) === id);
    notice.hidden = !id || index >= 0;
    notice.textContent = "요청한 기사가 없어 첫 번째 보관 기사를 보여드려요.";
    choose(index >= 0 ? index : 0, false, focus);
  }

  frame.addEventListener("load", () => {
    if (!stories.length) return;
    try {
      const doc = frame.contentDocument;
      if (!doc || !new URL(doc.URL).pathname.endsWith(stories[selected].file)) return;
      const heading = doc.querySelector("h1");
      if (!heading) { fail("기사 화면을 불러오지 못했어요. 다시 시도하거나 전체 메일을 열어주세요."); return; }
      if (focusAfterLoad) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
        window.scrollTo(0, 0);
        focusAfterLoad = false;
      }
    } catch { /* The full-page link remains available in restricted file viewers. */ }
  });

  async function load() {
    try {
      const data = await window.AchimPreviewData.load();
      stories = data.stories;
      chooseFromUrl();
    } catch {
      fail("기사를 불러오지 못했어요. 다시 시도하거나 전체 메일에서 읽어주세요.");
    }
  }
  copyButton.addEventListener("click", async () => {
    const url = location.href;
    const storyId = stories[selected]?.id;
    let copied = false;
    try {
      if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(url); copied = true; }
    } catch { /* Permission denied or insecure context: offer manual copying. */ }
    if (storyId !== stories[selected]?.id || location.href !== url) return;
    document.querySelector(".copy-feedback").hidden = false;
    document.getElementById("copy-status").textContent = copied ? "이 기사 링크를 복사했어요." : "자동 복사가 지원되지 않아 링크를 표시했어요.";
    document.getElementById("manual-copy").hidden = copied;
    if (!copied) {
      const input = document.getElementById("article-url");
      input.value = url;
      input.focus();
      input.select();
    }
  });
  buttons.forEach(button => button.addEventListener("click", () => choose(selected + Number(button.dataset.step), true, true)));
  window.addEventListener("popstate", () => { if (stories.length) chooseFromUrl(true); });
  document.getElementById("retry").addEventListener("click", load);
  load();
})();
