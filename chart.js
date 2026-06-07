// 化学品市況インテリジェンス - チャート機能
// chart.js (外部ファイル)

window._CD = window._CD || {};
window._CI = {};

document.addEventListener('DOMContentLoaded', function() {

  // 行クリック → チャート開閉
  document.addEventListener('click', function(e) {
    if (e.target.closest('.period-select') || e.target.tagName === 'OPTION') return;
    var row = e.target.closest('.data-row');
    if (!row) return;
    var rowId = row.dataset.chartid;
    if (!rowId) return;
    var chartRow = document.getElementById(rowId);
    if (!chartRow) return;
    var icon = row.querySelector('.expand-icon');
    var hidden = chartRow.style.display === 'none';
    chartRow.style.display = hidden ? '' : 'none';
    if (icon) icon.classList.toggle('open', hidden);
    if (hidden && !window._CI[rowId]) initChart(rowId, 99999);
  });
});

// プルダウン変更時
function onPeriodChange(select) {
  var rowId  = select.dataset.row;
  var months = parseInt(select.value);
  if (!rowId) return;
  if (!window._CI[rowId]) {
    initChart(rowId, months);
  } else {
    updatePeriod(rowId, months);
  }
}

function filterByMonths(labels, values, months) {
  if (months >= 99999) return {labels: labels.slice(), values: values.slice()};

  // データ頻度を判定（YYYY-MM = 月次 / YYYY-MM-DD = 日次）
  var isMonthly = labels.length > 0 && labels[0].length === 7;

  var now = new Date();
  now.setMonth(now.getMonth() - months);
  var cutoff = now.toISOString().slice(0, 7);

  var fl = [], fv = [];
  labels.forEach(function(l, i) {
    if (l.slice(0, 7) >= cutoff) { fl.push(l); fv.push(values[i]); }
  });

  // 月次データは最低6点確保
  var minPoints = isMonthly ? 6 : 4;
  if (fl.length < minPoints) {
    var take = Math.min(Math.max(months * (isMonthly ? 3 : 1), minPoints), labels.length);
    return {labels: labels.slice(-take), values: values.slice(-take)};
  }
  return {labels: fl, values: fv};
}

function metaText(values, unit) {
  if (!values.length) return '';
  var mn  = Math.min.apply(null, values);
  var mx  = Math.max.apply(null, values);
  var avg = values.reduce(function(a,b){return a+b;}, 0) / values.length;
  return '最小: ' + mn.toLocaleString() +
         '  最大: ' + mx.toLocaleString() +
         '  平均: ' + Math.round(avg * 100) / 100 +
         '  (' + values.length + '件)  単位: ' + unit;
}

function initChart(rowId, months) {
  var info   = window._CD[rowId];
  var canvas = document.getElementById('canvas-' + rowId);
  var metaEl = document.getElementById('meta-' + rowId);
  if (!canvas) return;
  if (!info || !info.data || !info.data.labels || !info.data.labels.length) {
    if (metaEl) metaEl.textContent = 'データ蓄積中（毎日自動更新）';
    return;
  }
  var d = info.data;
  var filtered = filterByMonths(d.labels, d.values, months || 99999);
  if (metaEl) metaEl.textContent = metaText(filtered.values, info.unit);

  window._CI[rowId] = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: filtered.labels,
      datasets: [{
        data: filtered.values,
        borderColor: '#d9161c',
        borderWidth: 1.5,
        pointRadius: filtered.values.length > 60 ? 0 : 3,
        pointHoverRadius: 5,
        tension: 0.3,
        fill: true,
        backgroundColor: 'rgba(217,22,28,0.05)'
      }]
    },
    options: {
      responsive: true,
      animation: {duration: 200},
      plugins: {
        legend: {display: false},
        tooltip: {
          callbacks: {
            label: function(ctx) {
              return ctx.parsed.y.toLocaleString() + ' ' + info.unit;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {font: {size: 10}, maxTicksLimit: 12, maxRotation: 0},
          grid: {color: '#f5f5f5'}
        },
        y: {
          ticks: {
            font: {size: 10},
            callback: function(v) { return v.toLocaleString(); }
          },
          grid: {color: '#f5f5f5'}
        }
      }
    }
  });
}

function updatePeriod(rowId, months) {
  var inst   = window._CI[rowId];
  var info   = window._CD[rowId];
  var metaEl = document.getElementById('meta-' + rowId);
  if (!inst || !info || !info.data) return;
  var d = info.data;
  var filtered = filterByMonths(d.labels, d.values, months);
  inst.data.labels           = filtered.labels;
  inst.data.datasets[0].data = filtered.values;
  inst.data.datasets[0].pointRadius = filtered.values.length > 60 ? 0 : 3;
  inst.update();
  if (metaEl) metaEl.textContent = metaText(filtered.values, info.unit);
}
