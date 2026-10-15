import * as Plot from "npm:@observablehq/plot@0.6.17";
import {sanitizePlotAccessibility} from "./plot-accessibility.js";

// These remain close to the Insights/PBO palette, while giving each state a
// distinct visual role: neutral published data, a warning/adverse path, and a
// user-defined path.
const LIGHT_PALETTE = {
  baseline: "#5f7f93",
  custom: "#6b1448",
  adverse: "#ba4f2e",
  change: "#d28b22",
  customFill: "#e7d5df",
  adverseFill: "#f0d7d1",
  surface: "#fffdfa"
};
const DARK_PALETTE = {
  baseline: "#91b7ce",
  custom: "#efa8d1",
  adverse: "#ff9b73",
  change: "#e5c267",
  customFill: "#693b55",
  adverseFill: "#693b31",
  surface: "#22231f"
};
const MARGINS = {top: 18, right: 26, bottom: 46, left: 64};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function paletteForTheme() {
  return document.documentElement.dataset.theme === "dark" ? DARK_PALETTE : LIGHT_PALETTE;
}

function appearanceFor(preset, palette) {
  if (preset === "adverse") return {colour: palette.adverse, fill: palette.adverseFill};
  if (preset === "baseline") return {colour: palette.baseline, fill: palette.baseline};
  return {colour: palette.custom, fill: palette.customFill};
}

function signedDifference(value) {
  if (Math.abs(value) < 0.05) return "Matches baseline";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)} pp versus baseline`;
}

function tooltipHTML(row, valueFormat, differenceFormat) {
  const difference = row.scenario - row.baseline;
  return `<strong>${row.year}</strong><span>Scenario: ${valueFormat(row.scenario)}</span><span>Baseline: ${valueFormat(row.baseline)}</span><span>${differenceFormat(difference)}</span>`;
}

/**
 * A reusable Observable Plot comparison component. It deliberately combines
 * an absolute projection with strongly differentiated marks. The gap between
 * the scenario and baseline is encoded in the band and selected bridge marks
 * rather than a second chart with a second scale.
 */
export function projectionComparisonChart({
  years,
  baseline,
  valueLabel,
  valueFormat = (value) => value.toFixed(1),
  yTickFormat = (value) => `${value}%`,
  differenceFormat = signedDifference,
  ariaLabel = "Interactive baseline and scenario comparison chart"
}) {
  const element = document.createElement("div");
  element.className = "debt-plot";
  const shell = document.createElement("div");
  shell.className = "debt-plot__shell";
  shell.setAttribute("role", "region");
  shell.setAttribute("aria-label", ariaLabel);
  shell.tabIndex = 0;
  const absoluteHost = document.createElement("div");
  absoluteHost.className = "debt-plot__absolute";

  const interaction = document.createElement("div");
  interaction.className = "debt-plot__interaction";
  interaction.setAttribute("aria-hidden", "true");
  const tooltip = document.createElement("div");
  tooltip.className = "debt-plot__tooltip";
  tooltip.hidden = true;
  tooltip.setAttribute("role", "status");
  tooltip.setAttribute("aria-live", "polite");
  shell.append(absoluteHost, interaction, tooltip);
  element.append(shell);

  let state;
  let renderedWidth = 0;
  let activeIndex = 0;
  let geometry;

  const hide = () => {
    tooltip.hidden = true;
  };

  const show = (index, event = null) => {
    if (!geometry) return;
    activeIndex = clamp(index, 0, geometry.rows.length - 1);
    const row = geometry.rows[activeIndex];
    tooltip.innerHTML = tooltipHTML(row, geometry.valueFormat, geometry.differenceFormat);
    tooltip.hidden = false;

    const bounds = shell.getBoundingClientRect();
    const x = MARGINS.left + geometry.plotWidth * activeIndex / (geometry.rows.length - 1);
    const y = geometry.absolute.height - MARGINS.bottom - (row.scenario - geometry.absolute.min) / (geometry.absolute.max - geometry.absolute.min) * geometry.absolute.plotHeight;
    const localX = event ? event.clientX - bounds.left : x;
    const localY = event ? event.clientY - bounds.top : y;
    const tooltipWidth = tooltip.offsetWidth || 190;
    const tooltipHeight = tooltip.offsetHeight || 86;
    const inset = 8;
    const gap = 14;
    let left = localX + gap;
    let top = localY - tooltipHeight - gap;
    if (left + tooltipWidth > bounds.width - inset) left = localX - tooltipWidth - gap;
    if (top < inset) top = localY + gap;
    tooltip.style.left = `${clamp(left, inset, Math.max(inset, bounds.width - tooltipWidth - inset))}px`;
    tooltip.style.top = `${clamp(top, inset, Math.max(inset, bounds.height - tooltipHeight - inset))}px`;
  };

  const render = () => {
    if (!state) return;
    const width = Math.max(320, Math.floor(element.clientWidth || 720));
    const absoluteHeight = width < 560 ? 310 : 405;
    const rows = years.map((year, index) => ({
      year,
      baseline: baseline[index],
      scenario: state.scenario[index],
      difference: state.scenario[index] - baseline[index]
    }));
    const changedRows = rows.filter((row) => row.year >= state.scenarioStart);
    const palette = paletteForTheme();
    const active = appearanceFor(state.preset, palette);
    const isBaseline = state.preset === "baseline" || rows.every((row) => Math.abs(row.difference) < 0.05);
    const values = rows.flatMap((row) => [row.baseline, row.scenario]);
    const absolutePad = Math.max(1, (Math.max(...values) - Math.min(...values)) * 0.08);
    const absolute = {
      height: absoluteHeight,
      min: Math.floor(Math.min(...values) - absolutePad),
      max: Math.ceil(Math.max(...values) + absolutePad),
      plotHeight: absoluteHeight - MARGINS.top - MARGINS.bottom
    };
    const plotWidth = width - MARGINS.left - MARGINS.right;
    const horizonRows = [rows[5], rows[10]]
      .filter(Boolean)
      .filter((row) => row.year >= state.scenarioStart && Math.abs(row.difference) >= 0.05);
    // These are static Plot tips, following Observable’s annotation pattern:
    // the callout is a mark in the chart and remains visible without hover.
    const annotationRows = horizonRows.map((row, index) => {
        const direction = row.difference > 0 ? 1 : -1;
        return {
          ...row,
          annotation: `${index === 0 ? "5" : "10"}-year horizon (${row.year})\n${valueFormat(row.scenario)} · ${differenceFormat(row.difference).replace(/^[-+]?/, "")}`
        };
      });
    const annotationsAbove = annotationRows.filter((row) => row.difference > 0);
    const annotationsBelow = annotationRows.filter((row) => row.difference < 0);
    const absolutePlot = Plot.plot({
      width,
      height: absoluteHeight,
      marginTop: MARGINS.top,
      marginRight: MARGINS.right,
      marginBottom: MARGINS.bottom,
      marginLeft: MARGINS.left,
      x: {label: "Year", domain: years, ticks: width < 560 ? years.filter((_, index) => index % 2 === 0) : years, tickFormat: (year) => String(year)},
      y: {label: valueLabel(state), domain: [absolute.min, absolute.max], grid: true, tickFormat: yTickFormat},
      marks: [
        ...(!isBaseline ? [Plot.areaY(changedRows, {x: "year", y1: "baseline", y2: "scenario", fill: active.fill, fillOpacity: 0.45})] : []),
        Plot.ruleX([state.scenarioStart], {stroke: palette.change, strokeDasharray: "4,4", ariaHidden: true}),
        Plot.lineY(rows, {x: "year", y: "baseline", stroke: palette.baseline, strokeWidth: 2.25, strokeDasharray: "5,4"}),
        ...(!isBaseline ? [Plot.dot(rows, {x: "year", y: "baseline", stroke: palette.baseline, fill: palette.surface, strokeWidth: 1.4, r: 3.4})] : []),
        ...(isBaseline
          ? [Plot.dot(rows, {x: "year", y: "baseline", fill: palette.baseline, r: 3.2})]
          : [
              Plot.ruleX(horizonRows, {x: "year", y1: "baseline", y2: "scenario", stroke: palette.change, strokeWidth: 2.2, ariaHidden: true}),
              Plot.lineY(rows, {x: "year", y: "scenario", stroke: active.colour, strokeWidth: 4}),
              Plot.dot(rows, {x: "year", y: "scenario", fill: active.colour, r: 4}),
              Plot.tip(annotationsAbove, {x: "year", y: (row) => (row.baseline + row.scenario) / 2, title: "annotation", anchor: "bottom", dy: -8, fill: palette.surface, stroke: "var(--border)", fontSize: 11, lineHeight: 1.25, pathFilter: "drop-shadow(0 2px 3px rgb(48 43 35 / 18%))"}),
              Plot.tip(annotationsBelow, {x: "year", y: (row) => (row.baseline + row.scenario) / 2, title: "annotation", anchor: "top", dy: 8, fill: palette.surface, stroke: "var(--border)", fontSize: 11, lineHeight: 1.25, pathFilter: "drop-shadow(0 2px 3px rgb(48 43 35 / 18%))"})
            ])
      ]
    });
    sanitizePlotAccessibility(absolutePlot);
    absolutePlot.setAttribute("aria-label", `${valueLabel(state)} projection, comparing the published baseline with the selected scenario`);
    absolutePlot.classList.add("debt-plot__svg");
    absoluteHost.replaceChildren(absolutePlot);
    geometry = {rows, absolute, plotWidth, valueFormat, differenceFormat};
    interaction.style.left = `${MARGINS.left}px`;
    interaction.style.top = `${MARGINS.top}px`;
    interaction.style.width = `${plotWidth}px`;
    interaction.style.height = `${absolute.plotHeight}px`;
    renderedWidth = width;
    hide();
  };

  const indexForEvent = (event) => {
    const bounds = interaction.getBoundingClientRect();
    return Math.round((event.clientX - bounds.left) / bounds.width * (years.length - 1));
  };
  interaction.addEventListener("pointerenter", (event) => show(indexForEvent(event), event));
  interaction.addEventListener("pointermove", (event) => show(indexForEvent(event), event));
  interaction.addEventListener("pointerleave", hide);
  shell.addEventListener("focus", () => show(activeIndex));
  shell.addEventListener("blur", hide);
  shell.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      show(activeIndex + (event.key === "ArrowRight" ? 1 : -1));
    } else if (event.key === "Escape") {
      hide();
      shell.blur();
    }
  });
  const observer = new ResizeObserver(() => {
    const width = Math.floor(element.clientWidth || 0);
    if (width && Math.abs(width - renderedWidth) > 1) render();
  });
  observer.observe(element);
  const themeObserver = new MutationObserver(() => render());
  themeObserver.observe(document.documentElement, {attributes: true, attributeFilter: ["data-theme"]});

  return {
    element,
    update(scenario, {scenarioStart, denominatorLabel, preset = "custom"} = {}) {
      state = {scenario, scenarioStart, denominatorLabel, preset};
      render();
    },
    destroy() {
      observer.disconnect();
      themeObserver.disconnect();
    }
  };
}

/** Debt-ratio configuration of the generic projection comparison component. */
export function debtRatioChart(model) {
  return projectionComparisonChart({
    years: model.years,
    baseline: model.baseline.debtRatioGniStar,
    valueLabel: ({denominatorLabel = "GNI*"}) => `Debt-to-${denominatorLabel} ratio (%)`,
    valueFormat: (value) => `${value.toFixed(1)}%`,
    ariaLabel: "Interactive debt ratio projection chart"
  });
}
