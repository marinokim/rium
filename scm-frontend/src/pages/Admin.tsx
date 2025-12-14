
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
            alert("Failed to load quotes. Ensure you are logged in as Admin.");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: number, newStatus: string) => {
        try {
            await api.put(`/admin/quotes/${id}/status`, { status: newStatus });
            // Refresh local state
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

    if (loading) return <div style={{ padding: '2rem' }}>Loading Admin Panel...</div>;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f6f8' }}>
            {/* Sidebar */}
            <aside style={{ width: '250px', backgroundColor: '#004d40', color: 'white', padding: '1rem' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem', paddingLeft: '1rem' }}>RIUM Admin</div>
                <nav>
                    <div style={{ padding: '0.8rem 1rem', backgroundColor: '#00695c', borderRadius: '4px', marginBottom: '0.5rem', cursor: 'pointer' }}>
                        Dashboard
                    </div>
                    {/* Add more links if needed */}
                </nav>
                <button onClick={handleLogout} style={{ marginTop: '2rem', width: '100%', padding: '0.8rem', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'white', cursor: 'pointer' }}>
                    Logout
                </button>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '2rem' }}>
                <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '1.8rem', color: '#1a1a1a' }}>Admin Dashboard</h1>
                    <div style={{ color: '#666' }}>Manager Mode</div>
                </header>

                <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee' }}>
                        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Recent Quote Requests</h2>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f9fafb', textAlign: 'left', color: '#555' }}>
                                <th style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>Quote #</th>
                                <th style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>Partner</th>
                                <th style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>Date</th>
                                <th style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>Items</th>
                                <th style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>Total</th>
                                <th style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>Status</th>
                                <th style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quotes.map(quote => (
                                <tr key={quote.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '1rem', fontWeight: 500 }}>{quote.quoteNumber}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 500 }}>{quote.user.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#888' }}>{quote.user.company || '-'}</div>
                                    </td>
                                    <td style={{ padding: '1rem', color: '#666' }}>
                                        {new Date(quote.createdAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '1rem', maxWidth: '300px' }}>
                                        {quote.items.map(i => (
                                            <div key={i.id} style={{ marginBottom: '4px' }}>
                                                {i.product.name} x {i.quantity}
                                            </div>
                                        ))}
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>
                                        ₩{quote.totalAmount.toLocaleString()}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            backgroundColor: quote.status === 'PENDING' ? '#fff3e0' :
                                                quote.status === 'APPROVED' ? '#e8f5e9' :
                                                    quote.status === 'SHIPPING' ? '#e3f2fd' : '#ffebee',
                                            color: quote.status === 'PENDING' ? '#ef6c00' :
                                                quote.status === 'APPROVED' ? '#2e7d32' :
                                                    quote.status === 'SHIPPING' ? '#1565c0' : '#c62828'
                                        }}>
                                            {quote.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <select
                                            value={quote.status}
                                            onChange={(e) => handleStatusUpdate(quote.id, e.target.value)}
                                            style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ddd' }}
                                        >
                                            <option value="PENDING">Pending</option>
                                            <option value="APPROVED">Approve</option>
                                            <option value="SHIPPING">Shipping</option>
                                            <option value="COMPLETED">Completed</option>
                                            <option value="REJECTED">Reject</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                            {quotes.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                                        No quotes found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default Admin;
