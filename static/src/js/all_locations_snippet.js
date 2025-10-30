/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";
import { renderToFragment } from "@web/core/utils/render";
import { rpc } from "@web/core/network/rpc";

publicWidget.registry.AllLocationsSnippet = publicWidget.Widget.extend({
    // Selector ini harus sama dengan di department_page.xml
    selector: '.s_all_locations_wrapper',

    /**
     * @override
     */
    async start() {
        await this._super.apply(this, arguments);

        // PENTING: Fix untuk Odoo Editor
        if (this.editableMode) {
            return;
        }
        
        this.$container = this.$('.locations_container');

        try {
            await this._fetchAndRenderLocations();
        } catch (err) {
            console.error("Error saat memuat snippet lokasi:", err);
            this.$container.html('<div class="alert alert-danger">Gagal memuat data lokasi.</div>');
        }
    },

    /**
     * Mengambil data lokasi dari API
     */
    async _fetchAndRenderLocations() {
        // Tampilkan loading spinner
        this.$container.html(
            '<div class="col-12 text-center"><i class="fa fa-circle-o-notch fa-spin fa-3x"></i></div>'
        );

        try {
            // Panggil API BARU
            const result = await rpc('/api/get_all_locations', {});

            if (result && result.success) {
                // Render menggunakan template QWeb yang baru dibuat
                const renderedFragment = renderToFragment('custom_page_module.AllLocationsRenderer', {
                    locations: result.data
                });
                
                this.$container.empty().append(renderedFragment);
            } else {
                this.$container.html(
                    '<div class="col-12"><div class="alert alert-warning" role="alert">Lokasi tidak ditemukan.</div></div>'
                );
            }
        } catch (error) {
            console.error("Gagal mengambil data Lokasi:", error);
            this.$container.html(
                '<div class="col-12"><div class="alert alert-danger" role="alert">Terjadi error saat memuat data lokasi.</div></div>'
            );
        }
    },
});

export default publicWidget.registry.AllLocationsSnippet;