const storageKey = "pbo-debt-sustainability-scenario-v2";
const fields = ["primarySpending", "revenue", "realGrowth", "inflation", "interestRate", "changeStart", "changeEnd", "denominator", "windfall"];

export function defaultScenario(model) {
  // A null rate means retain the illustrative baseline path rather than
  // imposing one constant rate over the selected period.
  return {primarySpending: 0, revenue: 0, realGrowth: null, inflation: null, interestRate: null, changeStart: model.metadata.scenarioStart, changeEnd: model.years.at(-1), denominator: "gni-star", windfall: "include"};
}

export function readScenario(model) {
  const fallback = defaultScenario(model);
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) || "{}");
    for (const field of fields) if (field in saved) fallback[field] = saved[field];
  } catch { /* A fresh scenario is safe when storage is unavailable. */ }
  return fallback;
}

export function writeScenario(controls) {
  try {
    const saved = Object.fromEntries(fields.map((field) => [field, controls[field]]));
    sessionStorage.setItem(storageKey, JSON.stringify(saved));
  } catch { /* Keep the calculator usable if browser storage is unavailable. */ }
}
