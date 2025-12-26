import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';

Chart.register(CategoryScale, LinearScale, BarElement, Tooltip);

const truncateLabel = (text = '', limit = 30) => {
  const clean = text || 'Untitled Poll';
  return clean.length > limit ? `${clean.substring(0, limit)}...` : clean;
};

const PollAnalyticsChart = ({
  polls = [],
  valueKey = 'votes',
  color = '#a855f7',
  maxItems = 6,
  emptyLabel = 'No poll analytics available',
}) => {
  const sanitized = useMemo(
    () =>
      (Array.isArray(polls) ? polls : [])
        .filter(Boolean)
        .slice(0, maxItems),
    [polls, maxItems]
  );

  const datasetLabel =
    valueKey === 'comments'
      ? 'Comments'
      : valueKey === 'count'
      ? 'Totals'
      : 'Votes';

  const labels = sanitized.map((poll) => poll?.question || 'Untitled Poll');
  const values = sanitized.map((poll) => {
    const fallback =
      poll?.votes ?? poll?.count ?? poll?.comments ?? poll?.value ?? 0;
    return Math.max(0, Number(poll?.[valueKey] ?? fallback) || 0);
  });

  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: datasetLabel,
          data: values,
          backgroundColor: color,
          borderRadius: 12,
          borderSkipped: false,
          barThickness: 36,
        },
      ],
    }),
    [labels, values, color, datasetLabel]
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          padding: 10,
          titleFont: { size: 13 },
          bodyFont: { size: 12 },
          callbacks: {
            title: () => '',
            label: (context) =>
              `${datasetLabel}: ${context?.parsed?.y ?? context?.parsed ?? 0}`,
          },
        },
        datalabels: {
          display: false,
        },
      },
      layout: {
        padding: {
          top: 8,
          bottom: 8,
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
            drawBorder: false,
            drawTicks: false,
          },
          ticks: {
            display: false,
          },
          title: {
            display: false,
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            display: false,
            drawBorder: false,
          },
          ticks: {
            display: false,
          },
          title: {
            display: false,
          },
        },
      },
    }),
    [datasetLabel]
  );

  if (!sanitized.length) {
    return <div className="poll-chart-empty">{emptyLabel}</div>;
  }

  const footerStyle = {
    gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))`,
  };

  return (
    <div className="poll-bar-chart">
      <div className="poll-bar-chart-canvas">
        <Bar data={chartData} options={chartOptions} />
      </div>
      <div className="poll-bar-chart-foot" style={footerStyle}>
        {sanitized.map((poll, idx) => (
          <div key={poll?._id || idx} className="poll-bar-chart-foot-item">
            <div className="poll-bar-chart-name">
              {truncateLabel(poll?.question)}
            </div>
            <div className="poll-bar-chart-value">
              {(values[idx] ?? 0).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PollAnalyticsChart;


