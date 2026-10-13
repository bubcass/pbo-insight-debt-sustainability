# PBO Insights — Debt Sustainability

Observable Framework scaffold for the PBO debt sustainability dashboard.

## What is ready

- Responsive page structure: desktop assumptions rail, tablet assumptions tray and mobile progressive disclosure.
- The six analysis-page tabs replacing the legacy “Select graph to show” dropdown.
- A documented placeholder model contract in `src/data/model-baseline.json`.
- A small presentation adapter in `src/components/debt-model.js`; replace its illustrative sensitivity logic when the model output arrives.
- Automated contract validation with `npm run check:data`.

## Getting started

```sh
npm install
npm run dev
```

## Data handover

The eventual modelling export should populate:

- `years` — annual projection years;
- `baseline` — one array per analysis-page series;
- `metadata` — publication and methodology labels;
- `assumptions` — baseline values and allowed scenario ranges.

Do not treat the placeholder values as PBO forecasts. They exist only to exercise layout, responsiveness and the data interface.
