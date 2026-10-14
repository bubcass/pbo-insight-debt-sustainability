---
title: "Debt Sustainability"
header: false
sidebar: false
footer: false
toc: false
---

~~~js
import {debtHero} from "./components/debt-page.js";
import {createDebtRatioExplorer} from "./components/debt-ratio-explorer.js";
import {debtSectionNav} from "./components/debt-section-nav.js";
import {downloadButton} from "./components/download-button.js";
import {debtScenarioExplainer} from "./components/debt-scenario-explainer.js";

const model = await FileAttachment("data/model-baseline.json").json();
const heroVideo = await FileAttachment("media/budget.mp4").url();
const downloadRows = model.years.map((year, index) => ({
  Year: year,
  "Budget 2026 baseline debt-to-GNI* ratio (%)": model.baseline.debtRatioGniStar[index]
}));
const debtRatio = createDebtRatioExplorer(model);

display(debtHero({
  video: heroVideo,
  title: "Debt sustainability",
  subtitle: "Explore how fiscal, economic and financing assumptions affect the medium-term path for general government debt."
}));
display(debtSectionNav("debt-ratio"));
~~~

<div class="prose-block lead debt-introduction">
  <p>Debt sustainability analysis is a study of a country's medium-term to long-term debt position.</p>
  <p>This data-driven tool helps to establish the hypothetical impact of variables such as changes to primary spending, revenue, GDP growth and interest rates on a published baseline and an example adverse scenario.</p>
</div>

~~~js
display(debtRatio.atAGlance);
display(debtRatio.chart);
display(debtScenarioExplainer());
display(debtRatio.scenarioSetup);
display(debtRatio.fineTuning);
display(debtRatio.resetControl);
~~~

<div class="prose-block demographics-source-note debt-research-note">
  <h2>About the research</h2>
  <p>This interactive tool is part of the PBO’s programme of independent analysis of Ireland’s public finances. It is designed to help users explore the drivers of debt sustainability alongside the published baseline.</p>
  <p>The calculator presents general government debt relative to modified gross national income (GNI*) or GDP, depending on the selected treatment. Scenario changes apply over the selected period and the baseline remains available for comparison.</p>
  <p>This is an illustrative scaffold pending the approved model export. The underlying figures, methodology and accompanying explanatory material will be updated when the final dataset is available.</p>
</div>

<div class="download-block debt-download" aria-label="Download calculator data">

~~~js
display(downloadButton(downloadRows, "debt-sustainability-baseline-illustrative.csv", "Download the data"));
~~~

</div>
