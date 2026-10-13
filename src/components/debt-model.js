const sensitivityWeights = {
  primarySpending: 0.7,
  revenue: -0.7,
  realGrowth: -0.95,
  inflation: -0.3,
  interestRate: 0.85
};

export function scenarioSeries(model, controls) {
  const baseline = model.baseline.debtRatioGniStar;
  const scenarioStart = controls.changeStart ?? model.metadata.scenarioStart;
  const scenarioEnd = controls.changeEnd ?? model.years.at(-1);
  const scenarioStartIndex = model.years.indexOf(scenarioStart);
  const scenarioEndIndex = Math.max(scenarioStartIndex, model.years.indexOf(scenarioEnd));
  const combinedShift = Object.entries(sensitivityWeights)
    .reduce((sum, [name, weight]) => sum + (Number(controls[name]) || 0) * weight, 0);

  // Illustrative layout adapter only. Replace with model-supplied scenario output.
  return baseline.map((value, index) => {
    if (index < scenarioStartIndex) return value;
    const progress = Math.min(1, (index - scenarioStartIndex + 1) / (scenarioEndIndex - scenarioStartIndex + 1));
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
