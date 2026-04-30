/* ──────────────────────────────────────────────────────────────
   Harvest — Chart.js renderers (Top Crops + Trend)
   ────────────────────────────────────────────────────────────── */

(function (Harvest) {
    'use strict';

    var COLORS = Harvest.COLORS;
    var PALETTE = Harvest.CROP_PALETTE;

    // Chart.js global defaults — applied once at module load.
    Chart.defaults.font.family = "'Work Sans', sans-serif";
    Chart.defaults.color = COLORS.earthMd;
    Chart.defaults.borderColor = 'rgba(139,152,98,0.18)';

    // Top Crops by weight — horizontal bar chart, top 8.
    function renderCrops(filtered) {
        var withBaseline = Harvest.ui.withBaseline;
        var crops = {};
        filtered.forEach(function (e) {
            crops[e.crop] = (crops[e.crop] || 0) + (e.weight || 0);
        });
        crops = withBaseline(crops);

        var sorted = Object.keys(crops)
            .map(function (k) { return { name: k, kg: crops[k] }; })
            .sort(function (a, b) { return b.kg - a.kg; })
            .slice(0, 8);

        var charts = Harvest.state.charts;
        if (charts.crops) charts.crops.destroy();
        charts.crops = new Chart(document.getElementById('hv-chart-crops'), {
            type: 'bar',
            data: {
                labels: sorted.map(function (c) { return c.name; }),
                datasets: [{
                    label: 'kg',
                    data: sorted.map(function (c) { return c.kg; }),
                    backgroundColor: sorted.map(function (_, i) { return PALETTE[i % PALETTE.length]; }),
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: function (ctx) { return ctx.parsed.x.toFixed(2) + ' kg'; } } }
                },
                scales: {
                    x: { beginAtZero: true, ticks: { callback: function (v) { return v + ' kg'; } } },
                    y: { grid: { display: false } }
                }
            }
        });
    }

    // Harvest Over Time — line chart by month.
    function renderTrend(filtered) {
        var monthKey = Harvest.utils.monthKey;
        var monthLabel = Harvest.utils.monthLabel;

        var byMonth = {};
        filtered.forEach(function (e) {
            if (!e._date) return;
            var k = monthKey(e._date);
            byMonth[k] = (byMonth[k] || 0) + (e.weight || 0);
        });
        var keys = Object.keys(byMonth).sort();

        var charts = Harvest.state.charts;
        if (charts.trend) charts.trend.destroy();
        charts.trend = new Chart(document.getElementById('hv-chart-trend'), {
            type: 'line',
            data: {
                labels: keys.map(monthLabel),
                datasets: [{
                    label: 'kg harvested',
                    data: keys.map(function (k) { return byMonth[k]; }),
                    borderColor: COLORS.leaf,
                    backgroundColor: 'rgba(90,122,58,0.18)',
                    fill: true,
                    tension: 0.35,
                    borderWidth: 2.5,
                    pointBackgroundColor: COLORS.leaf,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: function (ctx) { return ctx.parsed.y.toFixed(1) + ' kg'; } } }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: { beginAtZero: true, ticks: { callback: function (v) { return v + ' kg'; } } }
                }
            }
        });
    }

    Harvest.charts = {
        renderCrops: renderCrops,
        renderTrend: renderTrend
    };

})(window.Harvest = window.Harvest || {});
