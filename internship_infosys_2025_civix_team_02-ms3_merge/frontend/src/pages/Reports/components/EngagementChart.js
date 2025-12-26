import React, { useMemo } from 'react';
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const buildFallbackSeries = () => {
  const fallback = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    fallback.push({
      month: MONTH_LABELS[date.getMonth()],
      signatures: 0,
      votes: 0,
    });
  }

  return fallback;
};

const sanitizeSeries = (series) => {
  const fallback = buildFallbackSeries();

  if (!Array.isArray(series) || !series.length) {
    return fallback;
  }

  return series.map((entry, index) => ({
    month: entry?.month || fallback[index % fallback.length].month,
    signatures: Number(entry?.signatures) >= 0 ? Number(entry.signatures) : 0,
    votes: Number(entry?.votes) >= 0 ? Number(entry.votes) : 0,
  }));
};

const mapTrendSeries = (labels, series = []) => {
  if (!Array.isArray(labels) || !labels.length) return [];

  const lookup = (series || []).reduce((acc, item) => {
    if (item?.month) {
      acc[item.month] = Number(item?.value) || 0;
    }
    return acc;
  }, {});

  return labels.map((label) => lookup[label] ?? 0);
};

const EngagementChart = ({
  data = [],
  title = 'Engagement Growth',
  pollTrend = [],
  signatureTrend = [],
}) => {
  const normalized = sanitizeSeries(data);
  const labels = normalized.map((entry) => entry.month);
  const pollVotes = normalized.map((entry) => entry.votes);
  const signatures = normalized.map((entry) => entry.signatures);
  const votesTrend = mapTrendSeries(labels, pollTrend);
  const signaturesTrend = mapTrendSeries(labels, signatureTrend);

  const allValues = [...pollVotes, ...signatures, ...votesTrend, ...signaturesTrend];
  const maxVal = allValues.length ? Math.max(...allValues, 0) : 0;
  const suggestedMax = maxVal === 0 ? 10 : Math.ceil(maxVal * 1.2);
  const stepSize = suggestedMax <= 5 ? 1 : Math.max(1, Math.ceil(suggestedMax / 5));

  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: 'Poll Votes',
          data: pollVotes,
          borderColor: '#a855f7',
          backgroundColor: '#a855f7',
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: '#fff',
          tension: 0.4,
        },
        {
          label: 'Signatures',
          data: signatures,
          borderColor: '#3b82f6',
          backgroundColor: '#3b82f6',
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: '#fff',
          tension: 0.4,
        },
        {
          label: 'Poll Votes Trend',
          data: votesTrend,
          borderColor: '#c084fc',
          backgroundColor: '#c084fc',
          borderWidth: 2,
          borderDash: [6, 6],
          pointRadius: 0,
          tension: 0.3,
        },
        {
          label: 'Signatures Trend',
          data: signaturesTrend,
          borderColor: '#1d4ed8',
          backgroundColor: '#1d4ed8',
          borderWidth: 2,
          borderDash: [6, 6],
          pointRadius: 0,
          tension: 0.3,
        },
      ],
    }),
    [labels, pollVotes, signatures, votesTrend, signaturesTrend]
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            boxWidth: 12,
            color: '#4b5563',
          },
        },
        tooltip: {
          backgroundColor: '#1f2937',
          padding: 12,
          titleFont: { size: 14 },
          bodyFont: { size: 13 },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#6b7280' },
        },
        y: {
          beginAtZero: true,
          grid: { color: '#e5e7eb' },
          ticks: {
            color: '#6b7280',
            stepSize,
          },
          suggestedMax,
        },
      },
    }),
    [stepSize, suggestedMax]
  );

  return (
    <div className="chart-section">
      <h2 className="chart-title">{title}</h2>
      <div className="chartjs-wrapper">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default EngagementChart;

