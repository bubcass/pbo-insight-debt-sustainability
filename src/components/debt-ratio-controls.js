function sliderMarkup(id, label) {
  return `<label class="debt-control" for="${id}">
    <span>${label}</span><output>0%</output>
    <input id="${id}" type="range" min="-50" max="50" step="1" value="0">
    <small>−50% <i></i> +50%</small>
  </label>`;
}

function option(name, value, label) {
  return `<label class="segmented-control__option"><input type="radio" name="${name}" value="${value}"><span>${label}</span></label>`;
}

function signed(value) {
  return `${value > 0 ? "+" : ""}${Number(value).toFixed(0)}%`;
}

/** High-level scenario treatments, kept independently mountable in page flow. */
export function debtScenarioSetup(model, {onChange}) {
  const element = document.createElement("section");
  element.className = "debt-workspace debt-ratio-section debt-ratio-section--setup";
  element.innerHTML = `<aside class="debt-workspace__controls">
    <div class="debt-controls-heading">
      <div><h2>Build a scenario</h2><p>The type of debt ratio denominator and whether to include windfall corporation taxes may have significant effects on model projections.</div>
    </div>
    <form class="debt-assumptions">
      <section class="debt-assumptions__group debt-scenario-setup">
        <div class="debt-choice"><span>Debt ratio denominator</span><div class="segmented-control" role="radiogroup" aria-label="Debt ratio denominator">${option("denominator", "gni-star", "GNI*")}${option("denominator", "gdp", "GDP")}</div></div>
        <div class="debt-choice"><span>Windfall corporation tax</span><div class="segmented-control" role="radiogroup" aria-label="Windfall corporation tax treatment">${option("windfall", "include", "Include")}${option("windfall", "exclude", "Exclude")}</div></div>
        <div class="debt-timing"><span>Period of change <output data-period-summary></output></span><div class="debt-timing__track"><input id="changeStart" aria-label="Start year for changes" type="range" min="${model.metadata.scenarioStart}" max="${model.years.at(-1)}" step="1"><input id="changeEnd" aria-label="End year for changes" type="range" min="${model.metadata.scenarioStart}" max="${model.years.at(-1)}" step="1"></div><small><span>Start <output data-change-start></output></span><span>End <output data-change-end></output></span></small></div>
      </section>
    </form>
    <div><p></p><p>GNI* gives a clearer view of the domestic economy by excluding multinational-related distortions, whereas GDP is a broader measure of economic activity more affected by those flows.</p><p>Including windfall corporation tax receipts supports the projected fiscal position and can lower the debt ratio. Excluding the receipts tests a more cautious scenario.</p></p></div>
  </aside>`;

  element.querySelector("#changeStart").addEventListener("input", (event) => onChange("changeStart", Number(event.target.value)));
  element.querySelector("#changeEnd").addEventListener("input", (event) => onChange("changeEnd", Number(event.target.value)));
  element.querySelectorAll('input[name="denominator"], input[name="windfall"]').forEach((input) => {
    input.addEventListener("change", () => onChange(input.name, input.value));
  });

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
export function debtFineTuning({onChange}) {
  const element = document.createElement("section");
  element.className = "debt-workspace debt-fine-tuning debt-ratio-section";
  element.setAttribute("aria-labelledby", "fine-tune-title");
  element.innerHTML = `<div class="debt-controls-heading debt-fine-tuning__heading">
    <div><h2 id="fine-tune-title">Fine-tune the model</h2><p>Adjust the detailed fiscal, economic and financing assumptions as relative changes from their baseline paths.</p></div>
  </div>
  <div class="debt-fine-tuning__grid">
    <section class="debt-assumptions__group"><h3>Fiscal assumptions</h3><p class="debt-step-description">Test relative changes in spending and revenue against their baseline paths.</p>${sliderMarkup("primarySpending", "Primary spending")}${sliderMarkup("revenue", "Revenue")}<div class="debt-derived-metric"><span>Net fiscal input</span><strong data-primary-balance-effect>0%</strong><small>Revenue less primary spending</small></div></section>
    <section class="debt-assumptions__group"><h3>Economy and financing</h3><p class="debt-step-description">Test relative changes in growth, inflation and interest rates against their baseline paths.</p>${sliderMarkup("realGrowth", "Real growth")}${sliderMarkup("inflation", "Inflation")}${sliderMarkup("interestRate", "Interest rate")}</section>
  </div>`;

  for (const name of ["primarySpending", "revenue", "realGrowth", "inflation", "interestRate"]) {
    element.querySelector(`#${name}`).addEventListener("input", (event) => onChange(name, Number(event.target.value)));
  }

  return {
    element,
    update(controls) {
      for (const name of ["primarySpending", "revenue", "realGrowth", "inflation", "interestRate"]) {
        const input = element.querySelector(`#${name}`);
        input.value = controls[name];
        input.previousElementSibling.textContent = signed(controls[name]);
      }
      const primaryBalance = controls.revenue - controls.primarySpending;
      element.querySelector("[data-primary-balance-effect]").textContent = signed(primaryBalance);
    }
  };
}
