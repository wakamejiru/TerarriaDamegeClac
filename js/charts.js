/**
 * Clean & High-Legibility Chart.js Integration
 */

let defenseChartInstance = null;
let curvatureChartInstance = null;

// シンプル＆高コントラストなカラー設定
const CHART_THEME = {
  blue: '#58a6ff',
  green: '#3fb950',
  gold: '#e3b341',
  pink: '#f778ba',
  grid: '#21262d',
  axis: '#8b949e',
  tooltipBg: '#161b22',
  text: '#c9d1d9'
};

/**
 * 防御力 vs 被ダメージ相関グラフ
 */
function updateDefenseChart(atk, currentDef, currentDr, bestDef, bestDr, mode) {
  const canvas = document.getElementById('defenseDamageChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // X軸の範囲
  const maxRange = Math.max(Math.ceil(atk * 1.1), currentDef + 50, 100);
  const step = Math.max(1, Math.round(maxRange / 35));

  const labels = [];
  const noDrData = [];
  const currentDrData = [];
  const bestDrData = [];

  for (let def = 0; def <= maxRange; def += step) {
    labels.push(def);
    noDrData.push(calculateDamage(atk, def, 0, mode).finalDamage);
    currentDrData.push(calculateDamage(atk, def, currentDr, mode).finalDamage);
    if (bestDr !== undefined) {
      bestDrData.push(calculateDamage(atk, def, bestDr, mode).finalDamage);
    }
  }

  // 現在地点
  const currentResult = calculateDamage(atk, currentDef, currentDr, mode);
  const currentPoint = [{ x: currentDef, y: currentResult.finalDamage }];

  const datasets = [
    {
      label: '軽減率 0% (防御力のみ)',
      data: labels.map((x, i) => ({ x, y: noDrData[i] })),
      borderColor: '#6e7681',
      borderDash: [5, 5],
      borderWidth: 1.5,
      pointRadius: 0
    },
    {
      label: `現在の軽減率 (${currentDr.toFixed(1)}%)`,
      data: labels.map((x, i) => ({ x, y: currentDrData[i] })),
      borderColor: CHART_THEME.blue,
      backgroundColor: 'rgba(88, 166, 255, 0.08)',
      fill: true,
      borderWidth: 2.5,
      pointRadius: 0
    }
  ];

  if (bestDr !== undefined && Math.abs(bestDr - currentDr) > 0.1) {
    datasets.push({
      label: `最適リフォージ時 (${bestDr.toFixed(1)}%)`,
      data: labels.map((x, i) => ({ x, y: bestDrData[i] })),
      borderColor: CHART_THEME.gold,
      borderDash: [3, 3],
      borderWidth: 2,
      pointRadius: 0
    });
  }

  // 現在位置のプロット
  datasets.push({
    label: `現在地 (防御:${currentDef}, 被ダメ:${currentResult.finalDamage})`,
    data: currentPoint,
    type: 'scatter',
    borderColor: '#ffffff',
    backgroundColor: CHART_THEME.pink,
    pointRadius: 8,
    pointHoverRadius: 10,
    pointBorderWidth: 2,
    showLine: false
  });

  if (defenseChartInstance) {
    defenseChartInstance.data.datasets = datasets;
    defenseChartInstance.options.scales.x.max = maxRange;
    defenseChartInstance.update();
  } else {
    defenseChartInstance = new Chart(ctx, {
      type: 'line',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'nearest',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: CHART_THEME.text,
              font: { family: "'Outfit', sans-serif", size: 13 },
              usePointStyle: true,
              padding: 14
            }
          },
          tooltip: {
            backgroundColor: CHART_THEME.tooltipBg,
            titleColor: '#fff',
            bodyColor: CHART_THEME.text,
            borderColor: '#30363d',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: 防御 ${ctx.parsed.x} → 被ダメ ${ctx.parsed.y}`
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            title: {
              display: true,
              text: 'プレイヤー防御力 (Defense)',
              color: CHART_THEME.axis,
              font: { size: 13, weight: 'bold' }
            },
            grid: { color: CHART_THEME.grid },
            ticks: { color: CHART_THEME.axis }
          },
          y: {
            title: {
              display: true,
              text: '被ダメージ (Damage Taken)',
              color: CHART_THEME.axis,
              font: { size: 13, weight: 'bold' }
            },
            grid: { color: CHART_THEME.grid },
            ticks: { color: CHART_THEME.axis },
            beginAtZero: true
          }
        }
      }
    });
  }
}

/**
 * 軽減率曲率グラフ
 */
function updateCurvatureChart(currentDr) {
  const canvas = document.getElementById('curvatureChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const maxDr = 100;
  const step = 2;

  const curveData = [];
  for (let dr = 0; dr <= maxDr; dr += step) {
    const effective = (1 - (1 / (1 + (dr / 100)))) * 100;
    curveData.push({ x: dr, y: Math.round(effective * 100) / 100 });
  }

  const linearData = [
    { x: 0, y: 0 },
    { x: 50, y: 50 },
    { x: 100, y: 100 }
  ];

  const currentEffective = (1 - (1 / (1 + (currentDr / 100)))) * 100;
  const currentPoint = [{ x: currentDr, y: Math.round(currentEffective * 100) / 100 }];

  const datasets = [
    {
      label: '実効軽減率: 1 - 1/(1+軽減率)',
      data: curveData,
      borderColor: CHART_THEME.green,
      backgroundColor: 'rgba(63, 185, 80, 0.08)',
      fill: true,
      borderWidth: 2.5,
      pointRadius: 0
    },
    {
      label: '減衰なし基準線 (y = x)',
      data: linearData,
      borderColor: '#484f58',
      borderDash: [4, 4],
      borderWidth: 1.5,
      pointRadius: 0
    },
    {
      label: `現在地: 投入${currentDr.toFixed(1)}% → 実効${currentEffective.toFixed(1)}%`,
      data: currentPoint,
      type: 'scatter',
      borderColor: '#ffffff',
      backgroundColor: CHART_THEME.gold,
      pointRadius: 8,
      pointHoverRadius: 10,
      pointBorderWidth: 2,
      showLine: false
    }
  ];

  if (curvatureChartInstance) {
    curvatureChartInstance.data.datasets = datasets;
    curvatureChartInstance.update();
  } else {
    curvatureChartInstance = new Chart(ctx, {
      type: 'line',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: CHART_THEME.text,
              font: { family: "'Outfit', sans-serif", size: 13 },
              usePointStyle: true,
              padding: 14
            }
          },
          tooltip: {
            backgroundColor: CHART_THEME.tooltipBg,
            titleColor: '#fff',
            bodyColor: CHART_THEME.text,
            borderColor: '#30363d',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: (ctx) => `投入軽減率: ${ctx.parsed.x}% → 実効軽減率: ${ctx.parsed.y}%`
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            min: 0,
            max: 100,
            title: {
              display: true,
              text: '投入 軽減率 (DR %)',
              color: CHART_THEME.axis,
              font: { size: 13, weight: 'bold' }
            },
            grid: { color: CHART_THEME.grid },
            ticks: { color: CHART_THEME.axis }
          },
          y: {
            min: 0,
            max: 100,
            title: {
              display: true,
              text: '実効 軽減率 (%)',
              color: CHART_THEME.axis,
              font: { size: 13, weight: 'bold' }
            },
            grid: { color: CHART_THEME.grid },
            ticks: { color: CHART_THEME.axis }
          }
        }
      }
    });
  }
}

/**
 * タブ切り替え時などにグラフサイズを再調整
 */
function resizeAllCharts() {
  if (defenseChartInstance) defenseChartInstance.resize();
  if (curvatureChartInstance) curvatureChartInstance.resize();
}
