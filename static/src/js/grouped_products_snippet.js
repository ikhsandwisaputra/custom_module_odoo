/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";
import { renderToFragment } from "@web/core/utils/render";
import { rpc } from "@web/core/network/rpc";

publicWidget.registry.GroupedProductSnippet = publicWidget.Widget.extend({
    // Selector ini harus sama dengan di department_page.xml
    selector: '.s_grouped_products_wrapper',

    /**
     * @override
     */
    async start() {
        await this._super.apply(this, arguments);

        // PENTING: Fix untuk Odoo Editor
        if (this.editableMode) {
            return;
        }
        
        this.$container = this.$('.grouped_products_container');

        try {
            await this._fetchAndRenderGroupedProducts();
        } catch (err) {
            console.error("Error saat memuat snippet produk terkelompok:", err);
            this.$container.html('<div class="alert alert-danger">Gagal memuat data layanan.</div>');
        }
    },

    /**
     * Mengambil data dari API baru
     */
    async _fetchAndRenderGroupedProducts() {
        // Tampilkan loading spinner
        this.$container.html(
            '<div class="col-12 text-center"><i class="fa fa-circle-o-notch fa-spin fa-3x"></i></div>'
        );

        try {
            // Panggil API BARU
            const result = await rpc('/api/get_products_grouped_by_category', {});

            if (result && result.success) {
                // Render menggunakan template QWeb BARU
                const renderedFragment = renderToFragment('custom_page_module.GroupedProductListRenderer', {
                    groups: result.data
                });
                
                this.$container.empty().append(renderedFragment);
            } else {
                this.$container.html(
                    '<div class="col-12"><div class="alert alert-warning" role="alert">Layanan tidak ditemukan.</div></div>'
                );
            }
        } catch (error) {
            console.error("Gagal mengambil data Layanan:", error);
            this.$container.html(
                '<div class="col-12"><div class="alert alert-danger" role="alert">Terjadi error saat memuat data layanan.</div></div>'
            );
        }
    },
});

export default publicWidget.registry.GroupedProductSnippet;