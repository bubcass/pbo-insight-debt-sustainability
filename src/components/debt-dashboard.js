import {createDebtRatioExplorer} from "./debt-ratio-explorer.js";

// Compatibility adapter for any external embed still importing the original
// dashboard entry point. The Observable page itself composes the four parts.
export function debtDashboard(model) {
  const explorer = createDebtRatioExplorer(model);
  const element = document.createElement("section");
  element.className = "debt-dashboard";
  element.append(explorer.scenarioSetup, explorer.atAGlance, explorer.chart, explorer.fineTuning);
  element.destroy = () => explorer.destroy();
  return element;
}
