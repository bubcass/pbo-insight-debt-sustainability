import * as Plot from "npm:@observablehq/plot@0.6.17";
import {projectionComparisonChart} from "./debt-chart.js";
import {debtScenarioSetup, debtFineTuning} from "./debt-ratio-controls.js";
import {defaultScenario, readScenario, writeScenario} from "./scenario-state.js";
import {debtResetButton} from "./debt-reset-button.js";

// Each page supplies only its measure and editorial labels; the page structure
// itself is composed from the same reusable parts as the debt-ratio page.
const metrics = {
  "interest-spending": {title: "Interest spending", description: "Annual cost of servicing general government debt.", source: "interestSpending", unit: "€ billion", shift: 0.45, note: "Interest spending is affected by the level of debt and the assumed interest-rate path."},
  "primary-balance": {title: "Primary balance", description: "Revenue less primary expenditure, excluding interest spending.", source: "primaryBalance", unit: "% of GNI*", shift: -0.45, note: "The primary balance is the fiscal measure most directly affected by spending and revenue choices."},
  "government-balance": {title: "General government balance", description: "General government revenue less expenditure, including interest spending.", source: "governmentBalance", unit: "% of GNI*", shift: -0.35, note: "The general government balance combines the primary balance and interest spending."},
  "government-debt": {title: "General government debt", description: "The stock of general government debt in euro billions.", source: "governmentDebt", unit: "€ billion", shift: 8, note: "This view presents the level of debt alongside the published baseline."},
  "debt-dynamics": {title: "Debt dynamics", description: "Annual contributions that increase or reduce the debt-to-GNI* ratio.", unit: "percentage points", note: "Positive contributions increase the debt ratio; negative contributions reduce it."}
};

function isBaseline(model, controls) {
  const baseline = defaultScenario(model);
  return Object.keys(baseline).every((key) => controls[key] === baseline[key]);
}

function format(value, unit) {
  if (unit === "€ billion") return `€${value.toFixed(1)}bn`;
  if (unit === "percentage points") return `${value > 0 ? "+" : ""}${value.toFixed(1)} pp`;
  return `${value.toFixed(1)}%`;
}

function delta(value, unit) {
  if (Math.abs(value) < 0.05) return "Matches baseline";
  const signed = `${value > 0 ? "+" : "−"}${Math.abs(value).toFixed(1)}`;
  return unit === "€ billion" ? `${value > 0 ? "+" : "−"}€${Math.abs(value).toFixed(1)}bn versus baseline` : `${signed} pp versus baseline`;
}

function metricSeries(baseline, controls, config, model) {
  const start = model.years.indexOf(controls.changeStart);
  const end = Math.max(start, model.years.indexOf(controls.changeEnd));
  const pressure = controls.primarySpending * 0.45 - controls.revenue * 0.45 - controls.realGrowth * 0.55 + controls.inflation * 0.18 + controls.interestRate * 0.48;
  return baseline.map((value, index) => {
    if (index < start) return value;
    const progress = Math.min(1, (index - start + 1) / (end - start + 1));
    return +(value + pressure * config.shift * progress).toFixed(1);
  });
}

function summaryComponent(model, config) {
  const horizons = [["one", 2026, "1-year"], ["five", 2030, "5-year"], ["ten", 2035, "10-year"]]
    .map(([name, year, label]) => [name, Math.min(year, model.years.at(-1)), label]);
  const element = document.createElement("section");
  element.className = "tax-insight-callout tax-insight-callout--compact debt-at-a-glance debt-ratio-section";
  element.innerHTML = `<p class="tax-insight-callout__label">At a glance</p><h2>In this <span data-scenario>baseline</span> model, ${config.title.toLowerCase()} is projected to reach <span data-final></span> by ${model.years.at(-1)}.</h2><dl class="tax-insight-comparisons">${horizons.map(([name, year, label]) => `<div class="tax-insight-comparisons__item"><dt>${label} horizon (${year})</dt><dd class="tax-insight-comparisons__value" data-${name}></dd><dd class="tax-insight-comparisons__detail" data-${name}-delta></dd></div>`).join("")}</dl>`;
  return {
    element,
    update(series, baseline, preset) {
      horizons.forEach(([name, year]) => {
        const index = model.years.indexOf(year);
        element.querySelector(`[data-${name}]`).textContent = format(series[index], config.unit);
        element.querySelector(`[data-${name}-delta]`).textContent = delta(series[index] - baseline[index], config.unit);
      });
      element.querySelector("[data-scenario]").textContent = preset;
      element.querySelector("[data-final]").textContent = format(series.at(-1), config.unit);
    }
  };
}

function option(value, label) {
  return `<label class="segmented-control__option"><input type="radio" name="scenario-preset" value="${value}"><span>${label}</span></label>`;
}

function chartComponent(model, config, baseline, onPreset) {
  const element = document.createElement("section");
  element.className = "debt-chart debt-ratio-chart-panel";
  element.innerHTML = `<div class="debt-chart__heading"><div><h2>${config.title}</h2><p>${config.description}</p></div><strong class="debt-chart__difference" data-difference></strong></div><div class="debt-chart__legend debt-scenario-presets segmented-control" role="radiogroup" aria-label="Scenario presets">${option("baseline", "Baseline")}${option("adverse", "Adverse")}${option("custom", "Custom")}</div><div class="debt-chart__canvas"></div><p class="debt-analysis-chart__caption">${config.note}</p>`;
  const chart = projectionComparisonChart({
    years: model.years, baseline,
    valueLabel: () => `${config.title} (${config.unit})`,
    valueFormat: (value) => format(value, config.unit),
    yTickFormat: (value) => format(value, config.unit),
    differenceFormat: (value) => delta(value, config.unit),
    ariaLabel: `Interactive ${config.title.toLowerCase()} projection chart`
  });
  element.querySelector(".debt-chart__canvas").append(chart.element);
  element.querySelectorAll('input[name="scenario-preset"]').forEach((input) => input.addEventListener("change", () => input.checked && onPreset(input.value)));
  return {
    element,
    update(series, controls, preset) {
      element.querySelector("[data-difference]").textContent = delta(series.at(-1) - baseline.at(-1), config.unit).replace("versus baseline", `by ${model.years.at(-1)}`);
      element.querySelector(`[name="scenario-preset"][value="${preset}"]`).checked = true;
      chart.update(series, {scenarioStart: controls.changeStart, preset});
    },
    destroy() { chart.destroy(); }
  };
}

function dynamicsRows(model, controls = {}) {
  const start = model.years.indexOf(controls.changeStart ?? model.metadata.scenarioStart);
  const end = Math.max(start, model.years.indexOf(controls.changeEnd ?? model.years.at(-1)));
  return model.years.map((year, index) => {
    const progress = index < start ? 0 : Math.min(1, (index - start + 1) / (end - start + 1));
    const parts = {"Interest spending": 0.85 + Math.min(index, 8) * 0.06 + (controls.interestRate || 0) * 0.25 * progress, "Stock-flow adjustment": index < 5 ? 1.5 + index * 0.35 : 1.25, "Primary balance": -2.35 - Math.min(index, 5) * 0.04 + ((controls.primarySpending || 0) - (controls.revenue || 0)) * 0.24 * progress, Inflation: -1.45 + Math.min(index, 7) * 0.03 - (controls.inflation || 0) * 0.14 * progress, "Real growth": -2.55 + Math.min(index, 6) * 0.12 - (controls.realGrowth || 0) * 0.32 * progress};
    return {year, parts, net: +Object.values(parts).reduce((sum, value) => sum + value, 0).toFixed(1)};
  });
}

function dynamicsComponent(model) {
  const element = document.createElement("section");
  element.className = "debt-chart debt-ratio-chart-panel debt-dynamics-panel";
  element.innerHTML = `<div class="debt-chart__heading"><div><h2>Debt-to-GNI* dynamics</h2><p>Annual contributions to the change in the debt ratio.</p></div><strong class="debt-chart__difference">Illustrative decomposition</strong></div><div class="debt-dynamics-legend"></div><div class="debt-chart__canvas"></div><p class="debt-analysis-chart__caption">Positive contributions increase the debt ratio; negative contributions reduce it. The line shows the net annual change.</p>`;
  const colours = {"Interest spending": "#9a2c38", "Stock-flow adjustment": "#5c91bd", "Primary balance": "#aaa59d", Inflation: "#d0a12b", "Real growth": "#6f9e56"};
  element.querySelector(".debt-dynamics-legend").innerHTML = Object.entries(colours).map(([label, colour]) => `<span><i style="--swatch:${colour}"></i>${label}</span>`).join("") + '<span><i class="debt-dynamics-legend__line"></i>Net change</span>';
  let rows = [], renderedWidth = 0;
  const render = () => {
    if (!rows.length) return;
    const width = Math.max(320, Math.floor(element.clientWidth - 32));
    renderedWidth = width;
    const stacked = rows.flatMap((row) => Object.entries(row.parts).map(([component, value]) => ({year: row.year, component, value})));
    const plot = Plot.plot({width, height: width < 560 ? 310 : 405, marginLeft: 58, marginBottom: 46, x: {label: "Year", domain: model.years}, y: {label: "Annual change (percentage points)", grid: true}, color: {domain: Object.keys(colours), range: Object.values(colours)}, marks: [Plot.ruleY([0]), Plot.barY(stacked, Plot.stackY({x: "year", y: "value", fill: "component"})), Plot.lineY(rows, {x: "year", y: "net", stroke: "#6b1448", strokeWidth: 3}), Plot.dot(rows, {x: "year", y: "net", fill: "#6b1448", r: 3.5})]});
    element.querySelector(".debt-chart__canvas").replaceChildren(plot);
  };
  const observer = new ResizeObserver(() => { const width = Math.floor(element.clientWidth - 32); if (width && Math.abs(width - renderedWidth) > 1) render(); });
  observer.observe(element);
  return {element, update(nextRows) { rows = nextRows; render(); }, destroy() { observer.disconnect(); }};
}

/** A shared controller that retains the current scenario across every model. */
export function createDebtAnalysisExplorer(model, metricId) {
  const config = metrics[metricId];
  if (!config) throw new Error(`Unknown debt analysis metric: ${metricId}`);
  const controls = readScenario(model);
  const baseline = metricId === "debt-dynamics" ? dynamicsRows(model) : model.baseline[config.source];
  let preset = isBaseline(model, controls) ? "baseline" : "custom";
  let setup; let fineTuning; let summary; let chart; let resetControl;
  const update = () => {
    writeScenario(controls);
    setup.update(controls); fineTuning.update(controls);
    resetControl.update(isBaseline(model, controls));
    if (metricId === "debt-dynamics") {
      const rows = dynamicsRows(model, controls); const series = rows.map((row) => row.net); const base = baseline.map((row) => row.net);
      summary.update(series, base, preset); chart.update(rows);
    } else {
      const series = metricSeries(baseline, controls, config, model);
      summary.update(series, baseline, preset); chart.update(series, controls, preset);
    }
  };
  const setControl = (name, value) => { controls[name] = value; if (name === "changeStart" && value > controls.changeEnd) controls.changeEnd = value; if (name === "changeEnd" && value < controls.changeStart) controls.changeStart = value; preset = "custom"; update(); };
  const reset = () => { Object.assign(controls, defaultScenario(model)); preset = "baseline"; update(); };
  const selectPreset = (next) => { if (next === "baseline") return reset(); if (next === "adverse") Object.assign(controls, {primarySpending: 0.6, revenue: -0.4, realGrowth: -1.2, inflation: 0.4, interestRate: 0.8}); preset = next; update(); };
  setup = debtScenarioSetup(model, {onChange: setControl});
  fineTuning = debtFineTuning({onChange: setControl});
  summary = summaryComponent(model, config);
  chart = metricId === "debt-dynamics" ? dynamicsComponent(model) : chartComponent(model, config, baseline, selectPreset);
  resetControl = debtResetButton({onReset: reset});
  update();
  return {scenarioSetup: setup.element, atAGlance: summary.element, chart: chart.element, fineTuning: fineTuning.element, resetControl: resetControl.element, destroy() { chart.destroy(); }};
}

export function metricDownloadRows(model, metricId) {
  if (metricId === "debt-dynamics") return dynamicsRows(model).map((row) => ({Year: row.year, ...row.parts, "Net change (pp)": row.net}));
  const config = metrics[metricId];
  return model.years.map((year, index) => ({Year: year, [`${config.title} (${config.unit})`]: model.baseline[config.source][index]}));
}
