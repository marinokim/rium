import { useEffect, useState } from 'react';
import api from '../../api/axios';

interface Partner {
    id: number;
    email: string;
    name: string;
    company: string | null;
    createdAt: string;
    isApproved: boolean;
}

const Partners = () => {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPartners();
    }, []);

    const fetchPartners = async () => {
        try {
            const response = await api.get('/admin/users');
            setPartners(response.data.partners);
        } catch (error) {
            console.error("Failed to fetch partners", error);
            alert("파트너 목록을 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: number) => {
        if (!confirm('승인하시겠습니까?')) return;
        try {
            await api.put(`/admin/users/${id}/approve`);
            setPartners(partners.map(p => p.id === id ? { ...p, isApproved: true } : p));
            alert('승인되었습니다.');
        } catch (error) {
            console.error("Approval failed", error);
            alert("승인 처리에 실패했습니다.");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700 }}>파트너 관리 (Partners)</h2>
            <div className="scm-card">
                <table className="scm-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>회사명</th>
                            <th>담당자명</th>
                            <th>이메일</th>
                            <th>가입일</th>
                            <th>상태</th>
                            <th>관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {partners.map(partner => (
                            <tr key={partner.id}>
                                <td>{partner.id}</td>
                                <td>{partner.company || '-'}</td>
                                <td>{partner.name}</td>
                                <td>{partner.email}</td>
                                <td>{new Date(partner.createdAt).toLocaleDateString()}</td>
                                <td>
                                    {partner.isApproved ? (
                                        <span className="status-badge status-approved">승인됨</span>
                                    ) : (
                                        <span className="status-badge status-pending">대기중</span>
                                    )}
                                </td>
                                <td>
                                    {!partner.isApproved && (
                                        <button
                                            onClick={() => handleApprove(partner.id)}
                                            style={{
                                                padding: '5px 10px',
                                                backgroundColor: 'var(--scm-primary)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            승인
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {partners.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                                    파트너 내역이 없습니다.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Partners;
