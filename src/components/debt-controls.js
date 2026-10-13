import * as Inputs from "npm:@observablehq/inputs@0.12.0";

export function sliderControl(config) {
  return Inputs.range([config.min, config.max], {
    label: config.label,
    value: config.baseline,
    step: 0.1,
    format: (value) => `${value > 0 ? "+" : ""}${value.toFixed(1)} ${config.unit}`
  });
}

export function treatmentControls(denominator) {
  return Inputs.select(denominator, {
    label: "Debt ratio denominator",
    value: denominator[0]
  });
}
