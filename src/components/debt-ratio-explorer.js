import {scenarioSeries, metricSummary} from "./debt-model.js";
import {defaultScenario, readScenario, writeScenario} from "./scenario-state.js";
import {debtScenarioSetup, debtFineTuning} from "./debt-ratio-controls.js";
import {debtRatioSummary} from "./debt-ratio-summary.js";
import {debtRatioChartPanel} from "./debt-ratio-chart-panel.js";
import {debtResetButton} from "./debt-reset-button.js";

function isBaseline(model, controls) {
  const baseline = defaultScenario(model);
  return Object.keys(baseline).every((key) => controls[key] === baseline[key]);
}

function comparisonText(model, series) {
  const finalDifference = series.at(-1) - model.baseline.debtRatioGniStar.at(-1);
  if (Math.abs(finalDifference) < 0.05) return `Matches baseline in ${model.years.at(-1)}`;
  return `${Math.abs(finalDifference).toFixed(1)} pp ${finalDifference > 0 ? "above" : "below"} baseline by ${model.years.at(-1)}`;
}

/**
 * Shared state coordinator for the debt-ratio page. The page mounts its
 * independently reusable elements in editorial order rather than a dashboard.
 */
export function createDebtRatioExplorer(model) {
  const controls = readScenario(model);
  let preset = isBaseline(model, controls) ? "baseline" : "custom";
  let setup;
  let summary;
  let chart;
  let fineTuning;
  let resetControl;

  const update = () => {
    const series = scenarioSeries(model, controls);
    const denominatorLabel = controls.denominator === "gdp" ? "GDP" : "GNI*";
    writeScenario(controls);
    setup.update(controls);
    fineTuning.update(controls);
    summary.update({series, summary: metricSummary(model, series), preset});
    chart.update({
      series,
      scenarioStart: controls.changeStart,
      denominatorLabel,
      preset,
      comparison: comparisonText(model, series)
    });
    resetControl.update(isBaseline(model, controls));
  };

  const setControl = (name, value) => {
    controls[name] = value;
    if (name === "changeStart" && controls.changeStart > controls.changeEnd) controls.changeEnd = controls.changeStart;
    if (name === "changeEnd" && controls.changeEnd < controls.changeStart) controls.changeStart = controls.changeEnd;
    preset = "custom";
    update();
  };

  const resetToBaseline = () => {
    Object.assign(controls, defaultScenario(model));
    preset = "baseline";
    update();
  };

  const selectPreset = (nextPreset) => {
    if (nextPreset === "baseline") return resetToBaseline();
    if (nextPreset === "adverse") {
      Object.assign(controls, {primarySpending: 0.6, revenue: -0.4, realGrowth: -1.2, inflation: 0.4, interestRate: 0.8});
    }
    preset = nextPreset;
    update();
  };

  setup = debtScenarioSetup(model, {onChange: setControl});
  fineTuning = debtFineTuning({onChange: setControl});
  summary = debtRatioSummary(model);
  chart = debtRatioChartPanel(model, {onPreset: selectPreset});
  resetControl = debtResetButton({onReset: resetToBaseline});
  update();

  return {
    scenarioSetup: setup.element,
    atAGlance: summary.element,
    chart: chart.element,
    fineTuning: fineTuning.element,
    resetControl: resetControl.element,
    destroy() { chart.destroy(); },
    controls: {set: setControl, reset: resetToBaseline}
  };
}
