# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request
import json
import re # Impor modul regular expression

class DynamicDataController(http.Controller):
    
    # Fungsi helper untuk membuat slug yang bersih (URL cantik)
    def _create_slug(self, name):
        if not name:
            return ''
        # Ganti spasi dengan strip
        s = name.lower().replace(' ', '-')
        # Hapus karakter non-alfanumerik atau non-strip
        s = re.sub(r'[^a-z0-9\-]', '', s)
        # Hapus strip berlebih
        return re.sub(r'-+', '-', s).strip('-')

    # ==========================================================
    # KONTROLER 1: Untuk URL SLUG/NAMA (PUBLIK)
    # Ini akan menangani URL seperti /lab/lab-jaringan-12
    # ==========================================================
    @http.route('/lab/<string:lab_slug>', type='http', auth='public', website=True, sitemap=True)
    def lab_detail_page_slug(self, lab_slug, **kwargs):
        """
        Controller untuk slug nama, sekarang PUBLIK.
        Contoh: /lab/lab-jaringan
        """
        # Cari lab yang cocok dengan slug
        all_labs = request.env['hr.department'].sudo().search([])
        lab_found = None
        for lab in all_labs:
            # Pastikan lab punya nama sebelum membuat slug
            if lab.name and self._create_slug(lab.name) == lab_slug:
                lab_found = lab
                break
        
        if not lab_found:
            # Jika slug tidak ditemukan, tampilkan 404
            return request.not_found()

        # ==== LOGIKA BARU: "COPY ON WRITE" ====
        # Cari halaman website.page yang spesifik untuk URL ini
        page = request.env['website.page'].sudo().search([
            ('url', '=', f'/lab/{lab_slug}')
        ], limit=1)

        if not page:
            # JIKA HALAMAN BELUM ADA, KITA DUPLIKASI TEMPLATE-NYA
            website = request.env['website'].get_current_website()
            
            # 1. Dapatkan arsitektur XML dari template dasar
            # PENTING: Kita ref template yang sudah kita perbaiki (dengan drop zone)
            base_template = request.env.ref('custom_page_module.department_detail_page').sudo()
            base_arch = base_template.arch_base
            
            # 2. Buat kunci unik untuk view baru
            view_key = f"custom_page_module.page_lab_{lab_slug.replace('-', '_')}"

            # 3. Buat 'ir.ui.view' (XML) baru sebagai salinan
            new_view = request.env['ir.ui.view'].sudo().create({
                'name': f"Halaman Lab: {lab_found.name}",
                'key': view_key,
                'type': 'qweb',
                'arch_base': base_arch, # Salin arsitektur dari template dasar
                'website_id': website.id,
                'inherit_id': False, # Ini adalah template mandiri, bukan turunan
            })
            
            # 4. Buat 'website.page' yang menautkan URL ke VIEW BARU
            page = request.env['website.page'].sudo().create({
                'name': lab_found.name, # Nama halaman (cth: Lab Jaringan)
                'url': f'/lab/{lab_slug}', # URL unik (cth: /lab/lab-jaringan)
                'website_id': website.id,
                'view_id': new_view.id, # <--- Tautkan ke view salinan yang baru!
                'is_published': True,
            })
        # ================================================

        # Tampilkan semua data ke semua user
        values = {
            'lab': lab_found,
        }
        
        # =======================================================
        # PERBAIKAN FINAL ADA DI SINI:
        # Render 'view_id.key' YANG SPESIFIK dari halaman ('page')
        # yang sudah kita temukan atau buat.
        # JANGAN render 'custom_page_module.department_detail_page'
        # =======================================================
        return request.render(page.view_id.key, values)

    # ==========================================================
    # KONTROLER 2: Untuk URL ID (PUBLIK)
    # Ini akan menangani URL seperti /lab/12
    # ==========================================================
    @http.route('/lab/<int:lab_id>', type='http', auth='public', website=True, sitemap=False)
    def lab_detail_page_id(self, lab_id, **kwargs):
        """
        Controller untuk publik, diakses via ID.
        Contoh: /lab/12
        """
        lab = request.env['hr.department'].sudo().browse(lab_id)
        
        if not lab.exists():
            # Jika ID tidak ada, 404
            return request.not_found()

        # Jika user mengakses via ID, kita redirect ke URL slug
        # Ini bagus untuk SEO dan konsistensi
        if lab.name:
            lab_slug = self._create_slug(lab.name)
            if lab_slug:
                return request.redirect('/lab/%s' % lab_slug)

        # Fallback: jika lab tidak punya nama, tampilkan saja halamannya
        # Logika 'page' unik akan ditangani oleh controller slug setelah redirect
        values = {
            'lab': lab,
        }
        
        # Render template dengan data lengkap
        # Ini tidak masalah, karena akan di-redirect ke controller slug
        return request.render('custom_page_module.department_detail_page', values)

    # ==========================================================
    # API: get_labs
    # INI YANG PALING PENTING: API harus membuat URL SLUG
    # ==========================================================
    @http.route('/api/get_labs', type='json', auth='public', website=True)
    def get_labs(self, search='', limit=20, **kwargs):
        """API untuk mendapatkan data departemen (lab) dengan pencarian"""
        
        domain = []
        if search:
            domain = [
                '|',
                ('name', 'ilike', search),
                ('manager_id', 'ilike', search)
            ]

        labs = request.env['hr.department'].sudo().search(
            domain, 
            limit=limit, 
            order='name asc'
        )
        
        result = []
        for lab in labs:
            # ==============================================
            # PERUBAHAN KRITIS:
            # Buat URL slug untuk setiap lab
            # ==============================================
            lab_slug = self._create_slug(lab.name)
            
            # Gunakan URL slug. Jika slug kosong (nama lab kosong), pakai ID
            url = '/lab/%s' % (lab_slug if lab_slug else lab.id)
            
            result.append({
                'id': lab.id,
                'name': lab.name,
                'fakultas': lab.company_id.name if lab.company_id else '-',
                'manager': lab.manager_id.name if lab.manager_id else '-',
                'url': url # Kirim URL yang sudah benar
            })
        
        return {
            'success': True,
            'data': result,
            'total': len(result)
        }

# ==========================================================
    # BARU: API UNTUK KARTU PRODUK (DENGAN FILTER)
    # ==========================================================
    @http.route('/api/get_product_cards', type='json', auth='public', website=True)
    def get_product_cards(self, search='', category_id=0, **kwargs):
        """API untuk mendapatkan data produk dengan filter"""
        try:
            domain = [('website_published', '=', True)]
            
            if search:
                domain.append(('name', 'ilike', search))
                
            if category_id:
                # Menggunakan 'child_of' untuk mencakup sub-kategori
                domain.append(('public_categ_ids', 'child_of', int(category_id)))

            products = request.env['product.template'].sudo().search(domain, order='name asc')
            
            result = []
            for product in products:
                result.append({
                    'id': product.id,
                    'name': product.name,
                    # Menggunakan 'list_price' (harga jual)
                    'price': product.list_price, 
                    # 'website_url' adalah URL SEO-friendly yang sudah jadi
                    'url': product.website_url or '/shop/product/%s' % product.id,
                    # Menggunakan image_256 untuk kualitas yang lebih baik di kartu
                    'image': '/web/image/product.template/%s/image_256' % product.id
                })
            
            return {
                'success': True,
                'data': result,
                'total': len(result)
            }
        except Exception as e:
            return { 'success': False, 'error': str(e) }

    @http.route('/api/get_products', type='json', auth='public', website=True)
    def get_products(self, limit=10):
        """API untuk mendapatkan data produk real-time"""
        products = request.env['product.template'].sudo().search([], limit=limit, order='write_date desc')
        
        result = []
        for product in products:
            result.append({
                'id': product.id,
                'name': product.name,
                'type': product.type,
                'image': '/web/image/product.template/%s/image_128' % product.id if product.image_128 else False,
                'write_date': product.write_date.strftime('%Y-%m-%d %H:%M:%S') if product.write_date else ''
            })
        
        return {
            'success': True,
            'data': result,
            'total': len(result)
        }
    
    @http.route('/api/get_employees', type='json', auth='public', website=True)
    def get_employees(self, limit=10):
        """API untuk mendapatkan data karyawan real-time"""
        employees = request.env['hr.employee'].sudo().search([], limit=limit, order='write_date desc')
        
        result = []
        for emp in employees:
            result.append({
                'id': emp.id,
                'name': emp.name,
                'job_title': emp.job_title or '-',
                'work_email': emp.work_email or '-',
                'image': '/web/image/hr.employee/%s/image_128' % emp.id if emp.image_128 else False,
            })
        
        return {
            'success': True,
            'data': result,
            'total': len(result)
        }
    
    @http.route('/api/get_companies', type='json', auth='public', website=True)
    def get_companies(self, limit=10):
        """API untuk mendapatkan data perusahaan real-time"""
        companies = request.env['res.company'].sudo().search([], limit=limit)
        
        result = []
        for company in companies:
            dept_count = request.env['hr.department'].sudo().search_count([
                ('company_id', '=', company.id)
            ])
            result.append({
                'id': company.id,
                'name': company.name,
                'department_count': dept_count
            })
        
        return {
            'success': True,
            'data': result,
            'total': len(result)
        }
    
    @http.route('/api/get_departments', type='json', auth='public', website=True)
    def get_departments(self, limit=10):
        """API untuk mendapatkan data departemen real-time"""
        departments = request.env['hr.department'].sudo().search([], limit=limit)
        
        result = []
        for dept in departments:
            result.append({
                'id': dept.id,
                'name': dept.name,
                'company_name': dept.company_id.name if dept.company_id else '-'
            })
        
        return {
            'success': True,
            'data': result,
            'total': len(result)
        }

