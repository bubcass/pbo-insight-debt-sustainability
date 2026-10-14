---
title: "Government Balance"
header: false
sidebar: false
footer: false
toc: false
---

~~~js
import {debtHero} from "./components/debt-page.js";
import {debtSectionNav} from "./components/debt-section-nav.js";
import {createDebtAnalysisExplorer, metricDownloadRows} from "./components/debt-analysis.js";
import {downloadButton} from "./components/download-button.js";
import {debtScenarioExplainer} from "./components/debt-scenario-explainer.js";
const model = await FileAttachment("data/model-baseline.json").json();
const video = await FileAttachment("media/budget.mp4").url();
const explorer = createDebtAnalysisExplorer(model, "government-balance");
display(debtHero({video, title: "Debt sustainability", subtitle: "Explore the projected overall balance of general government."}));
display(debtSectionNav("government-balance"));
~~~

<div class="prose-block lead debt-analysis-introduction"><p>The general government balance combines the primary balance and interest spending. It shows whether government is borrowing or lending in a given year.</p></div>

~~~js
display(explorer.atAGlance);
display(explorer.chart);
display(debtScenarioExplainer());
display(explorer.scenarioSetup);
display(explorer.fineTuning);
display(explorer.resetControl);
~~~

<div class="prose-block demographics-source-note"><h2>About the research</h2><p>This page forms part of the PBO debt sustainability calculator. It shows the general government balance projection alongside the Budget 2026 baseline.</p><p>The current scenario line is an illustrative scaffold. It will be replaced with results from the approved debt sustainability model export.</p></div>

<div class="download-block"><div class="tax-downloads">

~~~js
display(downloadButton(metricDownloadRows(model, "government-balance"), "government-balance-baseline-illustrative.csv", "Download the illustrative baseline data (CSV)"));
~~~

</div></div>
