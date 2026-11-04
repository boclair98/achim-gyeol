// Same-origin preview infrastructure only. Mail HTML itself has no scripts.
(() => {
  function attach(frame) {
    let observer;
    let currentDocument;
    function measure() {
      try {
        if (!currentDocument?.body || frame.contentDocument !== currentDocument) return;
        const height = Math.ceil(currentDocument.body.getBoundingClientRect().height) + 2;
        if (Math.abs(frame.clientHeight - height) > 1) frame.style.height = `${height}px`;
      } catch { /* Native iframe scrolling and full-page links remain available. */ }
    }
    function connect() {
      observer?.disconnect();
      try {
        currentDocument = frame.contentDocument;
        if (!currentDocument?.body) return;
        measure();
        observer = new ResizeObserver(measure);
        observer.observe(currentDocument.body);
        for (const image of currentDocument.images) {
          image.addEventListener("load", measure, { once: true });
          image.addEventListener("error", measure, { once: true });
        }
        currentDocument.fonts.ready.then(measure);
      } catch {
        frame.style.height = "980px";
      }
    }
    frame.addEventListener("load", connect);
    window.addEventListener("resize", measure);
    try {
      if (frame.contentDocument?.readyState === "complete") connect();
    } catch { frame.style.height = "980px"; }
  }
  window.AchimPreviewFrames = { attach };
})();
