function checkpointMarkup(label, selector) {
  return `<div class="tax-insight-comparisons__item"><dt>${label}</dt><dd class="tax-insight-comparisons__value" data-${selector}></dd><dd class="tax-insight-comparisons__detail" data-${selector}-delta></dd></div>`;
}

function differenceText(difference) {
  if (Math.abs(difference) < 0.05) return "Matches baseline";
  return `${Math.abs(difference).toFixed(1)} pp ${difference > 0 ? "above" : "below"} baseline`;
}

/** A reusable At a glance component for a projected debt ratio series. */
export function debtRatioSummary(model) {
  const oneYear = Math.min(model.metadata.projectionStart + 1, model.years.at(-1));
  const fiveYear = Math.min(model.metadata.projectionStart + 5, model.years.at(-1));
  const tenYear = Math.min(model.metadata.projectionStart + 10, model.years.at(-1));
  const element = document.createElement("section");
  element.className = "tax-insight-callout tax-insight-callout--compact debt-at-a-glance debt-ratio-section";
  element.setAttribute("aria-labelledby", "debt-at-a-glance");
  element.innerHTML = `<p class="tax-insight-callout__label">At a glance</p>
    <h2 id="debt-at-a-glance">In this <span data-scenario-description>baseline</span> model, the debt ratio is projected to reach <span data-final-heading></span> by ${model.years.at(-1)} and fall below 50% in <span data-below-heading></span>.</h2>
    <dl class="tax-insight-comparisons">${checkpointMarkup(`1-year horizon (${oneYear})`, "one")}${checkpointMarkup(`5-year horizon (${fiveYear})`, "five")}${checkpointMarkup(`10-year horizon (${tenYear})`, "ten")}</dl>`;

  const updateCheckpoint = (year, selector, series) => {
    const index = model.years.indexOf(year);
    const difference = series[index] - model.baseline.debtRatioGniStar[index];
    element.querySelector(`[data-${selector}]`).textContent = `${series[index].toFixed(1)}%`;
    element.querySelector(`[data-${selector}-delta]`).textContent = differenceText(difference);
  };

  return {
    element,
    update({series, summary, preset}) {
      updateCheckpoint(oneYear, "one", series);
      updateCheckpoint(fiveYear, "five", series);
      updateCheckpoint(tenYear, "ten", series);
      element.querySelector("[data-final-heading]").textContent = `${summary.finalDebt.toFixed(1)}%`;
      element.querySelector("[data-below-heading]").textContent = summary.firstBelow50 || "the end of the projection";
      element.querySelector("[data-scenario-description]").textContent = preset;
    }
  };
}
