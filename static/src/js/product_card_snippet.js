/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";
import { renderToFragment } from "@web/core/utils/render";
import { rpc } from "@web/core/network/rpc";

publicWidget.registry.ProductCardSnippet = publicWidget.Widget.extend({
    // Selector ini harus sama dengan di department_page.xml
    selector: '.s_product_cards_wrapper',
    events: {
        'click .product-category-btn': '_onCategoryClick',
    },

    /**
     * @override
     */
    async start() {
        await this._super.apply(this, arguments);
        
        this.$filterContainer = this.$('.product_category_filters');
        this.$cardsContainer = this.$('.product_cards_container');
        this.currentCategoryId = 0; // 0 berarti "Semua Kategori"

        // Muat kategori dan produk secara paralel
        try {
            await Promise.all([
                this._fetchAndRenderCategories(),
                this._fetchAndRenderProducts()
            ]);
        } catch (err) {
            console.error("Error saat memuat snippet produk:", err);
            this.$cardsContainer.html('<div class="alert alert-danger">Gagal memuat data produk.</div>');
        }
    },

    // --------------------------------------------------------------------------
    // Handler Event
    // --------------------------------------------------------------------------

    /**
     * Dipanggil saat tombol kategori di-klik
     * @param {Event} ev
     */
    _onCategoryClick(ev) {
        ev.preventDefault();
        const $target = $(ev.currentTarget);
        this.currentCategoryId = $target.data('id');
        
        // Update tampilan tombol yang aktif
        this.$('.product-category-btn').removeClass('btn-primary').addClass('btn-secondary');
        $target.removeClass('btn-secondary').addClass('btn-primary');
        
        // Muat ulang produk berdasarkan kategori yang dipilih
        this._fetchAndRenderProducts();
    },

    // --------------------------------------------------------------------------
    // Metode Private
    // --------------------------------------------------------------------------

    /**
     * Mengambil data kategori dari API dan merendernya sebagai tombol
     */
    async _fetchAndRenderCategories() {
        const result = await rpc('/api/get_product_categories', {});
        
        if (result && result.success) {
            // Buat HTML untuk tombol
            let buttonsHtml = `
                <button class="btn btn-primary btn-sm product-category-btn m-1" data-id="0">
                    Semua Kategori
                </button>
            `;
            
            result.data.forEach(cat => {
                buttonsHtml += `
                    <button class="btn btn-secondary btn-sm product-category-btn m-1" data-id="${cat.id}">
                        ${cat.name}
                    </button>
                `;
            });
            
            this.$filterContainer.html(buttonsHtml);
        } else {
            this.$filterContainer.html('<div class="small text-danger">Gagal memuat filter.</div>');
        }
    },

    /**
     * Mengambil data produk dari API berdasarkan kategori saat ini
     */
    async _fetchAndRenderProducts() {
        // Tampilkan loading spinner
        this.$cardsContainer.html(
            '<div class="col-12 text-center"><i class="fa fa-circle-o-notch fa-spin fa-3x"></i></div>'
        );

        try {
            // Panggil API yang SUDAH ADA, tapi sekarang dengan 'category_id'
            const result = await rpc('/api/get_product_cards', { 
                category_id: this.currentCategoryId,
                search: '' // Anda bisa tambahkan input pencarian jika mau
            });

            if (result && result.success) {
                // Render menggunakan template QWeb yang baru dibuat
                const renderedFragment = renderToFragment('custom_page_module.ProductCardRenderer', {
                    products: result.data
                });
                
                this.$cardsContainer.empty().append(renderedFragment);
            } else {
                this.$cardsContainer.html(
                    '<div class="col-12"><div class="alert alert-warning" role="alert">Produk tidak ditemukan.</div></div>'
                );
            }
        } catch (error) {
            console.error("Gagal mengambil data Produk:", error);
            this.$cardsContainer.html(
                '<div class="col-12"><div class="alert alert-danger" role="alert">Terjadi error saat memuat data produk.</div></div>'
            );
        }
    },
});

export default publicWidget.registry.ProductCardSnippet;