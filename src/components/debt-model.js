// Fiscal inputs represent relative deviations from the baseline path. Rate
// inputs are direct annual percentage rates; these placeholder elasticities
// translate percentage-point changes into debt-ratio points until the approved
// model supplies its own scenario outputs.
const sensitivityWeights = {
  primarySpending: 6,
  revenue: -6,
  realGrowth: -1.7,
  inflation: -0.7,
  interestRate: 1.4
};

export function scenarioSeries(model, controls) {
  const baseline = model.baseline.debtRatioGniStar;
  const scenarioStart = controls.changeStart ?? model.metadata.scenarioStart;
  const scenarioEnd = controls.changeEnd ?? model.years.at(-1);
  const scenarioStartIndex = model.years.indexOf(scenarioStart);
  const scenarioEndIndex = Math.max(scenarioStartIndex, model.years.indexOf(scenarioEnd));
  // Illustrative layout adapter only. Replace with model-supplied scenario output.
  return baseline.map((value, index) => {
    if (index < scenarioStartIndex) return value;
    const progress = Math.min(1, (index - scenarioStartIndex + 1) / (scenarioEndIndex - scenarioStartIndex + 1));
    const fiscalShift = ((Number(controls.primarySpending) || 0) / 100) * sensitivityWeights.primarySpending
      + ((Number(controls.revenue) || 0) / 100) * sensitivityWeights.revenue;
    const rateShift = ["realGrowth", "inflation", "interestRate"].reduce((sum, name) => {
      const scenarioRate = controls[name];
      const baselineRate = model.ratePaths[name][index];
      return sum + (Number.isFinite(scenarioRate) ? scenarioRate - baselineRate : 0) * sensitivityWeights[name];
    }, 0);
    const combinedShift = fiscalShift + rateShift;
    return +(value + combinedShift * progress).toFixed(1);
  });
}

export function metricSummary(model, series) {
  const {years} = model;
  const peak = Math.max(...series);
  const peakYear = years[series.indexOf(peak)];
  const firstBelow50 = years.find((year, index) => index >= model.years.indexOf(model.metadata.scenarioStart) && series[index] < 50);
  return {finalDebt: series.at(-1), peak, peakYear, firstBelow50};
}
