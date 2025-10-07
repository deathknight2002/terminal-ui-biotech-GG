import { OpenBBPlotPayload, PlotGlobals, PlotlyLayoutMargin, TransformedPlot } from './openbb-plot-types';

export const deepClone = <T,>(value: T): T =>
  typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));

export const transformOpenBBPlotPayload = (
  payload: OpenBBPlotPayload,
): TransformedPlot | null => {
  if (!payload) {
    return null;
  }

  const cloned = deepClone({
    data: payload.data ?? [],
    layout: payload.layout ?? {},
    frames: payload.frames ?? [],
    config: payload.config ?? {},
  });

  const globals: PlotGlobals = {
    added_traces: [],
    csv_yaxis_id: null,
    cmd_src_idx: null,
    cmd_idx: null,
    cmd_src: '',
    old_margin: null,
    title: '',
  };

  const layout = cloned.layout ?? {};

  if (Array.isArray(layout.annotations)) {
    layout.annotations.forEach((annotation: Record<string, unknown>, index: number) => {
      if (typeof annotation?.text === 'string' && annotation.text.startsWith('/')) {
        globals.cmd_src = annotation.text;
        globals.cmd_idx = index;
        annotation.text = '';

        if (layout.margin) {
          const margin = layout.margin as PlotlyLayoutMargin;
          globals.old_margin = { ...margin };
          if (margin.t !== undefined && margin.t > 40) {
            margin.t = 40;
          }
          if (
            payload.command_location === '/equity/price/historical' &&
            margin.r !== undefined
          ) {
            margin.r = Math.max(0, margin.r - 50);
          }
        }
      }
    });
  }

  if (Array.isArray(cloned.data)) {
    cloned.data.forEach((trace: Record<string, unknown>) => {
      if (trace && (trace as { name?: string }).name) {
        (trace as { hoverlabel: { namelength: number } }).hoverlabel = { namelength: -1 };
      }
    });
  }

  const rawTitle =
    (layout?.title as Record<string, unknown>)?.text as string ??
    payload.command_location?.toUpperCase() ??
    'OpenBB Chart';

  globals.title = rawTitle;

  const sanitizedTitle = rawTitle
    .replace(/ -/g, '')
    .replace(/-/g, '')
    .replace(/<b>|<\/b>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const figureTitle = sanitizedTitle.length ? sanitizedTitle : 'OpenBB Chart';

  const theme = payload.theme === 'light' ? 'light' : 'dark';

  return {
    json: cloned,
    date: new Date(),
    cmd: payload.command_location ?? '',
    title: figureTitle,
    globals,
    theme,
  };
};
