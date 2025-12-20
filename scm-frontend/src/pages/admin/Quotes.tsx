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

const Quotes = () => {
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
            alert("견적 목록을 불러오지 못했습니다.");
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
            alert("상태 변경에 실패했습니다.");
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
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700 }}>주문/견적 관리 (Quotes)</h2>

            <div className="scm-card">
                <table className="scm-table">
                    <thead>
                        <tr>
                            <th>주문번호</th>
                            <th>파트너사</th>
                            <th>상품명</th>
                            <th>총 금액</th>
                            <th>날짜</th>
                            <th>상태</th>
                            <th>관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {quotes.map(quote => (
                            <tr key={quote.id}>
                                <td>{quote.quoteNumber}</td>
                                <td>
                                    <div>{quote.user.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>{quote.user.company}</div>
                                </td>
                                <td>
                                    {quote.items.length > 0 ? quote.items[0].product.name : 'Unknown'}
                                    {quote.items.length > 1 ? ` 외 ${quote.items.length - 1}건` : ''}
                                </td>
                                <td>₩{quote.totalAmount.toLocaleString()}</td>
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
                                        style={{ fontSize: '0.8rem', padding: '4px', border: '1px solid #ddd', borderRadius: '4px' }}
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
                                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                                    견적 내역이 없습니다.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Quotes;
