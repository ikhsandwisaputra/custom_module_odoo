/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";
// PERBAIKAN: Impor 'renderToFragment' BUKAN 'renderToElement'
import { renderToFragment } from "@web/core/utils/render";
import { rpc } from "@web/core/network/rpc";
import { debounce } from "@web/core/utils/timing";

publicWidget.registry.LabCardSnippet = publicWidget.Widget.extend({
    selector: '.s_lab_cards_wrapper',
    events: {
        'input .lab-search-input': '_onSearchInput',
    },

    init() {
        this._super.apply(this, arguments);
        this._onSearchInput = debounce(this._onSearchInput.bind(this), 300);
    },

    async start() {
        await this._super.apply(this, arguments);
        
        this.$container = this.$('.lab_cards_container');
        this.$searchInput = this.$('.lab-search-input');
        
        try {
            await this._fetchAndRenderLabs();
        } catch (err) {
            console.error("Error saat initial load Lab Cards:", err);
        }
    },

    _onSearchInput(ev) {
        const searchValue = ev.currentTarget.value;
        this._fetchAndRenderLabs(searchValue);
    },

    async _fetchAndRenderLabs(search = '') {
        this.$container.html(
            '<div class="col-12 text-center"><i class="fa fa-circle-o-notch fa-spin fa-3x"></i></div>'
        );

        try {
            const result = await rpc('/api/get_labs', { search: search });

            if (result && result.success) {
                // --- INI PERBAIKANNYA ---
                // 1. Gunakan 'renderToFragment'
                const renderedFragment = renderToFragment('custom_page_module.LabCardRenderer', {
                    labs: result.data
                });
                
                // 2. Gunakan .append() untuk memasukkan fragment
                this.$container.empty().append(renderedFragment);
                // -------------------------

            } else {
                this.$container.html(
                    '<div class="col-12"><div class="alert alert-warning" role="alert">Data lab tidak ditemukan.</div></div>'
                );
            }
        } catch (error) {
            console.error("Gagal mengambil data Lab:", error);
            this.$container.html(
                '<div class="col-12"><div class="alert alert-danger" role="alert">Terjadi error saat memuat data. Silakan cek console log (F12) untuk detail.</div></div>'
            );
        }
    },
});

export default publicWidget.registry.LabCardSnippet;