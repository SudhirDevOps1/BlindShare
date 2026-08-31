/**
 * Anti-leak and screenshot deterrent utility.
 * Intercepts common screenshot shortcuts and window blur events to activate a temporary privacy overlay.
 */

export function setupAntiLeakListeners(onTriggerBlur: (active: boolean) => void): () => void {
  if (typeof window === "undefined") return () => {};

  let blurTimeout: NodeJS.Timeout | null = null;

  const triggerTemporaryBlur = (durationMs = 2500) => {
    onTriggerBlur(true);
    if (blurTimeout) clearTimeout(blurTimeout);
    blurTimeout = setTimeout(() => {
      onTriggerBlur(false);
    }, durationMs);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // PrintScreen
    if (e.key === "PrintScreen" || e.keyCode === 44) {
      triggerTemporaryBlur(3000);
    }
    // Windows Snipping Tool (Win+Shift+S) or Mac screenshot (Cmd+Shift+3/4/5)
    if (
      (e.metaKey || e.ctrlKey) &&
      e.shiftKey &&
      (e.key === "S" || e.key === "s" || e.key === "3" || e.key === "4" || e.key === "5")
    ) {
      triggerTemporaryBlur(3000);
    }
    // Ctrl+P / Cmd+P (Print)
    if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
      e.preventDefault();
      triggerTemporaryBlur(3000);
    }
  };

  const handleBeforePrint = () => {
    onTriggerBlur(true);
  };

  const handleAfterPrint = () => {
    onTriggerBlur(false);
  };

  const handleWindowBlur = () => {
    // Activate privacy blur when user switches windows / focuses on snipping tool
    onTriggerBlur(true);
  };

  const handleWindowFocus = () => {
    onTriggerBlur(false);
  };

  const handleContextMenu = (e: MouseEvent) => {
    // Prevent right-click save image on secure viewer
    e.preventDefault();
  };

  window.addEventListener("keydown", handleKeyDown, { capture: true });
  window.addEventListener("beforeprint", handleBeforePrint);
  window.addEventListener("afterprint", handleAfterPrint);
  window.addEventListener("blur", handleWindowBlur);
  window.addEventListener("focus", handleWindowFocus);
  document.addEventListener("contextmenu", handleContextMenu);

  return () => {
    window.removeEventListener("keydown", handleKeyDown, { capture: true });
    window.removeEventListener("beforeprint", handleBeforePrint);
    window.removeEventListener("afterprint", handleAfterPrint);
    window.removeEventListener("blur", handleWindowBlur);
    window.removeEventListener("focus", handleWindowFocus);
    document.removeEventListener("contextmenu", handleContextMenu);
    if (blurTimeout) clearTimeout(blurTimeout);
  };
}
