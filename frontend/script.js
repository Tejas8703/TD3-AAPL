function movingAverage(values, windowSize) {
  if (windowSize <= 1) return values.slice();
  const out = [];
  const half = Math.floor(windowSize / 2);
  for (let i = 0; i < values.length; i += 1) {
    let sum = 0;
    let count = 0;
    for (let j = i - half; j <= i + half; j += 1) {
      if (j >= 0 && j < values.length) {
        sum += values[j];
        count += 1;
      }
    }
    out.push(count ? sum / count : values[i]);
  }
  return out;
}

async function loadData() {
  const response = await fetch("/api/data");
  if (!response.ok) {
    throw new Error(`Failed to load data: ${response.status} ${response.statusText}`);
  }
  const payload = await response.json();
  const rows = Array.isArray(payload.data) ? payload.data : [];
  return rows
    .map((r) => ({
      dateStr: r.dateStr,
      date: new Date(r.dateStr),
      close: Number(r.close),
      action: Number(r.action),
    }))
    .filter((r) => r.date instanceof Date && !Number.isNaN(r.date.valueOf()));
}

function sliceByDays(data, days) {
  if (days === "all") return data;
  const n = Number(days);
  if (!Number.isFinite(n) || n <= 0) return data;
  const latest = data[data.length - 1]?.date;
  if (!latest) return data;
  const cutoff = new Date(latest.getTime() - n * 24 * 60 * 60 * 1000);
  return data.filter((d) => d.date >= cutoff);
}

function formatNumber(num, digits = 2) {
  return Number(num).toFixed(digits);
}

function computeDailyReturns(data) {
  if (data.length < 2) return [];
  const out = [];
  for (let i = 1; i < data.length; i += 1) {
    const prev = data[i - 1].close;
    const curr = data[i].close;
    if (!Number.isFinite(prev) || prev === 0) continue;
    const r = curr / prev - 1;
    out.push(r);
  }
  return out;
}

function computeSharpe(returns) {
  if (!returns.length) return null;
  const mean =
    returns.reduce((sum, r) => sum + r, 0) / Math.max(returns.length, 1);
  const variance =
    returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) /
    Math.max(returns.length - 1, 1);
  const std = Math.sqrt(variance);
  if (!Number.isFinite(std) || std === 0) return null;
  const dailySharpe = mean / std;
  return dailySharpe * Math.sqrt(252);
}

function computeCorrelation(x, y) {
  const n = Math.min(x.length, y.length);
  if (!n) return null;
  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < n; i += 1) {
    sumX += x[i];
    sumY += y[i];
  }
  const meanX = sumX / n;
  const meanY = sumY / n;
  let num = 0;
  let denomX = 0;
  let denomY = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }
  const denom = Math.sqrt(denomX * denomY);
  if (!Number.isFinite(denom) || denom === 0) return null;
  return num / denom;
}

function updateStats(data, smoothedActions, actionsRaw) {
  const statCount = document.getElementById("statCount");
  const statCloseRange = document.getElementById("statCloseRange");
  const statMeanAction = document.getElementById("statMeanAction");
  const statActionRange = document.getElementById("statActionRange");
  const statSharpeBuyHold = document.getElementById("statSharpeBuyHold");
  const statSharpePolicy = document.getElementById("statSharpePolicy");
  const statAvgReturn = document.getElementById("statAvgReturn");
  const statVolatility = document.getElementById("statVolatility");
  const statHitRate = document.getElementById("statHitRate");
  const statCorr = document.getElementById("statCorr");

  if (!data.length) {
    statCount.textContent = "0";
    statCloseRange.textContent = "-";
    statMeanAction.textContent = "-";
    statActionRange.textContent = "-";
    if (statSharpeBuyHold) statSharpeBuyHold.textContent = "-";
    if (statSharpePolicy) statSharpePolicy.textContent = "-";
    if (statAvgReturn) statAvgReturn.textContent = "-";
    if (statVolatility) statVolatility.textContent = "-";
    if (statHitRate) statHitRate.textContent = "-";
    if (statCorr) statCorr.textContent = "-";
    return;
  }

  const closes = data.map((d) => d.close);
  const actions =
    smoothedActions ??
    (actionsRaw && actionsRaw.length ? actionsRaw : data.map((d) => d.action));

  const minClose = Math.min(...closes);
  const maxClose = Math.max(...closes);
  const minAction = Math.min(...actions);
  const maxAction = Math.max(...actions);
  const meanAction =
    actions.reduce((sum, v) => sum + v, 0) / Math.max(actions.length, 1);

  statCount.textContent = String(data.length);
  statCloseRange.textContent = `${formatNumber(minClose)} → ${formatNumber(
    maxClose,
  )}`;
  statMeanAction.textContent = formatNumber(meanAction, 4);
  statActionRange.textContent = `${formatNumber(
    minAction,
    4,
  )} → ${formatNumber(maxAction, 4)}`;

  const dailyReturns = computeDailyReturns(data);
  if (!dailyReturns.length) {
    if (statSharpeBuyHold) statSharpeBuyHold.textContent = "-";
    if (statSharpePolicy) statSharpePolicy.textContent = "-";
    if (statAvgReturn) statAvgReturn.textContent = "-";
    if (statVolatility) statVolatility.textContent = "-";
    if (statHitRate) statHitRate.textContent = "-";
    if (statCorr) statCorr.textContent = "-";
    return;
  }

  const sharpeBuyHold = computeSharpe(dailyReturns);

  const actionsForPolicy =
    actionsRaw && actionsRaw.length ? actionsRaw : data.map((d) => d.action);

  const alignedPolicyReturns = [];
  const alignedActionsForCorr = [];
  const alignedReturnsForCorr = [];
  let hits = 0;
  let totalSignals = 0;

  for (let i = 1; i < data.length; i += 1) {
    const r = dailyReturns[i - 1];
    const a = actionsForPolicy[i - 1];
    if (!Number.isFinite(r) || !Number.isFinite(a)) continue;

    alignedPolicyReturns.push(a * r);
    alignedActionsForCorr.push(a);
    alignedReturnsForCorr.push(r);

    const signA = Math.sign(a);
    const signR = Math.sign(r);
    if (signA !== 0 && signR !== 0) {
      totalSignals += 1;
      if (signA === signR) hits += 1;
    }
  }

  const sharpePolicy = computeSharpe(alignedPolicyReturns);
  const meanRet =
    dailyReturns.reduce((sum, r) => sum + r, 0) /
    Math.max(dailyReturns.length, 1);
  const varianceRet =
    dailyReturns.reduce((sum, r) => sum + (r - meanRet) ** 2, 0) /
    Math.max(dailyReturns.length - 1, 1);
  const vol = Math.sqrt(varianceRet);
  const hitRate = totalSignals ? hits / totalSignals : null;
  const corr = computeCorrelation(alignedActionsForCorr, alignedReturnsForCorr);

  if (statSharpeBuyHold) {
    statSharpeBuyHold.textContent =
      sharpeBuyHold == null ? "-" : formatNumber(sharpeBuyHold, 2);
  }
  if (statSharpePolicy) {
    statSharpePolicy.textContent =
      sharpePolicy == null ? "-" : formatNumber(sharpePolicy, 2);
  }
  if (statAvgReturn) {
    statAvgReturn.textContent = `${formatNumber(meanRet * 100, 3)}%`;
  }
  if (statVolatility) {
    statVolatility.textContent = `${formatNumber(vol * 100, 3)}%`;
  }
  if (statHitRate) {
    statHitRate.textContent =
      hitRate == null ? "-" : `${formatNumber(hitRate * 100, 1)}%`;
  }
  if (statCorr) {
    statCorr.textContent = corr == null ? "-" : formatNumber(corr, 3);
  }
}

function updateSampleTable(data) {
  const tbody = document.getElementById("sampleTableBody");
  tbody.innerHTML = "";
  if (!data.length) return;

  const sample = data.slice(-20);
  for (const row of sample) {
    const tr = document.createElement("tr");
    const dateTd = document.createElement("td");
    const closeTd = document.createElement("td");
    const actionTd = document.createElement("td");

    dateTd.textContent = row.dateStr;
    closeTd.textContent = formatNumber(row.close, 4);
    actionTd.textContent = formatNumber(row.action, 6);

    tr.appendChild(dateTd);
    tr.appendChild(closeTd);
    tr.appendChild(actionTd);
    tbody.appendChild(tr);
  }
}

function createChart(ctx, labels, closes, actions) {
  return new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Close",
          data: closes,
          borderColor: "#38bdf8",
          backgroundColor: "rgba(56, 189, 248, 0.12)",
          tension: 0.22,
          pointRadius: 0,
          borderWidth: 2,
          yAxisID: "y",
        },
        {
          label: "Action",
          data: actions,
          borderColor: "#f97316",
          backgroundColor: "rgba(249, 115, 22, 0.1)",
          tension: 0.22,
          pointRadius: 0,
          borderWidth: 1.6,
          yAxisID: "y1",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.96)",
          borderColor: "rgba(30, 64, 175, 0.9)",
          borderWidth: 1,
          padding: 10,
          titleFont: { size: 12, weight: "600" },
          bodyFont: { size: 12 },
          callbacks: {
            label(context) {
              const label = context.dataset.label || "";
              const value = context.parsed.y;
              if (label === "Close") {
                return `${label}: ${formatNumber(value, 4)}`;
              }
              return `${label}: ${formatNumber(value, 6)}`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            autoSkip: true,
            maxTicksLimit: 8,
          },
          grid: {
            display: false,
          },
        },
        y: {
          position: "left",
          ticks: {
            color: "#9ca3af",
          },
          grid: {
            color: "rgba(31, 41, 55, 0.4)",
          },
        },
        y1: {
          position: "right",
          ticks: {
            color: "#f97316",
          },
          grid: {
            drawOnChartArea: false,
          },
        },
      },
    },
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const dateRangeSelect = document.getElementById("dateRange");
  const smoothingSelect = document.getElementById("smoothing");
  const actionScaleSelect = document.getElementById("actionScale");
  const ctx = document.getElementById("aaplChart").getContext("2d");

  let allData = [];
  let chart;

  function recomputeAndRender() {
    if (!allData.length) return;

    const rangeValue = dateRangeSelect.value;
    const smoothingWindow = Number(smoothingSelect.value) || 1;
    const actionScale = Number(actionScaleSelect.value) || 1;

    const rangeData = sliceByDays(allData, rangeValue);
    const labels = rangeData.map((d) => d.dateStr);
    const closes = rangeData.map((d) => d.close);
    const actionsRaw = rangeData.map((d) => d.action);
    const smoothed = movingAverage(actionsRaw, smoothingWindow).map(
      (v) => v * actionScale,
    );

    if (chart) {
      chart.data.labels = labels;
      chart.data.datasets[0].data = closes;
      chart.data.datasets[1].data = smoothed;
      chart.update();
    } else {
      chart = createChart(ctx, labels, closes, smoothed);
    }

    updateStats(rangeData, smoothed, actionsRaw);
    updateSampleTable(rangeData);
  }

  try {
    allData = await loadData();
    dateRangeSelect.addEventListener("change", recomputeAndRender);
    smoothingSelect.addEventListener("change", recomputeAndRender);
    actionScaleSelect.addEventListener("change", recomputeAndRender);
    recomputeAndRender();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    alert(
      "Failed to load data from backend. " +
        "Make sure the FastAPI server is running and that AAPL_actions_smooth_56_accuracy.csv is in the project root.",
    );
  }
});

