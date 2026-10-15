function sliderMarkup(id, label) {
  return `<label class="debt-control" for="${id}">
    <span>${label}</span><output>0%</output>
    <input id="${id}" type="range" min="-50" max="50" step="1" value="0">
    <small>−50% <i></i> +50%</small>
  </label>`;
}

function formatRate(value) {
  return `${Number(value).toFixed(1)}%`;
}

function rateMarkup(model, id) {
  const assumption = model.assumptions[id];
  const baselineAtScenarioStart = model.ratePaths[id][model.years.indexOf(model.metadata.scenarioStart)];
  return `<fieldset class="debt-rate-control" data-rate-control="${id}">
    <legend>${assumption.label}</legend>
    <div class="debt-rate-control__header"><span>Scenario rate</span><output data-rate-value>Baseline path</output></div>
    <div class="debt-rate-control__inputs">
      <input class="debt-rate-control__range" id="${id}" aria-label="${assumption.label} scenario rate" type="range" min="${assumption.min}" max="${assumption.max}" step="${assumption.step}" value="${baselineAtScenarioStart}">
      <span class="debt-rate-control__number-wrap"><input class="debt-rate-control__number" data-rate-number="${id}" aria-label="${assumption.label} scenario rate" type="number" inputmode="decimal" min="${assumption.min}" max="${assumption.max}" step="${assumption.step}" placeholder="—"><span>%</span></span>
    </div>
    <small data-rate-baseline></small>
  </fieldset>`;
}

function option(name, value, label) {
  return `<label class="segmented-control__option"><input type="radio" name="${name}" value="${value}"><span>${label}</span></label>`;
}

function signed(value) {
  return `${value > 0 ? "+" : ""}${Number(value).toFixed(0)}%`;
}

function quickFiscalMarkup(id, label) {
  return `<label class="debt-chart-control" for="quick-${id}">
    <span><b>${label}</b><output data-quick-value="${id}">0%</output></span>
    <input id="quick-${id}" data-quick-range="${id}" type="range" min="-50" max="50" step="1" value="0">
    <small>−50% <i></i> +50%</small>
  </label>`;
}

function quickRateMarkup(model, id) {
  const assumption = model.assumptions[id];
  return `<label class="debt-chart-control debt-chart-control--rate" for="quick-${id}">
    <span><b>${assumption.label}</b><output data-quick-value="${id}">Baseline path</output></span>
    <div><input id="quick-${id}" data-quick-range="${id}" type="range" min="${assumption.min}" max="${assumption.max}" step="${assumption.step}"><input data-quick-number="${id}" aria-label="${assumption.label} scenario rate" type="number" inputmode="decimal" min="${assumption.min}" max="${assumption.max}" step="${assumption.step}" placeholder="—"><em>%</em></div>
  </label>`;
}

function accordionHeading(id, title, description) {
  return `<summary class="debt-scenario-accordion__summary"><span><h3 id="${id}">${title}</h3><p>${description}</p></span><span class="debt-scenario-accordion__icon" aria-hidden="true"></span></summary>`;
}

function keepOneScenarioStageOpen(element) {
  const stages = [...element.querySelectorAll("details.debt-scenario-accordion__stage")];
  for (const stage of stages) {
    stage.addEventListener("toggle", () => {
      if (!stage.open) return;
      for (const otherStage of document.querySelectorAll("details.debt-scenario-accordion__stage")) {
        if (otherStage !== stage) otherStage.open = false;
      }
    });
  }
}

/** Compact scenario controls that let readers adjust the chart without leaving it. */
export function debtChartQuickControls(model, {onChange}) {
  const element = document.createElement("section");
  element.className = "debt-chart__quick-controls";
  element.setAttribute("aria-label", "Quick scenario adjustments");
  element.innerHTML = `<div class="debt-chart__quick-controls-heading"><strong>Quick adjustments</strong><span>Changes update the chart immediately</span></div><div class="debt-chart__quick-controls-grid">${quickFiscalMarkup("primarySpending", "Primary spending")}${quickFiscalMarkup("revenue", "Revenue")}${quickRateMarkup(model, "realGrowth")}${quickRateMarkup(model, "inflation")}${quickRateMarkup(model, "interestRate")}</div>`;

  for (const name of ["primarySpending", "revenue", "realGrowth", "inflation", "interestRate"]) {
    const range = element.querySelector(`[data-quick-range="${name}"]`);
    range.addEventListener("input", () => onChange(name, Number(range.value)));
  }
  for (const name of ["realGrowth", "inflation", "interestRate"]) {
    const number = element.querySelector(`[data-quick-number="${name}"]`);
    number.addEventListener("input", () => {
      if (number.value === "") return onChange(name, null);
      const assumption = model.assumptions[name];
      const value = Number(number.value);
      if (Number.isFinite(value)) onChange(name, Math.min(assumption.max, Math.max(assumption.min, value)));
    });
  }

  return {
    element,
    update(controls) {
      for (const name of ["primarySpending", "revenue"]) {
        element.querySelector(`[data-quick-range="${name}"]`).value = controls[name];
        element.querySelector(`[data-quick-value="${name}"]`).textContent = signed(controls[name]);
      }
      const start = model.years.indexOf(controls.changeStart);
      for (const name of ["realGrowth", "inflation", "interestRate"]) {
        const range = element.querySelector(`[data-quick-range="${name}"]`);
        const number = element.querySelector(`[data-quick-number="${name}"]`);
        const value = controls[name];
        range.value = Number.isFinite(value) ? value : model.ratePaths[name][start];
        number.value = Number.isFinite(value) ? value.toFixed(1) : "";
        element.querySelector(`[data-quick-value="${name}"]`).textContent = Number.isFinite(value) ? formatRate(value) : "Baseline path";
      }
    }
  };
}

/** High-level scenario treatments, kept independently mountable in page flow. */
export function debtScenarioSetup(model, {onChange}) {
  const element = document.createElement("section");
  element.className = "debt-workspace debt-ratio-section debt-ratio-section--setup debt-scenario-accordion";
  element.innerHTML = `<details class="debt-scenario-accordion__stage" open>
    ${accordionHeading("baseline-stage-title", "1. Start with a baseline", "Choose the debt ratio denominator, windfall corporation tax treatment and period in which changes apply.")}
    <div class="debt-scenario-accordion__content">
    <form class="debt-assumptions">
      <section class="debt-assumptions__group debt-scenario-setup">
        <div class="debt-choice"><span>Debt ratio denominator</span><div class="segmented-control" role="radiogroup" aria-label="Debt ratio denominator">${option("denominator", "gni-star", "GNI*")}${option("denominator", "gdp", "GDP")}</div></div>
        <div class="debt-choice"><span>Windfall corporation tax</span><div class="segmented-control" role="radiogroup" aria-label="Windfall corporation tax treatment">${option("windfall", "include", "Include")}${option("windfall", "exclude", "Exclude")}</div></div>
        <div class="debt-timing"><span>Period of change <output data-period-summary></output></span><div class="debt-timing__track"><input id="changeStart" aria-label="Start year for changes" type="range" min="${model.metadata.scenarioStart}" max="${model.years.at(-1)}" step="1"><input id="changeEnd" aria-label="End year for changes" type="range" min="${model.metadata.scenarioStart}" max="${model.years.at(-1)}" step="1"></div><small><span>Start <output data-change-start></output></span><span>End <output data-change-end></output></span></small></div>
      </section>
    </form>
    <div class="debt-scenario-accordion__note"><p>GNI* gives a clearer view of the domestic economy by excluding multinational-related distortions, whereas GDP is a broader measure of economic activity more affected by those flows.</p><p>Including windfall corporation tax receipts supports the projected fiscal position and can lower the debt ratio. Excluding the receipts tests a more cautious scenario.</p></div>
    </div>
  </details>`;

  element.querySelector("#changeStart").addEventListener("input", (event) => onChange("changeStart", Number(event.target.value)));
  element.querySelector("#changeEnd").addEventListener("input", (event) => onChange("changeEnd", Number(event.target.value)));
  element.querySelectorAll('input[name="denominator"], input[name="windfall"]').forEach((input) => {
    input.addEventListener("change", () => onChange(input.name, input.value));
  });
  keepOneScenarioStageOpen(element);

  return {
    element,
    update(controls) {
      element.querySelector("#changeStart").value = controls.changeStart;
      element.querySelector("#changeEnd").value = controls.changeEnd;
      element.querySelector(`[name="denominator"][value="${controls.denominator}"]`).checked = true;
      element.querySelector(`[name="windfall"][value="${controls.windfall}"]`).checked = true;
      element.querySelector("[data-period-summary]").textContent = `${controls.changeStart}–${controls.changeEnd}`;
      element.querySelector("[data-change-start]").textContent = controls.changeStart;
      element.querySelector("[data-change-end]").textContent = controls.changeEnd;
    }
  };
}

/** Detailed fiscal, economic and financing controls. */
export function debtFineTuning(model, {onChange}) {
  const element = document.createElement("section");
  element.className = "debt-workspace debt-fine-tuning debt-ratio-section debt-scenario-accordion";
  element.innerHTML = `<details class="debt-scenario-accordion__stage">
    ${accordionHeading("fiscal-stage-title", "2. Fine-tune the fiscal assumptions", "Test relative changes in spending and revenue against their baseline paths.")}
    <div class="debt-scenario-accordion__content"><section class="debt-assumptions__group debt-fine-tuning__panel"><div class="debt-fine-tuning__section">${sliderMarkup("primarySpending", "Primary spending")}${sliderMarkup("revenue", "Revenue")}<div class="debt-derived-metric"><span>Net fiscal input</span><strong data-primary-balance-effect>0%</strong><small>Revenue less primary spending</small></div></div></section></div>
  </details>
  <details class="debt-scenario-accordion__stage">
    ${accordionHeading("economy-stage-title", "3. Economy and financing", "Set annual rates for growth, inflation and debt servicing over the selected period. Leaving a rate blank retains the illustrative baseline path.")}
    <div class="debt-scenario-accordion__content"><section class="debt-assumptions__group debt-fine-tuning__panel"><div class="debt-fine-tuning__section">${rateMarkup(model, "realGrowth")}${rateMarkup(model, "inflation")}${rateMarkup(model, "interestRate")}</div></section></div>
  </details>`;

  keepOneScenarioStageOpen(element);

  for (const name of ["primarySpending", "revenue"]) {
    element.querySelector(`#${name}`).addEventListener("input", (event) => onChange(name, Number(event.target.value)));
  }
  for (const name of ["realGrowth", "inflation", "interestRate"]) {
    const range = element.querySelector(`#${name}`);
    const number = element.querySelector(`[data-rate-number="${name}"]`);
    range.addEventListener("input", (event) => onChange(name, Number(event.target.value)));
    number.addEventListener("input", (event) => {
      if (event.target.value === "") return onChange(name, null);
      const value = Number(event.target.value);
      const assumption = model.assumptions[name];
      if (Number.isFinite(value)) onChange(name, Math.min(assumption.max, Math.max(assumption.min, value)));
    });
  }

  return {
    element,
    update(controls) {
      for (const name of ["primarySpending", "revenue"]) {
        const input = element.querySelector(`#${name}`);
        input.value = controls[name];
        input.previousElementSibling.textContent = signed(controls[name]);
      }
      for (const name of ["realGrowth", "inflation", "interestRate"]) {
        const range = element.querySelector(`#${name}`);
        const number = element.querySelector(`[data-rate-number="${name}"]`);
        const output = element.querySelector(`[data-rate-control="${name}"] [data-rate-value]`);
        const start = model.years.indexOf(controls.changeStart);
        const end = Math.max(start, model.years.indexOf(controls.changeEnd));
        const periodRates = model.ratePaths[name].slice(start, end + 1);
        const low = Math.min(...periodRates);
        const high = Math.max(...periodRates);
        const baselineCopy = low === high ? formatRate(low) : `${formatRate(low)}–${formatRate(high)}`;
        element.querySelector(`[data-rate-control="${name}"] [data-rate-baseline]`).textContent = `Illustrative baseline path: ${baselineCopy}`;
        number.value = Number.isFinite(controls[name]) ? controls[name].toFixed(1) : "";
        range.value = Number.isFinite(controls[name]) ? controls[name] : periodRates[0];
        output.textContent = Number.isFinite(controls[name]) ? formatRate(controls[name]) : "Baseline path";
      }
      const primaryBalance = controls.revenue - controls.primarySpending;
      element.querySelector("[data-primary-balance-effect]").textContent = signed(primaryBalance);
    }
  };
}
