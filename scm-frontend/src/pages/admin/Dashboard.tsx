import { useEffect, useState } from 'react';
import api from '../../api/axios';

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

const Dashboard = () => {
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
        } finally {
            setLoading(false);
        }
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

    if (loading) return <div>Loading...</div>;

    return (
        <div>
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
                                </tr>
                            </thead>
                            <tbody>
                                {quotes.slice(0, 5).map(quote => (
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
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* New Partners (Dummy for now, will be real later) */}
                <div className="scm-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>신규 가입 파트너</h3>
                        <a href="/admin/partners" style={{ fontSize: '0.85rem', color: 'var(--scm-primary)', textDecoration: 'none' }}>관리 &gt;</a>
                    </div>
                    <div style={{ padding: '1rem', color: '#666' }}>
                        파트너 관리 페이지에서 확인하세요.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
