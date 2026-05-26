// 化学品市況インテリジェンス - チャート機能
// chart.js (外部ファイル - f-stringエスケープ問題を回避)

window._CD = window._CD || {};
window._CI = {};

document.addEventListener('DOMContentLoaded', function() {

  // 行クリック → チャート開閉
  document.addEventListener('click', function(e) {
    if (e.target.closest('.pbtn')) return;
    const row = e.target.closest('.data-row');
    if (!row) return;
    const rowId = row.dataset.chartid;
    if (!rowId) return;
    const chartRow = document.getElementById(rowId);
    if (!chartRow) return;
    const icon = row.querySelector('.expand-icon');
    const hidden = chartRow.style.display === 'none';
    chartRow.style.display = hidden ? '' : 'none';
    if (icon) icon.classList.toggle('open', hidden);
    if (hidden && !window._CI[rowId]) initChart(rowId);
  });

  // 期間ボタン
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.pbtn');
    if (!btn) return;
    e.stopPropagation();
    const rowId = btn.dataset.row;
    const yr    = parseInt(btn.dataset.yr);
    if (!rowId) return;
    btn.closest('.chart-period-btns')
       .querySelectorAll('.pbtn')
       .forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (!window._CI[rowId]) initChart(rowId);
    updatePeriod(rowId, yr);
  });
});

function filterData(labels, values, years) {
  if (years >= 99) return {labels: labels.slice(), values: values.slice()};
  const now = new Date();
  now.setFullYear(now.getFullYear() - years);
  const cutoff = now.toISOString().slice(0, 7);
  const fl = [], fv = [];
  labels.forEach(function(l, i) {
    if (l.slice(0, 7) >= cutoff) { fl.push(l); fv.push(values[i]); }
  });
  return fl.length > 0 ? {labels: fl, values: fv} : {labels: labels.slice(), values: values.slice()};
}

function metaText(labels, values, unit) {
  if (!values.length) return '';
  var mn = Math.min.apply(null, values);
  var mx = Math.max.apply(null, values);
  var av = values.reduce(function(a,b){return a+b;}, 0) / values.length;
  return '最小: ' + mn.toLocaleString() +
         '  最大: ' + mx.toLocaleString() +
         '  平均: ' + Math.round(av).toLocaleString() +
         '  (' + values.length + '件)  単位: ' + unit;
}

function initChart(rowId) {
  var info   = window._CD[rowId];
  var canvas = document.getElementById('canvas-' + rowId);
  var metaEl = document.getElementById('meta-' + rowId);
  if (!canvas) return;
  if (!info || !info.data || !info.data.labels || !info.data.labels.length) {
    if (metaEl) metaEl.textContent = 'データ蓄積中（毎日自動更新）';
    return;
  }
  var d = info.data;
  if (metaEl) metaEl.textContent = metaText(d.labels, d.values, info.unit);
  window._CI[rowId] = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: d.labels.slice(),
      datasets: [{
        data: d.values.slice(),
        borderColor: '#d9161c',
        borderWidth: 1.5,
        pointRadius: d.n > 60 ? 0 : 3,
        pointHoverRadius: 5,
        tension: 0.3,
        fill: true,
        backgroundColor: 'rgba(217,22,28,0.05)'
      }]
    },
    options: {
      responsive: true,
      animation: {duration: 300},
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

function updatePeriod(rowId, years) {
  var inst   = window._CI[rowId];
  var info   = window._CD[rowId];
  var metaEl = document.getElementById('meta-' + rowId);
  if (!inst || !info || !info.data) return;
  var d = info.data;
  var filtered = filterData(d.labels, d.values, years);
  inst.data.labels           = filtered.labels;
  inst.data.datasets[0].data = filtered.values;
  inst.data.datasets[0].pointRadius = filtered.values.length > 60 ? 0 : 3;
  inst.update();
  if (metaEl) metaEl.textContent = metaText(filtered.labels, filtered.values, info.unit);
}
