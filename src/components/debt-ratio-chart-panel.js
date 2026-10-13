import {debtRatioChart} from "./debt-chart.js";

function option(value, label) {
  return `<label class="segmented-control__option"><input type="radio" name="scenario-preset" value="${value}"><span>${label}</span></label>`;
}

/** Chart frame and interactive legend, composed around the reusable Plot chart. */
export function debtRatioChartPanel(model, {onPreset}) {
  const element = document.createElement("section");
  element.className = "debt-chart debt-ratio-chart-panel";
  element.innerHTML = `<div class="debt-chart__heading"><div><h2>Debt-to-<span data-denominator-label>GNI*</span> ratio</h2><p>General government debt as a share of <span data-denominator-copy>modified GNI*</span></p></div><strong class="debt-chart__difference" data-chart-difference>Matches baseline in ${model.years.at(-1)}</strong></div>
    <div class="debt-chart__legend debt-scenario-presets segmented-control" role="radiogroup" aria-label="Scenario presets">${option("baseline", "Baseline")}${option("adverse", "Adverse")}${option("custom", "Custom")}</div>
    <div class="debt-chart__canvas"></div>`;
  const chart = debtRatioChart(model);
  element.querySelector(".debt-chart__canvas").append(chart.element);
  element.querySelectorAll('input[name="scenario-preset"]').forEach((input) => input.addEventListener("change", () => {
    if (input.checked) onPreset(input.value);
  }));

  return {
    element,
    update({series, scenarioStart, denominatorLabel, preset, comparison}) {
      element.querySelector("[data-denominator-label]").textContent = denominatorLabel;
      element.querySelector("[data-denominator-copy]").textContent = denominatorLabel === "GDP" ? "GDP" : "modified GNI*";
      element.querySelector("[data-chart-difference]").textContent = comparison;
      element.querySelector(`[name="scenario-preset"][value="${preset}"]`).checked = true;
      chart.update(series, {scenarioStart, denominatorLabel, preset});
    },
    destroy() {
      chart.destroy();
    }
  };
}
