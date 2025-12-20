import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const isActive = (path: string) => {
        if (path === '/admin' && location.pathname === '/admin') return 'scm-menu-item active';
        if (path !== '/admin' && location.pathname.startsWith(path)) return 'scm-menu-item active';
        return 'scm-menu-item';
    };

    const [showSettingsMenu, setShowSettingsMenu] = useState(false);

    // Close menu when clicking outside (simple version checking target, or just toggle)
    // For simplicity, just toggle on click.

    return (
        <div className="scm-body">
            {/* Sidebar */}
            <aside className="scm-sidebar" id="scmSidebar">
                <div className="scm-logo-area">
                    <Link to="/admin" style={{ textDecoration: 'none', color: 'white' }}>
                        RIUM<br />ADMIN
                    </Link>
                </div>
                <nav className="scm-menu">
                    <Link to="/admin" className={isActive('/admin')} style={{ textDecoration: 'none' }}>
                        <i className="fas fa-tachometer-alt"></i>
                        <span>관리자<br />대시보드</span>
                    </Link>
                    <Link to="/admin/partners" className={isActive('/admin/partners')} style={{ textDecoration: 'none' }}>
                        <i className="fas fa-users"></i>
                        <span>파트너<br />관리</span>
                    </Link>
                    <Link to="/admin/products" className={isActive('/admin/products')} style={{ textDecoration: 'none' }}>
                        <i className="fas fa-box"></i>
                        <span>상품<br />관리</span>
                    </Link>
                    <Link to="/admin/quotes" className={isActive('/admin/quotes')} style={{ textDecoration: 'none' }}>
                        <i className="fas fa-file-invoice"></i>
                        <span>주문/견적<br />관리</span>
                    </Link>
                    {/* Placeholders */}
                    <Link to="/admin/sales" className={isActive('/admin/sales')} style={{ textDecoration: 'none' }}>
                        <i className="fas fa-chart-bar"></i>
                        <span>매출<br />통계</span>
                    </Link>
                    <Link to="/admin/notices" className={isActive('/admin/notices')} style={{ textDecoration: 'none' }}>
                        <i className="fas fa-bullhorn"></i>
                        <span>공지사항<br />관리</span>
                    </Link>
                </nav>
                <div className="scm-user-profile">
                    <div className="scm-user-avatar" style={{ backgroundColor: '#333' }}>A</div>
                    <div className="scm-user-info">
                        <h4>Admin</h4>
                        <p>System Admin</p>
                    </div>
                    <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#888', marginTop: '0.5rem', cursor: 'pointer', padding: 0 }}>
                        <i className="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="scm-main">
                {/* Header */}
                <header className="scm-header">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div className="scm-breadcrumb">
                            <i className="fas fa-home"></i> Home &gt; 관리자 대시보드
                        </div>
                    </div>
                    <div className="scm-header-actions">
                        <div className="scm-icon-btn">
                            <i className="fas fa-bell"></i>
                            <span className="scm-badge">5</span>
                        </div>

                        {/* Settings Dropdown */}
                        <div className="scm-icon-btn" style={{ position: 'relative' }} onClick={() => setShowSettingsMenu(!showSettingsMenu)}>
                            <i className="fas fa-cog"></i>
                            {showSettingsMenu && (
                                <div style={{
                                    position: 'absolute', top: '100%', right: 0, marginTop: '10px',
                                    backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '4px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)', width: '150px', zIndex: 100
                                }}>
                                    <div style={{ padding: '8px 12px', borderBottom: '1px solid #eee', fontSize: '0.8rem', color: '#888' }}>
                                        시스템 설정
                                    </div>
                                    <Link to="/admin/categories" style={{ display: 'block', padding: '10px 12px', textDecoration: 'none', color: '#333', fontSize: '0.9rem' }}>
                                        <i className="fas fa-tags" style={{ marginRight: '8px', color: 'var(--scm-primary)' }}></i>
                                        카테고리 관리
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Content via Outlet */}
                <div className="scm-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
