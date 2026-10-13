---
title: "Interest Spending"
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
const model = await FileAttachment("data/model-baseline.json").json();
const video = await FileAttachment("media/budget.mp4").url();
const explorer = createDebtAnalysisExplorer(model, "interest-spending");
display(debtHero({video, title: "Debt sustainability", subtitle: "Explore the projected annual cost of servicing general government debt."}));
display(debtSectionNav("interest-spending"));
~~~

<div class="prose-block lead debt-analysis-introduction"><p>Interest spending is driven by the debt stock and the interest-rate assumptions applied to new and refinancing debt. Compare the published baseline with an illustrative scenario view below.</p></div>

~~~js
display(explorer.scenarioSetup);
display(explorer.atAGlance);
display(explorer.chart);
display(explorer.fineTuning);
display(explorer.resetControl);
~~~

<div class="prose-block demographics-source-note"><h2>About the research</h2><p>This page forms part of the PBO debt sustainability calculator. It shows the interest-spending projection alongside the Budget 2026 baseline.</p><p>The current scenario line is an illustrative scaffold. It will be replaced with results from the approved debt sustainability model export.</p></div>

<div class="download-block"><div class="tax-downloads">

~~~js
display(downloadButton(metricDownloadRows(model, "interest-spending"), "debt-interest-spending-baseline-illustrative.csv", "Download the illustrative baseline data (CSV)"));
~~~

</div></div>
