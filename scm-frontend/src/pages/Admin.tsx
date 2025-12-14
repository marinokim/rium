
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

interface Quote {
    id: number;
    quoteNumber: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    user: {
        name: string;
        company: string | null;
        email: string;
    };
    items: {
        id: number;
        product: {
            name: string;
        };
        quantity: number;
        price: number;
    }[];
}

const Admin = () => {
    const navigate = useNavigate();
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQuotes();
    }, []);

    const fetchQuotes = async () => {
        try {
            const response = await api.get('/admin/quotes');
            setQuotes(response.data.quotes);
        } catch (error) {
            console.error("Failed to fetch quotes", error);
            // alert("Failed to load quotes. Ensure you are logged in as Admin.");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: number, newStatus: string) => {
        try {
            await api.put(`/admin/quotes/${id}/status`, { status: newStatus });
            setQuotes(quotes.map(q => q.id === id ? { ...q, status: newStatus } : q));
        } catch (error) {
            console.error("Update failed", error);
            alert("Failed to update status.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'PENDING': return 'status-pending';
            case 'APPROVED': return 'status-approved';
            case 'SHIPPING': return 'status-shipping';
            case 'COMPLETED': return 'status-completed';
            case 'REJECTED': return 'status-rejected';
            default: return 'status-new';
        }
    };

    if (loading) return <div className="scm-body" style={{ justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;

    return (
        <div className="scm-body">
            {/* Sidebar */}
            <aside className="scm-sidebar" id="scmSidebar">
                <div className="scm-logo-area">
                    <a href="#">RIUM<br />ADMIN</a>
                </div>
                <nav className="scm-menu">
                    <div className="scm-menu-item active">
                        <i className="fas fa-tachometer-alt"></i>
                        <span>관리자<br />대시보드</span>
                    </div>
                    <div className="scm-menu-item">
                        <i className="fas fa-users"></i>
                        <span>파트너<br />관리</span>
                    </div>
                    <div className="scm-menu-item">
                        <i className="fas fa-box"></i>
                        <span>상품<br />관리</span>
                    </div>
                    <div className="scm-menu-item">
                        <i className="fas fa-file-invoice"></i>
                        <span>주문/견적<br />관리</span>
                    </div>
                    <div className="scm-menu-item">
                        <i className="fas fa-chart-bar"></i>
                        <span>매출<br />통계</span>
                    </div>
                    <div className="scm-menu-item">
                        <i className="fas fa-bullhorn"></i>
                        <span>공지사항<br />관리</span>
                    </div>
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
                        <div className="scm-icon-btn">
                            <i className="fas fa-cog"></i>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="scm-content">
                    <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700 }}>관리자 대시보드 (Admin Dashboard)</h2>

                    {/* Stats Grid */}
                    <div className="scm-grid">
                        <div className="scm-card scm-stat-card">
                            <div className="scm-stat-info">
                                <h3>총 매출 (12월)</h3>
                                <p>₩125M</p>
                            </div>
                            <div className="scm-stat-icon bg-primary-light">
                                <i className="fas fa-won-sign"></i>
                            </div>
                        </div>
                        <div className="scm-card scm-stat-card">
                            <div className="scm-stat-info">
                                <h3>활성 파트너</h3>
                                <p>42</p>
                            </div>
                            <div className="scm-stat-icon bg-secondary-light">
                                <i className="fas fa-users"></i>
                            </div>
                        </div>
                        <div className="scm-card scm-stat-card">
                            <div className="scm-stat-info">
                                <h3>견적 승인대기</h3>
                                <p>{quotes.filter(q => q.status === 'PENDING').length}</p>
                            </div>
                            <div className="scm-stat-icon bg-red-light">
                                <i className="fas fa-clock"></i>
                            </div>
                        </div>
                        <div className="scm-card scm-stat-card">
                            <div className="scm-stat-info">
                                <h3>시스템 상태</h3>
                                <p style={{ fontSize: '1rem', color: '#2ecc71' }}>정상 운영중</p>
                            </div>
                            <div className="scm-stat-icon bg-green-light">
                                <i className="fas fa-server"></i>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                        {/* Recent Orders */}
                        <div className="scm-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>최근 주문/견적 현황</h3>
                                <a href="#" style={{ fontSize: '0.85rem', color: 'var(--scm-primary)', textDecoration: 'none' }}>전체보기 &gt;</a>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="scm-table">
                                    <thead>
                                        <tr>
                                            <th>주문번호</th>
                                            <th>파트너사</th>
                                            <th>상품명</th>
                                            <th>날짜</th>
                                            <th>상태</th>
                                            <th>관리</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {quotes.map(quote => (
                                            <tr key={quote.id}>
                                                <td>{quote.quoteNumber}</td>
                                                <td>{quote.user.name}</td>
                                                <td>
                                                    {quote.items.length > 0 ? quote.items[0].product.name : 'Unknown'}
                                                    {quote.items.length > 1 ? ` 외 ${quote.items.length - 1}건` : ''}
                                                </td>
                                                <td>{new Date(quote.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    <span className={`status-badge ${getStatusClass(quote.status)}`}>
                                                        {quote.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <select
                                                        value={quote.status}
                                                        onChange={(e) => handleStatusUpdate(quote.id, e.target.value)}
                                                        style={{ fontSize: '0.8rem', padding: '2px', border: '1px solid #ddd', borderRadius: '4px' }}
                                                    >
                                                        <option value="PENDING">대기</option>
                                                        <option value="APPROVED">승인</option>
                                                        <option value="SHIPPING">배송</option>
                                                        <option value="COMPLETED">완료</option>
                                                        <option value="REJECTED">거절</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                        {quotes.length === 0 && (
                                            <tr>
                                                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                                                    견적 내역이 없습니다.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* New Partners (Dummy Data) */}
                        <div className="scm-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>신규 가입 파트너</h3>
                                <a href="#" style={{ fontSize: '0.85rem', color: 'var(--scm-primary)', textDecoration: 'none' }}>관리 &gt;</a>
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                <li style={{ padding: '0.8rem 0', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center' }}>
                                    <div style={{ width: '32px', height: '32px', background: '#eee', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '10px', fontSize: '0.8rem' }}>K</div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>K-Mart</div>
                                        <div style={{ fontSize: '0.75rem', color: '#888' }}>2025-12-06 가입</div>
                                    </div>
                                </li>
                                <li style={{ padding: '0.8rem 0', display: 'flex', alignItems: 'center' }}>
                                    <div style={{ width: '32px', height: '32px', background: '#eee', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '10px', fontSize: '0.8rem' }}>G</div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>GS Retail</div>
                                        <div style={{ fontSize: '0.75rem', color: '#888' }}>2025-12-04 가입</div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Admin;
