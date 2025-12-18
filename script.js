document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // API Configuration
    const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:5000'
        : 'https://rium-scm-backend.onrender.com';

    // Helper: Optimize Image URL using wsrv.nl proxy & handle relative paths
    function getSecureImageUrl(url, width = 0) {
        if (!url) return '';
        let cleanUrl = url.trim();

        // 1. Fix localhost/127.0.0.1 URLs (e.g. from local DB seed) to point to correct backend
        if (cleanUrl.match(/https?:\/\/(localhost|127\.0\.0\.1)/)) {
            try {
                const urlObj = new URL(cleanUrl);
                cleanUrl = `${API_BASE_URL}${urlObj.pathname}${urlObj.search}`;
            } catch (e) {
                // Fallback regex if URL parsing fails
                const path = cleanUrl.replace(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, '');
                cleanUrl = `${API_BASE_URL}${path}`;
            }
        }

        // 2. Handle protocol-relative URLs (e.g. //kdsoundmall.co.kr/...)
        if (cleanUrl.startsWith('//')) {
            cleanUrl = `https:${cleanUrl}`;
        }

        // 3. Handle relative paths (even without leading slash if it looks like a path)
        if (cleanUrl.startsWith('/') || cleanUrl.match(/^(uploads|assets|images)\//)) {
            // Ensure leading slash for concatenation
            const path = cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
            cleanUrl = `${API_BASE_URL}${path}`;
        }

        const isLocalEnv = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        // 3. Skip proxy for data URIs or if we are in local dev env (proxy can't reach localhost)
        if (cleanUrl.startsWith('data:') || (isLocalEnv && cleanUrl.includes('localhost'))) {
            return cleanUrl;
        }

        // 4. Use Proxy for HTTP (Mixed Content Fix) or for resizing
        // Only proxy if it's a public URL (http/https)
        if (cleanUrl.startsWith('http://') || (width > 0 && cleanUrl.startsWith('https://'))) {
            // For https, we only proxy if width > 0 to optimize, otherwise keep original
            if (cleanUrl.startsWith('https://') && width === 0) return cleanUrl;

            const encoded = encodeURIComponent(cleanUrl);
            let proxyUrl = `https://wsrv.nl/?url=${encoded}&output=webp`;
            if (width > 0) proxyUrl += `&w=${width}`;
            return proxyUrl;
        }

        return cleanUrl;
    }

    // Global State for Public Catalog
    let currentPublicCategory = '';

    // Initialize Public Catalog (if on products.html)
    const publicGrid = document.getElementById('publicProductGrid');
    if (publicGrid) {
        loadPublicCategories();
        loadPublicProducts();
    }

    // Load Public Categories
    async function loadPublicCategories() {
        const container = document.getElementById('categoryFilters');
        if (!container) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/categories`);
            const data = await res.json();
            const categories = data.categories || [];

            let html = `<button class="filter-btn active" onclick="window.filterPublicCategory(this, '')">All</button>`;
            categories.forEach(cat => {
                html += `<button class="filter-btn" onclick="window.filterPublicCategory(this, ${cat.id})">${cat.name}</button>`;
            });
            container.innerHTML = html;
        } catch (error) {
            console.error('Error loading categories:', error);
            container.innerHTML = '<span style="color:red;">Error loading categories</span>';
        }
    }

    // Filter Function (Global)
    window.filterPublicCategory = (btn, categoryId) => {
        // Update active state
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update state and reload
        currentPublicCategory = categoryId;
        loadPublicProducts();
    };

    // Generic Image Error Handler
    window.handleImageError = (img, originalUrl) => {
        img.onerror = null; // Prevent infinite loop

        // If we are currently showing the proxy or some processed URL, and it failed
        // Try the original URL if it's different and safe (HTTPS or relative)
        if (originalUrl && img.src !== originalUrl) {
            if (originalUrl.startsWith('https://') || originalUrl.startsWith('/') || originalUrl.startsWith('data:')) {
                img.src = originalUrl;
                // If the original also fails, set final fallback
                img.onerror = () => {
                    img.src = 'https://placehold.co/400x400?text=No+Image';
                };
                return;
            }
        }

        // Default fallback
        img.src = 'https://placehold.co/400x400?text=No+Image';
    };

    // Load Public Products
    async function loadPublicProducts() {
        if (!publicGrid) return;

        publicGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 50px;"><i class="fas fa-spinner fa-spin fa-3x"></i></div>';

        try {
            let query = `${API_BASE_URL}/api/products?isAvailable=true`;
            if (currentPublicCategory) query += `&categoryId=${currentPublicCategory}`;

            const res = await fetch(query);
            const data = await res.json();
            const products = data.products || [];

            publicGrid.innerHTML = '';

            if (products.length === 0) {
                publicGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 50px; color: #666;">등록된 상품이 없습니다.</div>';
                return;
            }

            products.forEach(product => {
                const originalUrl = product.imageUrl || product.images?.[0] || '';
                const imageUrl = getSecureImageUrl(originalUrl, 400);
                const brandName = product.brand || 'RIUM';

                const card = document.createElement('div');
                card.className = 'product-card';
                card.onclick = () => window.location.href = `product_detail.html?id=${product.id}`;

                // Escape originalUrl for HTML attribute
                const safeOriginalUrl = originalUrl.replace(/'/g, "\\'");

                // NO PRICE shown, as requested
                card.innerHTML = `
                    <div class="product-img-wrapper">
                        <img src="${imageUrl}" alt="${product.name}" loading="lazy" onerror="window.handleImageError(this, '${safeOriginalUrl}')">
                    </div>
                    <div class="product-info">
                        <div class="product-brand">${brandName}</div>
                        <h3 class="product-title">${product.name}</h3>
                    </div>
                `;
                publicGrid.appendChild(card);
            });

        } catch (error) {
            console.error('Error loading products:', error);
            publicGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: red;">상품을 불러오는 중 오류가 발생했습니다.</div>';
        }
    }

    // Render Notices
    const noticeList = document.getElementById('notice-list');
    if (noticeList) {
        fetchNotices();
    }

    async function fetchNotices() {
        try {
            const res = await fetch(`${API_BASE_URL}/api/notifications`);
            if (res.ok) {
                const notices = await res.json();
                const activeNotices = notices.filter(n => n.is_active);

                if (activeNotices.length === 0) {
                    noticeList.innerHTML = '<p style="text-align: center; color: #666;">등록된 공지사항이 없습니다.</p>';
                    return;
                }

                noticeList.innerHTML = activeNotices.map(notice => `
                    <div class="notice-item" style="background: white; padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <h3 style="font-size: 1.1rem; color: var(--primary-color); margin: 0;">${notice.title}</h3>
                            <span style="font-size: 0.8rem; color: #999;">${new Date(notice.created_at).toLocaleDateString()}</span>
                        </div>
                        <p style="color: #555; line-height: 1.5;">${notice.content}</p>
                    </div>
                `).join('');
            } else {
                noticeList.innerHTML = '<p style="text-align: center; color: #666;">공지사항을 불러올 수 없습니다.</p>';
            }
        } catch (error) {
            console.error('Fetch notices error:', error);
            noticeList.innerHTML = '<p style="text-align: center; color: #666;">공지사항을 불러오는 중 오류가 발생했습니다.</p>';
        }
    }

    // Render New Arrivals
    const newProductList = document.getElementById('new-product-list');
    if (newProductList) {
        fetchNewProducts();
    }

    async function fetchNewProducts() {
        try {
            const res = await fetch(`${API_BASE_URL}/api/products?isNew=true&limit=30`);
            if (res.ok) {
                const data = await res.json();
                const products = data.products;

                if (products.length === 0) {
                    newProductList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">등록된 신상품이 없습니다.</p>';
                    return;
                }

                newProductList.innerHTML = products.map(product => {
                    // Normalize image URL
                    const imageUrl = getSecureImageUrl(product.imageUrl || product.image_url);
                    const productName = product.name || product.modelNo || product.model_name || '제품명 없음';
                    const brandName = product.brand || 'Brand';
                    const productId = product.id;

                    // Check if image is an emoji (legacy support)
                    const isEmoji = !imageUrl.includes('/') && !imageUrl.includes('.');
                    const imageHtml = isEmoji
                        ? `<div class="product-icon" style="font-size: 3rem; padding: 2rem; background: #fff; display: flex; align-items: center; justify-content: center; height: 200px;">${imageUrl}</div>`
                        : `<div class="product-image-container" style="height: 200px; overflow: hidden; background: #fff; display: flex; align-items: center; justify-content: center; padding: 10px;">
                             <img src="${imageUrl}" alt="${productName}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                           </div>`;

                    return `
                    <div class="card product-card" onclick="window.location.href='product_detail.html?id=${productId}'" style="cursor: pointer; padding: 0; overflow: hidden;">
                        ${imageHtml}
                        <div style="padding: 1.5rem;">
                            <h3 style="font-size: 1rem; color: #666; margin-bottom: 0.5rem;">${brandName}</h3>
                            <h4 style="font-size: 1.1rem; margin-bottom: 0.5rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${productName}</h4>
                        </div>
                    </div>
                `}).join('');
            } else {
                newProductList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">신상품 목록을 불러올 수 없습니다.</p>';
            }
        } catch (error) {
            console.error('Fetch new products error:', error);
            newProductList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">신상품 목록을 불러오는 중 오류가 발생했습니다.</p>';
        }
    }

    // Render Brands
    const brandList = document.getElementById('brand-list');
    if (brandList) {
        fetchAndRenderBrands();
    }

    // Brand Data Mapping
    const brandData = {
        'RIUM Beauty': { icon: '💄', desc: 'Premium K-Beauty Selection' },
        'Nature Food': { icon: '🥗', desc: 'Healthy & Organic Foods' },
        'Modern Living': { icon: '🛋️', desc: 'Sensible Living Items' },
        'Pure Skin': { icon: '🧴', desc: 'Natural Skincare' },
        'Fresh Table': { icon: '🍽️', desc: 'Fresh Ingredients' },
        'Cozy Home': { icon: '🏠', desc: 'Comfortable Home Decor' }
    };

    async function fetchAndRenderBrands() {
        try {
            // For RIUM, we might not have a backend yet, so let's use static brands for now
            // or we can try to fetch but fallback gracefully.
            // Since we are mocking, let's just render static brands if fetch fails or returns empty.

            // Mock Brands for RIUM
            const brands = Object.keys(brandData);

            brandList.innerHTML = brands.map(brandName => {
                const info = brandData[brandName];
                return `
                <div class="brand-card">
                    <div class="brand-icon">${info.icon}</div>
                    <h3>${brandName}</h3>
                    <p>${info.desc}</p>
                </div>
            `}).join('');

        } catch (error) {
            console.error('Fetch brands error:', error);
            brandList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">브랜드 목록을 불러오는 중 오류가 발생했습니다.</p>';
        }
    }

    // Mock Notices Data
    const mockNotices = [
        { id: 1, title: '[공지] RIUM 온라인 스토어 그랜드 오픈 안내', date: '2025-01-15' },
        { id: 2, title: '[이벤트] 신규 가입 회원 10% 할인 쿠폰 증정', date: '2025-01-20' },
        { id: 3, title: '[배송] 설 연휴 배송 마감 및 재개 안내', date: '2025-02-01' },
        { id: 4, title: '[뉴스] RIUM, 2025 라이프스타일 트렌드 발표', date: '2025-02-10' }
    ];

    async function fetchAndRenderNotices() {
        const noticeList = document.getElementById('notice-list');
        if (!noticeList) return;

        try {
            // Simulate API delay
            // const response = await fetch(`${API_BASE_URL}/api/notices`);
            // const notices = await response.json();

            // Use mock data for now
            const notices = mockNotices;

            noticeList.innerHTML = notices.map(notice => `
                <div class="notice-item">
                    <span class="notice-date">${notice.date}</span>
                    <a href="#" class="notice-title">${notice.title}</a>
                </div>
            `).join('');
        } catch (error) {
            console.error('Failed to fetch notices:', error);
            noticeList.innerHTML = '<p style="text-align: center; color: #666;">공지사항을 불러올 수 없습니다.</p>';
        }
    }

    // Category Constants (Synced with RIUM)
    const CATEGORY_ORDER = [
        'Beauty',
        'Food',
        'Living',
        'Other'
    ];

    const CATEGORY_COLORS = {
        'Beauty': '#e83e8c',         // Pink
        'Food': '#ffc107',           // Amber/Yellow
        'Living': '#20c997',         // Teal
        'Other': '#6c757d'           // Gray
    };

    // Render Products & Categories
    const productGrid = document.getElementById('product-grid');
    const categoryContainer = document.querySelector('.category-filters');
    let fetchedProducts = [];
    let activeCategory = 'All';

    async function initProducts() {
        if (!productGrid) return;

        // 1. Fetch Categories
        await fetchAndRenderCategories();

        // 2. Fetch Products
        await fetchAndRenderProducts();
    }

    async function fetchAndRenderCategories() {
        if (!categoryContainer) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/products/categories`);
            if (res.ok) {
                const data = await res.json();
                let categories = data.categories;

                // Sort categories based on SCM order
                categories.sort((a, b) => {
                    const indexA = CATEGORY_ORDER.indexOf(a.name);
                    const indexB = CATEGORY_ORDER.indexOf(b.name);

                    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                    if (indexA !== -1) return -1;
                    if (indexB !== -1) return 1;

                    // If neither is in the list, sort alphabetically
                    if (a.name === 'Other') return 1;
                    if (b.name === 'Other') return -1;
                    return a.name.localeCompare(b.name);
                });

                // Create buttons: All + Dynamic Categories
                // Note: In the new sidebar layout, we might want to append to the list instead of replacing buttons.
                // For now, let's assume the HTML structure is static or we update the list items.

                // If we want to dynamically render sidebar links:
                const sidebarList = document.querySelector('.category-list');
                if (sidebarList) {
                    let listHtml = `<li class="category-item"><span class="category-link active" data-category="All">All Products</span></li>`;

                    categories.forEach(cat => {
                        listHtml += `<li class="category-item"><span class="category-link" data-category="${cat.name}">${cat.name}</span></li>`;
                    });

                    sidebarList.innerHTML = listHtml;
                }

                // Re-attach event listeners
                attachCategoryListeners();
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            // Fallback to existing hardcoded buttons if fetch fails (or do nothing if they are already there)
            attachCategoryListeners(); // Attach listeners to static HTML if fetch fails
        }
    }

    function attachCategoryListeners() {
        // Target both old buttons (if any) and new sidebar links
        const categoryLinks = document.querySelectorAll('.category-btn, .category-link');

        categoryLinks.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all
                categoryLinks.forEach(b => b.classList.remove('active'));

                // Add active class to clicked
                btn.classList.add('active');

                const category = btn.getAttribute('data-category');
                activeCategory = category;
                renderFilteredProducts(category);

                // Update result count text
                const resultCount = document.querySelector('.result-count');
                if (resultCount) {
                    resultCount.textContent = category === 'All' ? 'Showing all products' : `Showing ${category} products`;
                }
            });
        });
    }

    async function fetchAndRenderProducts() {
        try {
            // Try to fetch from SCM API
            const res = await fetch(`${API_BASE_URL}/api/products?sort=display_order`);
            if (res.ok) {
                const data = await res.json();
                // Map SCM data to Homepage format (Backend returns camelCase via Prisma)
                fetchedProducts = data.products.map(p => {
                    return {
                        id: p.id,
                        brand: p.brand,
                        model: p.modelNo || p.name, // Prisma uses modelNo or name
                        description: p.description,
                        price: Number(p.price), // Prisma uses price
                        category: p.category?.name || 'Other', // Prisma returns category object
                        image: p.imageUrl, // Prisma uses imageUrl
                        detailUrl: p.detailUrl // Prisma uses detailUrl
                    };
                });
            } else {
                throw new Error('API not available');
            }
        } catch (error) {
            console.warn('Failed to fetch from SCM API, using static data:', error);
            // Fallback to static products if defined
            // Mock Product Data (Enhanced for RIUM Plan)
            const mockProducts = [
                {
                    id: 1,
                    brand: 'Wizard',
                    name: 'Smart Air Conditioner',
                    price: 450000,
                    category: 'PB Brand (Wizard)',
                    image: 'https://images.unsplash.com/photo-1614630687884-699709d22445?q=80&w=1974&auto=format&fit=crop',
                    isNew: true
                },
                {
                    id: 2,
                    brand: 'Wizard',
                    name: 'Premium Bluetooth Speaker',
                    price: 120000,
                    category: 'PB Brand (Wizard)',
                    image: 'https://images.unsplash.com/photo-1545459720-aacaf5090834?q=80&w=1935&auto=format&fit=crop',
                    isNew: false
                },
                {
                    id: 3,
                    brand: 'Glasster',
                    name: 'Glass Food Container Set',
                    price: 35000,
                    category: 'Sourcing Brand',
                    image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?q=80&w=2071&auto=format&fit=crop',
                    isNew: true
                },
                {
                    id: 4,
                    brand: 'Lebod',
                    name: 'Ergonomic Office Chair',
                    price: 280000,
                    category: 'Sourcing Brand',
                    image: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?q=80&w=2070&auto=format&fit=crop',
                    isNew: false
                },
                {
                    id: 5,
                    brand: 'Seasonal',
                    name: 'Portable Mini Fan (Summer)',
                    price: 15000,
                    category: 'Seasonal',
                    image: 'https://images.unsplash.com/photo-1618941716939-553df9c62e23?q=80&w=2070&auto=format&fit=crop',
                    isNew: true
                },
                {
                    id: 6,
                    brand: 'Seasonal',
                    name: 'Electric Heater (Winter)',
                    price: 55000,
                    category: 'Seasonal',
                    image: 'https://images.unsplash.com/photo-1565691083753-4b68468c46e1?q=80&w=2070&auto=format&fit=crop',
                    isNew: false
                }
            ];
            if (typeof products !== 'undefined') {
                fetchedProducts = products;
            }
        }

        renderFilteredProducts(activeCategory);
    }

    function renderFilteredProducts(category) {
        const filteredProducts = category === 'All'
            ? fetchedProducts
            : fetchedProducts.filter(p => p.category === category);

        if (filteredProducts.length === 0) {
            productGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">해당 카테고리에 제품이 없습니다.</p>';
            return;
        }

        productGrid.innerHTML = filteredProducts.map(product => {
            // Normalize image URL
            const imageUrl = getImageUrl(product.image);

            // Check if image is an emoji or a URL
            const isEmoji = !imageUrl.includes('/') && !imageUrl.includes('.');
            const imageHtml = isEmoji
                ? `<div class="product-icon" style="font-size: 3rem; padding: 2rem; background: #fff; display: flex; align-items: center; justify-content: center; height: 200px;">${imageUrl}</div>`
                : `<div class="product-image-container" style="height: 200px; overflow: hidden; background: #fff; display: flex; align-items: center; justify-content: center; padding: 10px;">
                     <img src="${imageUrl}" alt="${product.model}" class="product-thumb" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                   </div>`;

            return `
            <div class="product-card" onclick="window.location.href='product_detail.html?id=${product.id}'" style="cursor: pointer;">
                ${imageHtml}
                <div class="product-info">
                    <h3 style="color: var(--primary-color); margin-bottom: 0.5rem;">${product.brand}</h3>
                    <h4 style="font-size: 1.1rem; margin-bottom: 0.5rem;">${product.model}</h4>
                    <p style="color: #666; margin-bottom: 1rem;">${product.description}</p>
                </div>
            </div>
        `}).join('');
    }

    // Product Detail Page Logic
    const detailContainer = document.getElementById('product-detail-container');
    if (detailContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');

        if (productId) {
            fetchProductDetail(productId);
        } else {
            detailContainer.innerHTML = '<p style="text-align: center;">잘못된 접근입니다.</p>';
        }
    }

    async function fetchProductDetail(id) {
        try {
            // Define timeout promise
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out')), 5000)
            );

            const res = await Promise.race([
                fetch(`${API_BASE_URL}/api/products/${id}`),
                timeout
            ]);

            if (res.ok) {
                const data = await res.json();
                renderProductDetail(data.product);
            } else {
                throw new Error('Product not found');
            }
        } catch (error) {
            console.warn('Error fetching product detail, trying static data:', error);

            // Fallback to static data
            if (typeof products !== 'undefined') {
                // products array from products_data.js
                // Note: ID from URL is string, product.id might be number
                const product = products.find(p => p.id == id);
                if (product) {
                    renderProductDetail(product);
                    return;
                }
            }

            // If both fail, show error
            detailContainer.innerHTML = `
                <div style="text-align: center; padding: 50px;">
                    <p style="color: #666; font-size: 1.2rem;">제품 정보를 불러올 수 없습니다.</p>
                    <p style="color: #999; font-size: 0.9rem; margin-top: 10px;">(Error: ${error.message})</p>
                    <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: var(--primary-color); color: white; border: none; border-radius: 5px; cursor: pointer;">다시 시도</button>
                    <button onclick="history.back()" style="margin-top: 20px; margin-left: 10px; padding: 10px 20px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer;">목록으로</button>
                </div>
            `;
        }
    }

    function renderProductDetail(product) {
        // Normalize properties (API returns snake_case, static data returns camelCase)
        // Secure & Resize Main Image (800px)
        const imageUrl = getSecureImageUrl(product.imageUrl || product.image_url || product.image, 800);
        const detailUrl = product.detailUrl || product.detail_url;
        const modelName = product.modelNo || product.model_name || product.model || '';
        const productName = product.name || product.product_name || '제품명 없음';
        const brandName = product.brand || 'Brand';
        const categoryName = product.category_name || product.category?.name || 'Category';

        const imageHtml = `<img src="${imageUrl}" alt="${modelName}" style="width: 100%; max-width: 600px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin: 0 auto; display: block;">`;

        // Process Detail Content (Secure images inside HTML)
        let detailContentHtml = '';
        if (detailUrl) {
            // Helper to replace http images in HTML string with proxy
            const secureHtml = (html) => {
                return html.replace(/src=["'](http:\/\/[^"']+)["']/g, (match, p1) => {
                    return `src="${getSecureImageUrl(p1)}"`;
                });
            };

            if (detailUrl.trim().startsWith('<')) {
                // HTML Content
                detailContentHtml = `<div class="product-detail-content" style="text-align: center; display: flex; flex-direction: column; align-items: center; width: 100%;">${secureHtml(detailUrl)}</div>`;
            } else {
                // Image URL
                detailContentHtml = `<div class="product-detail-content" style="text-align: center; width: 100%;"><img src="${getSecureImageUrl(detailUrl)}" alt="Detail" style="max-width: 100%; margin: 0 auto; display: block;"></div>`;
            }
        }

        const detailSectionHtml = detailContentHtml
            ? `<div style="margin-top: 60px; border-top: 1px solid #eee; padding-top: 40px;">
                 <h3 style="font-size: 1.5rem; margin-bottom: 30px; text-align: center; color: #333;">상세 정보</h3>
                 ${detailContentHtml}
               </div>`
            : '';

        const detailContainer = document.getElementById('product-detail-container');
        if (detailContainer) {
            // Sticky Back Button (Top 90px to clear fixed header)
            const stickyHeaderHtml = `
            <div style="position: sticky; top: 90px; background: rgba(255,255,255,0.95); backdrop-filter: blur(5px); padding: 15px 0; border-bottom: 1px solid #eee; z-index: 100; margin-bottom: 30px; margin-top: -20px;">
                 <div style="max-width: 1000px; margin: 0 auto; text-align: center;">
                       <button id="btnBackToList" style="padding: 10px 40px; background: #333; color: white; border: none; border-radius: 30px; cursor: pointer; font-size: 0.95rem; display: inline-flex; align-items: center; gap: 8px; transition: all 0.3s; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                           <i class="fas fa-list"></i> 목록으로 돌아가기
                       </button>
                 </div>
            </div>`;

            detailContainer.innerHTML = `
                ${stickyHeaderHtml}
                <div class="product-detail-wrapper" style="max-width: 1000px; margin: 0 auto;">
                    <div style="text-align: center; margin-bottom: 2rem;">
                        ${imageHtml}
                    </div>
                    <div style="padding: 20px; text-align: center; max-width: 800px; margin: 0 auto;">
                        <span style="background: #f0f0f0; padding: 5px 15px; border-radius: 20px; font-size: 0.9rem; color: #666; display: inline-block; margin-bottom: 1rem;">${categoryName}</span>
                        <h2 style="font-size: 1.5rem; color: var(--primary-color); margin-bottom: 0.5rem; font-weight: 600;">${brandName}</h2>
                        <h1 style="font-size: 2.2rem; margin-bottom: 1rem; font-weight: 700; color: #333;">${productName}</h1>
                        <p style="font-size: 1.1rem; color: #888; margin-bottom: 2rem;">${modelName}</p>
                        
                        <p style="font-size: 1.1rem; line-height: 1.8; color: #555; margin-bottom: 30px; word-break: keep-all;">${product.description || ''}</p>
                        
                        <div style="margin-top: 40px;">
                        </div>
                    </div>
                </div>
                ${detailSectionHtml}
            `;

            const btn = document.getElementById('btnBackToList');
            if (btn) {
                btn.onclick = () => {
                    if (document.referrer && document.referrer.includes('products.html')) {
                        history.back();
                    } else {
                        window.location.href = 'products.html';
                    }
                };
            }
        }
    }

    // Smooth Scroll for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Simple Scroll Animation Observer
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Apply fade-in animation to sections
    document.querySelectorAll('.section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
});
