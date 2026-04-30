/* ──────────────────────────────────────────────────────────────
   Harvest — boot
   The only file that reaches into the DOM directly at startup.
   Loaded last so every Harvest.* namespace exists before we wire.
   ────────────────────────────────────────────────────────────── */

(function (Harvest) {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        Harvest.ui.wireFilters();
        Harvest.data.load();
    });

})(window.Harvest = window.Harvest || {});
