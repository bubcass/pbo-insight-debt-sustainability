import * as Inputs from "npm:@observablehq/inputs@0.12.0";

function slider(config) {
  return Inputs.range([config.min, config.max], {
    label: config.label,
    value: config.baseline,
    step: 0.1,
    format: (value) => (value > 0 ? "+" : "") + value.toFixed(1) + " " + config.unit
  });
}

export function scenarioControls(assumptions) {
  const controls = {
    denominator: Inputs.select(assumptions.denominator, {label: "Debt ratio denominator", value: assumptions.denominator[0]}),
    includeWindfallCt: Inputs.toggle({label: "Include windfall corporation tax", value: true}),
    primarySpending: slider(assumptions.primarySpending),
    revenue: slider(assumptions.revenue),
    realGrowth: slider(assumptions.realGrowth),
    inflation: slider(assumptions.inflation),
    interestRate: slider(assumptions.interestRate)
  };
  return Inputs.form(controls, {
    template: (input) => {
      const form = document.createElement("div");
      form.className = "debt-assumptions";
      form.innerHTML = '<p class="debt-assumptions__title">Scenario assumptions</p>';
      for (const [title, names] of [
        ["Scope and treatment", ["denominator", "includeWindfallCt"]],
        ["Fiscal assumptions", ["primarySpending", "revenue"]],
        ["Economic and financing", ["realGrowth", "inflation", "interestRate"]]
      ]) {
        const section = document.createElement("section");
        section.className = "debt-assumptions__group";
        section.innerHTML = "<h2>" + title + "</h2>";
        names.forEach((name) => section.append(input[name]));
        form.append(section);
      }
      return form;
    }
  });
}
