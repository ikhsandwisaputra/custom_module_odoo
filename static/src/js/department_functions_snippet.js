/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";
import { renderToFragment } from "@web/core/utils/render";
import { rpc } from "@web/core/network/rpc";

publicWidget.registry.DepartmentFunctionsSnippet = publicWidget.Widget.extend({
    // Selector ini harus sama dengan di department_page.xml
    selector: '.s_department_functions_wrapper',

    /**
     * @override
     */
    async start() {
        await this._super.apply(this, arguments);

        // PENTING: Fix untuk Odoo Editor
        if (this.editableMode) {
            return;
        }
        
        this.$container = this.$('.functions_container');
        
        // AMBIL DEPARTMENT ID DARI ATRIBUT 'data-department-id'
        this.departmentId = this.$target.data('department-id');

        if (!this.departmentId) {
            console.warn("Department ID tidak ditemukan pada wrapper.");
            this.$container.html('<div class="alert alert-warning">Tidak dapat memuat fungsi: ID departemen tidak ditemukan.</div>');
            return;
        }

        try {
            await this._fetchAndRenderFunctions();
        } catch (err) {
            console.error("Error saat memuat snippet fungsi:", err);
            this.$container.html('<div class="alert alert-danger">Gagal memuat data fungsional.</div>');
        }
    },

    /**
     * Mengambil data fungsi dari API berdasarkan departmentId
     */
    async _fetchAndRenderFunctions() {
        // Tampilkan loading spinner
        this.$container.html(
            '<div class="col-12 text-center"><i class="fa fa-circle-o-notch fa-spin fa-3x"></i></div>'
        );

        try {
            // Panggil API BARU
            const result = await rpc('/api/get_department_functions', { 
                department_id: this.departmentId
            });

            if (result && result.success) {
                // Render menggunakan template QWeb BARU
                const renderedFragment = renderToFragment('custom_page_module.FunctionBadgesRenderer', {
                    functions: result.data
                });
                
                this.$container.empty().append(renderedFragment);
            } else {
                this.$container.html(
                    '<div class="col-12"><div class="alert alert-warning" role="alert">Fungsi tidak ditemukan.</div></div>'
                );
            }
        } catch (error) {
            console.error("Gagal mengambil data Fungsi:", error);
            this.$container.html(
                '<div class="col-12"><div class="alert alert-danger" role="alert">Terjadi error saat memuat data fungsional.</div></div>'
            );
        }
    },
});

export default publicWidget.registry.DepartmentFunctionsSnippet;