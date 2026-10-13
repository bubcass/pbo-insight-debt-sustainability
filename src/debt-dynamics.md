---
title: "Debt Dynamics"
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
const explorer = createDebtAnalysisExplorer(model, "debt-dynamics");
display(debtHero({video, title: "Debt sustainability", subtitle: "Explore the annual contributions that increase or reduce the debt-to-GNI* ratio."}));
display(debtSectionNav("debt-dynamics"));
~~~

<div class="prose-block lead debt-analysis-introduction"><p>Debt dynamics break the annual change in the debt ratio into the effects of interest spending, primary balances, real growth, inflation and stock-flow adjustments.</p></div>

~~~js
display(explorer.scenarioSetup);
display(explorer.atAGlance);
display(explorer.chart);
display(explorer.fineTuning);
display(explorer.resetControl);
~~~

<div class="prose-block demographics-source-note"><h2>About the research</h2><p>This decomposition follows the structure of the debt sustainability calculator, separating the factors which add to the debt ratio from those which reduce it.</p><p>The contribution values are illustrative placeholders. They will be replaced by the approved model decomposition when it becomes available.</p></div>

<div class="download-block"><div class="tax-downloads">

~~~js
display(downloadButton(metricDownloadRows(model, "debt-dynamics"), "debt-dynamics-illustrative.csv", "Download the illustrative dynamics data (CSV)"));
~~~

</div></div>
