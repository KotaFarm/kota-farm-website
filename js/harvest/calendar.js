/* ──────────────────────────────────────────────────────────────
   Harvest — Seasonality calendar (month × crop heatmap)

   Answers "when is this crop actually available on our land?" using
   nothing but the harvest log: date + crop + weight.

   Deliberate choices:
     - Aggregates by CALENDAR MONTH across all years. Seasonality is a
       "which month" question, so 2026 and 2027 March collapse together.
       With one season logged that's a no-op; it improves on its own.
     - Ignores the period filter. "Seasonality of This Month" is
       meaningless — the calendar is always all-time and says so.
     - Excludes Harvest.BASELINE. Those are lifetime pre-tracking totals
       with no dates attached, so they can't be placed in a month.
     - Cells show the number as well as the colour, so the data survives
       colour-blindness, greyscale printing, and small screens.
   ────────────────────────────────────────────────────────────── */

(function (Harvest) {
    'use strict';

    var esc = Harvest.utils.esc;

    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];

    // Rows shown before "Show all crops" is clicked.
    var COLLAPSED_ROWS = 12;

    // Number of colour steps above zero (must match .lvl-N rules in harvest.css).
    var LEVELS = 4;

    var expanded = false;

    // ── Aggregate: [{ crop, total, months:[12], counts:[12] }] ─────
    function buildMatrix(data) {
        var byCrop = {};

        data.forEach(function (e) {
            if (!e._date || !e.crop) return;
            var m = e._date.getMonth();
            if (isNaN(m)) return;

            if (!byCrop[e.crop]) {
                byCrop[e.crop] = {
                    crop: e.crop,
                    total: 0,
                    months: new Array(12).fill(0),
                    counts: new Array(12).fill(0)
                };
            }
            var row = byCrop[e.crop];
            var kg = e.weight || 0;
            row.months[m] += kg;
            row.counts[m] += 1;
            row.total += kg;
        });

        // Heaviest crops first — that's the order people scan for.
        return Object.keys(byCrop)
            .map(function (k) { return byCrop[k]; })
            .sort(function (a, b) { return b.total - a.total; });
    }

    // Bucket a cell into 0..LEVELS. Uses the square root of the ratio so
    // light months stay visible next to a very heavy one (tomatoes at
    // 100 kg would otherwise flatten everything else to level 1).
    function levelFor(kg, max) {
        if (!kg) return 0;
        if (max <= 0) return 0;
        var scaled = Math.sqrt(kg / max);
        return Math.max(1, Math.min(LEVELS, Math.ceil(scaled * LEVELS)));
    }

    function formatKg(kg) {
        if (kg >= 100) return Math.round(kg) + '';
        if (kg >= 10) return kg.toFixed(0);
        return kg.toFixed(1).replace(/\.0$/, '');
    }

    function cellLabel(crop, monthIdx, kg, count) {
        if (!kg) return crop + ' — nothing harvested in ' + MONTHS_FULL[monthIdx];
        return crop + ' — ' + kg.toFixed(2) + ' kg in ' + MONTHS_FULL[monthIdx]
             + ' across ' + count + (count === 1 ? ' harvest' : ' harvests');
    }

    // ── Render ─────────────────────────────────────────────────────
    function render() {
        var mount = document.getElementById('hv-calendar');
        if (!mount) return;

        var all = Harvest.state.allData || [];
        var rows = buildMatrix(all);

        if (!rows.length) {
            mount.innerHTML = '<p class="hv-cal-empty">No dated harvests yet — '
                            + 'the calendar fills in as entries are logged.</p>';
            return;
        }

        // Scale is relative to the single heaviest crop-month in the data.
        var max = 0;
        rows.forEach(function (r) {
            r.months.forEach(function (kg) { if (kg > max) max = kg; });
        });

        var visible = expanded ? rows : rows.slice(0, COLLAPSED_ROWS);
        var hidden = rows.length - visible.length;
        var currentCrop = Harvest.state.currentCrop;
        var currentMonth = new Date().getMonth();

        var html = '';

        html += '<div class="hv-cal-scroll">';
        html += '<table class="hv-cal-table">';
        html += '<caption class="hv-visually-hidden">Harvest weight by crop and calendar month</caption>';

        // Header row
        html += '<thead><tr><th scope="col" class="hv-cal-corner">Crop</th>';
        MONTHS.forEach(function (m, i) {
            html += '<th scope="col" class="hv-cal-month'
                 + (i === currentMonth ? ' is-now' : '') + '">' + esc(m) + '</th>';
        });
        html += '</tr></thead><tbody>';

        // Data rows
        visible.forEach(function (r) {
            var selected = currentCrop === r.crop;
            html += '<tr class="hv-cal-row' + (selected ? ' is-selected' : '') + '">';
            html += '<th scope="row" class="hv-cal-crop">'
                 +    '<button type="button" class="hv-cal-crop-btn" data-crop="' + esc(r.crop) + '"'
                 +      ' aria-pressed="' + (selected ? 'true' : 'false') + '"'
                 +      ' title="' + esc(r.crop) + ' — ' + r.total.toFixed(1) + ' kg total. Click to filter the page.">'
                 +      esc(r.crop)
                 +    '</button>'
                 + '</th>';

            r.months.forEach(function (kg, i) {
                var lvl = levelFor(kg, max);
                html += '<td class="hv-cal-cell lvl-' + lvl + (i === currentMonth ? ' is-now' : '') + '"'
                     +   ' data-crop="' + esc(r.crop) + '"'
                     +   ' title="' + esc(cellLabel(r.crop, i, kg, r.counts[i])) + '">'
                     +   (kg ? '<span>' + esc(formatKg(kg)) + '</span>' : '')
                     + '</td>';
            });
            html += '</tr>';
        });

        html += '</tbody></table></div>';

        // Legend + footnote
        html += '<div class="hv-cal-footer">';
        html += '<div class="hv-cal-legend"><span class="hv-cal-legend-label">Less</span>';
        for (var l = 0; l <= LEVELS; l++) {
            html += '<span class="hv-cal-swatch lvl-' + l + '" aria-hidden="true"></span>';
        }
        html += '<span class="hv-cal-legend-label">More</span>'
             +  '<span class="hv-cal-legend-unit">kg harvested</span></div>';

        if (hidden > 0 || expanded) {
            html += '<button type="button" class="hv-cal-toggle" id="hv-cal-toggle">'
                 +    (expanded ? 'Show top ' + COLLAPSED_ROWS + ' crops' : 'Show all ' + rows.length + ' crops')
                 + '</button>';
        }
        html += '</div>';

        mount.innerHTML = html;
        wire(mount);
    }

    // Clicking a crop name or any of its cells filters the whole page;
    // clicking the already-selected crop clears the filter.
    function wire(mount) {
        function toggleCrop(crop) {
            if (!crop) return;
            if (Harvest.state.currentCrop === crop) Harvest.ui.clearCrop({ silent: true });
            else Harvest.ui.selectCrop(crop);
        }

        Array.prototype.forEach.call(
            mount.querySelectorAll('.hv-cal-crop-btn, .hv-cal-cell'),
            function (el) {
                el.addEventListener('click', function () { toggleCrop(el.dataset.crop); });
            }
        );

        var toggle = mount.querySelector('#hv-cal-toggle');
        if (toggle) {
            toggle.addEventListener('click', function () {
                expanded = !expanded;
                render();
                // Keep focus on the control the user just pressed.
                var again = document.getElementById('hv-cal-toggle');
                if (again) again.focus();
            });
        }
    }

    Harvest.calendar = {
        render: render,
        buildMatrix: buildMatrix,
        levelFor: levelFor
    };

})(window.Harvest = window.Harvest || {});
