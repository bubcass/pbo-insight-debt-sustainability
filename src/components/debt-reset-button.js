/**
 * Page-level reset action. It uses the same fixed, companion-button pattern as
 * Constituency Insights' clear-district action, without repeating reset UI in
 * individual calculator sections.
 */
export function debtResetButton({onReset}) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = "debt-reset-floating";
  element.hidden = true;
  element.setAttribute("aria-label", "Reset the debt sustainability scenario to baseline");
  element.innerHTML = '<span class="debt-reset-floating__icon" aria-hidden="true">×</span><span>Reset to baseline</span>';
  element.addEventListener("click", onReset);
  return {
    element,
    update(isBaseline) { element.hidden = isBaseline; }
  };
}
