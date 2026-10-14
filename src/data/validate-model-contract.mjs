import {readFile} from "node:fs/promises";

const input = JSON.parse(await readFile(new URL("./model-baseline.json", import.meta.url)));
const requiredSeries = ["debtRatioGniStar", "interestSpending", "primaryBalance", "governmentBalance", "governmentDebt"];

if (!Array.isArray(input.years) || input.years.length < 2) throw new Error("years must contain at least two projection years");
for (const name of requiredSeries) {
  const values = input.baseline?.[name];
  if (!Array.isArray(values) || values.length !== input.years.length || values.some((value) => !Number.isFinite(value))) {
    throw new Error(`baseline.${name} must be a numeric array matching years`);
  }
}
for (const name of ["realGrowth", "inflation", "interestRate"]) {
  const values = input.ratePaths?.[name];
  if (!Array.isArray(values) || values.length !== input.years.length || values.some((value) => !Number.isFinite(value))) {
    throw new Error(`ratePaths.${name} must be a numeric array matching years`);
  }
}
if (!Number.isInteger(input.metadata?.scenarioStart) || !input.years.includes(input.metadata.scenarioStart)) {
  throw new Error("metadata.scenarioStart must be one of the projection years");
}
console.log("Debt sustainability model contract is valid.");
