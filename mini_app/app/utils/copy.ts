export async function copyTextToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const ta = document.createElement("textarea");
  ta.value = text;
  ta.readOnly = true;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  ta.style.pointerEvents = "none";
  document.body.appendChild(ta);

  const sel = document.getSelection();
  const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;

  ta.select();
  ta.setSelectionRange(0, ta.value.length);

  let ok = false;
    try {
    // @ts-ignore
    ok = document.execCommand && document.execCommand("copy");
  } finally {
    document.body.removeChild(ta);
    if (range && sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  if (!ok) throw new Error("Copy is not supported in this environment");
  return true;
}