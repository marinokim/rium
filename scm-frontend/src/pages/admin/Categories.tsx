import { useEffect, useState } from 'react';
import api from '../../api/axios';

interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string;
    color?: string;
    _count?: {
        products: number;
    }
}

const Categories = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        color: '#e0e0e0'
    });

    const PRESET_COLORS = [
        { label: 'Gray', value: '#e0e0e0' },
        { label: 'Blue', value: '#2196f3' },
        { label: 'Green', value: '#4caf50' },
        { label: 'Red', value: '#f44336' },
        { label: 'Yellow', value: '#ffeb3b' },
        { label: 'Purple', value: '#9c27b0' },
        { label: 'Orange', value: '#ff9800' },
        { label: 'Teal', value: '#009688' },
        { label: 'Pink', value: '#e91e63' }
    ];

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await api.get('/categories');
            setCategories(response.data.categories);
        } catch (error) {
            console.error("Failed to fetch categories", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleColorSelect = (color: string) => {
        setFormData(prev => ({ ...prev, color }));
    };

    const openCreateModal = () => {
        setFormData({ name: '', slug: '', color: '#e0e0e0' });
        setIsEditing(false);
        setEditId(null);
        setShowModal(true);
    };

    const openEditModal = (cat: Category) => {
        setFormData({ name: cat.name, slug: cat.slug, color: cat.color || '#e0e0e0' });
        setIsEditing(true);
        setEditId(cat.id);
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('정말로 삭제하시겠습니까? (상품이 연결된 경우 삭제되지 않을 수 있습니다)')) return;
        try {
            await api.delete(`/categories/${id}`);
            setCategories(categories.filter(c => c.id !== id));
            alert('삭제되었습니다.');
        } catch (error) {
            console.error("Delete failed", error);
            alert("삭제 실패 (상품이 연결되어 있거나 오류 발생)");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && editId) {
                const res = await api.put(`/categories/${editId}`, formData);
                setCategories(categories.map(c => c.id === editId ? res.data.category : c));
                alert('수정되었습니다.');
            } else {
                const res = await api.post('/categories', formData);
                setCategories([...categories, res.data.category]);
                alert('생성되었습니다.');
            }
            setShowModal(false);
            fetchCategories(); // Refresh mainly for product counts if they change? well counts wont change here.
        } catch (error) {
            console.error("Submit failed", error);
            alert("저장 실패. 슬러그 중복 등을 확인하세요.");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>카테고리 관리</h2>
                <button className="scm-btn scm-btn-primary" onClick={openCreateModal}>
                    <i className="fas fa-plus"></i> 카테고리 추가
                </button>
            </div>

            <div className="scm-card">
                <table className="scm-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>카테고리명</th>
                            <th>Slug (고유값)</th>
                            <th>색상</th>
                            <th>상품 수</th>
                            <th>관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map(cat => (
                            <tr key={cat.id}>
                                <td>{cat.id}</td>
                                <td style={{ fontWeight: 600 }}>{cat.name}</td>
                                <td style={{ color: '#666' }}>{cat.slug}</td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{
                                            width: '20px', height: '20px', borderRadius: '50%',
                                            backgroundColor: cat.color || '#e0e0e0',
                                            border: '1px solid #ddd'
                                        }}></div>
                                        <span style={{ fontSize: '0.8rem', color: '#888' }}>{cat.color}</span>
                                    </div>
                                </td>
                                <td>
                                    <span style={{
                                        backgroundColor: '#e3f2fd', color: '#1976d2',
                                        padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700
                                    }}>
                                        {cat._count?.products || 0}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        onClick={() => openEditModal(cat)}
                                        style={{ marginRight: '5px', border: '1px solid #ddd', background: 'white', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        수정
                                    </button>
                                    <button
                                        onClick={() => handleDelete(cat.id)}
                                        style={{ border: '1px solid #ffcccc', background: '#fff5f5', color: '#e74c3c', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        삭제
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '400px' }}>
                        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                            {isEditing ? '카테고리 수정' : '카테고리 추가'}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>카테고리명</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="예: Living"
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Slug (영문 고유값)</label>
                                <input
                                    type="text"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="예: living"
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>색상 선택</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {PRESET_COLORS.map(c => (
                                        <div
                                            key={c.value}
                                            onClick={() => handleColorSelect(c.value)}
                                            style={{
                                                width: '30px', height: '30px', borderRadius: '50%',
                                                backgroundColor: c.value, cursor: 'pointer',
                                                border: formData.color === c.value ? '2px solid #333' : '1px solid #ddd',
                                                transform: formData.color === c.value ? 'scale(1.1)' : 'scale(1)'
                                            }}
                                            title={c.label}
                                        />
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    name="color"
                                    value={formData.color}
                                    onChange={handleInputChange}
                                    style={{ marginTop: '8px', width: '100%', padding: '6px', border: '1px solid #eee', borderRadius: '4px', fontSize: '0.8rem', color: '#666' }}
                                    placeholder="직접 입력 (예: #123456)"
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}>
                                    취소
                                </button>
                                <button type="submit" style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: 'var(--scm-primary)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                                    저장
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Categories;
