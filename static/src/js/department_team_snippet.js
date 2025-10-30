/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";
import { renderToFragment } from "@web/core/utils/render";
import { rpc } from "@web/core/network/rpc";

publicWidget.registry.DepartmentTeamSnippet = publicWidget.Widget.extend({
    // Selector ini harus sama dengan di department_page.xml
    selector: '.s_department_team_wrapper',

    /**
     * @override
     */
    async start() {
        await this._super.apply(this, arguments);
        
        this.$container = this.$('.team_cards_container');
        
        // AMBIL DEPARTMENT ID DARI ATRIBUT 'data-department-id'
        this.departmentId = this.$target.data('department-id');

        if (!this.departmentId) {
            console.warn("Department ID tidak ditemukan pada wrapper.");
            this.$container.html('<div class="alert alert-warning">Tidak dapat memuat tim: ID departemen tidak ditemukan.</div>');
            return;
        }

        try {
            await this._fetchAndRenderTeam();
        } catch (err) {
            console.error("Error saat memuat snippet tim:", err);
            this.$container.html('<div class="alert alert-danger">Gagal memuat data tim.</div>');
        }
    },

    /**
     * Mengambil data tim dari API berdasarkan departmentId
     */
    async _fetchAndRenderTeam() {
        // Tampilkan loading spinner
        this.$container.html(
            '<div class="col-12 text-center"><i class="fa fa-circle-o-notch fa-spin fa-3x"></i></div>'
        );

        try {
            // Panggil API BARU dengan 'department_id'
            const result = await rpc('/api/get_department_employees', { 
                department_id: this.departmentId
            });

            if (result && result.success) {
                // Render menggunakan template QWeb yang baru dibuat
                const renderedFragment = renderToFragment('custom_page_module.EmployeeCardRenderer', {
                    employees: result.data
                });
                
                this.$container.empty().append(renderedFragment);
            } else {
                this.$container.html(
                    '<div class="col-12"><div class="alert alert-warning" role="alert">Tim tidak ditemukan.</div></div>'
                );
            }
        } catch (error) {
            console.error("Gagal mengambil data Tim:", error);
            this.$container.html(
                '<div class="col-12"><div class="alert alert-danger" role="alert">Terjadi error saat memuat data tim.</div></div>'
            );
        }
    },
});

export default publicWidget.registry.DepartmentTeamSnippet;