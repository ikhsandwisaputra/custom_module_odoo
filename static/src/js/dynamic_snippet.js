/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";
import { renderToElement } from "@web/core/utils/render";
import { rpc } from "@web/core/network/rpc";

publicWidget.registry.DynamicTableSnippet = publicWidget.Widget.extend({
    // Target selector dari 'snippets.xml'
    selector: '.s_dynamic_table_wrapper',

    /**
     * @override
     */
    async start() {
        // Panggil super.start() dan bungkus dengan try...catch
        try {
            await this._super.apply(this, arguments);

            // Panggil semua API untuk tabel
            const proms = [
                rpc('/api/get_products', { limit: 10 }),
                rpc('/api/get_employees', { limit: 10 }),
                rpc('/api/get_companies', { limit: 10 }),
                rpc('/api/get_departments', { limit: 10 }),
            ];
            
            const [products, employees, companies, departments] = await Promise.all(proms);

            const result = {
                products: products,
                employees: employees,
                companies: companies,
                departments: departments,
            };

            // Render template OWL 'DynamicContentRenderer'
            const renderedHtml = renderToElement('custom_page_module.DynamicContentRenderer', {
                result: result
            });

            // Ganti placeholder "Loading..." dengan konten
            this.$target.empty().html(renderedHtml);

        } catch (err) {
            console.error("Gagal memuat Snippet Tabel Dinamis:", err);
            this.$target.empty().html('<div class="alert alert-danger">Gagal memuat data tabel.</div>');
        }
    },
});

export default publicWidget.registry.DynamicTableSnippet;