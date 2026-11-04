(() => {
  const labels = { letter: "아침편지", brief: "모닝브리프", magazine: "데일리픽" };
  const tabs = [...document.querySelectorAll("[data-variant]")];
  const frame = document.getElementById("mail-frame");
  window.AchimPreviewFrames.attach(frame);
  const narrow = window.matchMedia("(max-width: 700px)");
  function orientTabs() { document.querySelector("[role=tablist]").setAttribute("aria-orientation", narrow.matches ? "horizontal" : "vertical"); }
  orientTabs();
  narrow.addEventListener("change", orientTabs);
  function choose(variant) {
    if (!labels[variant]) return;
    for (const tab of tabs) {
      const selected = tab.dataset.variant === variant;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    }
    frame.src = `${variant}.html`;
    frame.title = `${labels[variant]} HTML 메일 미리보기`;
    document.getElementById("preview").setAttribute("aria-labelledby", `tab-${variant}`);
    document.getElementById("subject").textContent = `아침결 | ${labels[variant]} 디자인 미리보기`;
    document.getElementById("download").href = `${variant}.html`;
    document.getElementById("download").download = `achim-${variant}-preview.html`;
    document.getElementById("plaintext").href = `${variant}.txt`;
    document.getElementById("open-window").href = `${variant}.html`;
    try { history.replaceState(null, "", `?variant=${variant}`); } catch { /* Standalone file previews may disallow history updates. */ }
  }
  for (const [index, tab] of tabs.entries()) {
    tab.addEventListener("click", () => choose(tab.dataset.variant));
    tab.addEventListener("keydown", (event) => {
      let next;
      if (["ArrowRight", "ArrowDown"].includes(event.key)) next = (index + 1) % tabs.length;
      if (["ArrowLeft", "ArrowUp"].includes(event.key)) next = (index + tabs.length - 1) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); tabs[next].focus(); choose(tabs[next].dataset.variant); }
    });
  }
  for (const button of document.querySelectorAll("[data-width]")) {
    button.addEventListener("click", () => {
      frame.className = button.dataset.width;
      document.querySelectorAll("[data-width]").forEach((other) => other.setAttribute("aria-pressed", String(other === button)));
    });
  }
  choose(new URLSearchParams(location.search).get("variant") || "letter");
})();
