/** Shared editorial introduction for the scenario-building workflow. */
export function debtScenarioExplainer() {
  const element = document.createElement("section");
  element.className = "debt-scenario-explainer debt-ratio-section";
  element.innerHTML = `<h2>Building a scenario</h2><p>The debt sustainability calculator takes into account many variables that may be customised to produce bespoke debt scenarios. These scenarios are built by setting a fiscal baseline, fine-tuning assumptions for spending and revenue and then adjusting economic and financing options for annual growth, inflation and interest rates.</p>`;
  return element;
}
