{
    'name': 'Modul Halaman Kustom',
    'version': '1.0',
    # ...
    'author': 'Nama Anda',
    'website': 'https://website-anda.com',
    'category': 'Website',
    'depends': [
        'base',
        'website',
        'product',  
        'hr',
    ],
    'data': [
        'security/ir.model.access.csv', 
        
        'views/templates.xml',
        'views/snippets.xml', 
        
        # ==============================================
        # LANGKAH 3: TAMBAHKAN FILE XML HALAMAN DETAIL
        # ==============================================
        'views/department_page.xml',
        # ==============================================
        # AKHIR LANGKAH 3
        # ==============================================
    ],
    
    # INI BAGIAN PENTING UNTUK ASET
    'assets': {
        'web.assets_frontend': [
            'custom_page_module/static/src/js/dynamic_snippet.js',
            'custom_page_module/static/src/js/lab_card_snippet.js',
            'custom_page_module/static/src/js/product_card_snippet.js',
            'custom_page_module/static/src/js/department_team_snippet.js',
            'custom_page_module/static/src/js/all_locations_snippet.js',
            'custom_page_module/static/src/js/grouped_products_snippet.js',
            'custom_page_module/static/src/js/department_functions_snippet.js',
            'custom_page_module/static/src/xml/dynamic_content.xml',
        ],
    },

    'installable': True,
    'application': False,
    'auto_install': False,
}