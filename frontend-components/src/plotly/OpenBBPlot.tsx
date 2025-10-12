import React, { useMemo } from 'react';
import { transformOpenBBPlotPayload } from './openbb-plot-utils';
import { OpenBBPlotProps } from './openbb-plot-types';
// TODO: Re-enable when OpenBB submodule is initialized
// import Chart from '../../../external/OpenBB/frontend-components/plotly/src/components/Chart';

// Temporary stub until OpenBB is available
const Chart: React.FC<any> = () => <div>OpenBB Chart (requires submodule)</div>;

export const OpenBBPlot: React.FC<OpenBBPlotProps> = ({ payload, className }) => {
  const transformed = useMemo(
    () => transformOpenBBPlotPayload(payload),
    [payload],
  );

  if (!transformed) {
    return null;
  }

  return (
    <div className={className}>
      <Chart
        json={transformed.json}
        date={transformed.date}
        cmd={transformed.cmd}
        title={transformed.title}
        globals={transformed.globals}
        theme={transformed.theme}
      />
    </div>
  );
};

export default OpenBBPlot;
