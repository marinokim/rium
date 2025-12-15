import { useEffect, useState } from 'react';
import api from '../../api/axios';

interface Product {
    id: number;
    name: string;
    modelName?: string;
    brand?: string;
    modelNo?: string;
    description?: string;
    price: number; // B2B Price
    consumerPrice?: number;
    supplyPrice?: number;
    stockQuantity?: number;
    quantityPerCarton?: number;
    shippingFee?: number;
    shippingFeeIndividual?: number;
    shippingFeeCarton?: number;
    manufacturer?: string;
    origin?: string;
    isTaxFree?: boolean;
    imageUrl: string | null;
    detailUrl?: string;
    productSpec?: string;
    productOptions?: string;
    remarks?: string;
    isAvailable: boolean;
    categoryId: number;
    category: {
        id: number;
        name: string;
    };
}

const Products = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);

    // Form State with empty strings for numbers to avoid "0"
    const [formData, setFormData] = useState<Partial<any>>({
        categoryId: 1, // Default
        isTaxFree: false,
        quantityPerCarton: 1,
        stockQuantity: 999,
        shippingFee: '',
        shippingFeeIndividual: '',
        shippingFeeCarton: ''
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products');
            setProducts(response.data.products);
        } catch (error) {
            console.error("Failed to fetch products", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        let finalValue: any = value;

        if (type === 'number') {
            // Allow empty string for better UX, convert only on submit
            finalValue = value;
        } else if (type === 'checkbox') {
            finalValue = (e.target as HTMLInputElement).checked;
        }

        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const openCreateModal = () => {
        setFormData({
            categoryId: 1,
            isTaxFree: false,
            quantityPerCarton: 1,
            stockQuantity: 999,
            shippingFee: '',
            shippingFeeIndividual: '',
            shippingFeeCarton: '',
            supplyPrice: '',
            consumerPrice: '',
            price: ''
        });
        setIsEditing(false);
        setEditId(null);
        setShowModal(true);
    };

    const openEditModal = (product: Product) => {
        setFormData(product);
        setIsEditing(true);
        setEditId(product.id);
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('정말로 삭제하시겠습니까?')) return;
        try {
            // Note: api base url includes /api usually? 
            // Based on other calls like /products, let's assume relative path works if baseURL is set.
            // If previous calls worked (GET), DELETE should work too.
            // Correct path: /products/:id (relative to baseURL)
            await api.delete(`/products/${id}`);
            setProducts(products.filter(p => p.id !== id));
            alert('삭제되었습니다.');
        } catch (error) {
            console.error("Delete failed", error);
            alert("삭제 실패 (권한이 없거나 오류)");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Prepare data for submission: Convert empty strings to 0 or null
        const submitData = {
            ...formData,
            categoryId: Number(formData.categoryId),
            price: Number(formData.price) || 0,
            consumerPrice: formData.consumerPrice ? Number(formData.consumerPrice) : 0,
            supplyPrice: formData.supplyPrice ? Number(formData.supplyPrice) : 0,
            stockQuantity: formData.stockQuantity ? Number(formData.stockQuantity) : 0,
            quantityPerCarton: formData.quantityPerCarton ? Number(formData.quantityPerCarton) : 1,
            shippingFee: formData.shippingFee ? Number(formData.shippingFee) : 0,
            shippingFeeIndividual: formData.shippingFeeIndividual ? Number(formData.shippingFeeIndividual) : 0,
            shippingFeeCarton: formData.shippingFeeCarton ? Number(formData.shippingFeeCarton) : 0,
        };

        try {
            if (isEditing && editId) {
                const res = await api.put(`/products/${editId}`, submitData);
                setProducts(products.map(p => p.id === editId ? res.data.product : p));
                alert('수정되었습니다.');
            } else {
                const res = await api.post('/products', submitData);
                setProducts([...products, res.data.product]);
                alert('등록되었습니다.');
            }
            setShowModal(false);
            fetchProducts();
        } catch (error) {
            console.error("Submit failed", error);
            alert("저장 실패. 입력값을 확인해주세요.");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>상품 관리</h2>
                <button className="scm-btn scm-btn-primary" onClick={openCreateModal}>
                    <i className="fas fa-plus"></i> 상품 등록
                </button>
            </div>

            {/* Product List */}
            <div className="scm-card">
                <table className="scm-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>이미지</th>
                            <th>브랜드/모델번호</th>
                            <th>상품명</th>
                            <th>공급가 / 소비자가</th>
                            <th>판매가(B2B)</th>
                            <th>재고</th>
                            <th>관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(product => (
                            <tr key={product.id}>
                                <td>{product.id}</td>
                                <td>
                                    <div style={{ width: '50px', height: '50px', backgroundColor: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                                        {product.imageUrl ? (
                                            <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '0.7rem', color: '#999' }}>No Img</span>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ fontWeight: 600 }}>{product.brand || '-'}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>{product.modelNo || '-'}</div>
                                </td>
                                <td>
                                    <div>{product.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{product.category?.name}</div>
                                </td>
                                <td>
                                    <div style={{ fontSize: '0.85rem' }}>공급: ₩{(product.supplyPrice || 0).toLocaleString()}</div>
                                    <div style={{ fontSize: '0.85rem' }}>소비: ₩{(product.consumerPrice || 0).toLocaleString()}</div>
                                </td>
                                <td style={{ fontWeight: 700, color: 'var(--scm-primary)' }}>₩{product.price.toLocaleString()}</td>
                                <td>{product.stockQuantity}</td>
                                <td>
                                    <button
                                        onClick={() => openEditModal(product)}
                                        style={{ marginRight: '5px', border: '1px solid #ddd', background: 'white', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        수정
                                    </button>
                                    <button
                                        onClick={() => handleDelete(product.id)}
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
                    <div style={{
                        backgroundColor: 'white', padding: '2rem', borderRadius: '8px',
                        width: '900px', maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                            {isEditing ? '상품 수정' : '상품 등록'}
                        </h2>

                        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            {/* Left Column: Basic Info */}
                            <div>
                                <h4 style={{ marginBottom: '1rem', color: '#666' }}>기본 정보 (Basic)</h4>
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>카테고리</label>
                                    <select
                                        name="categoryId"
                                        value={formData.categoryId}
                                        onChange={handleInputChange}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                    >
                                        <option value={1}>Gift Set (1)</option>
                                        <option value={2}>Living (2)</option>
                                        <option value={3}>Food (3)</option>
                                        <option value={4}>Other (4)</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>상품명 (필수)</label>
                                    <input type="text" name="name" value={formData.name || ''} onChange={handleInputChange} required style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>브랜드</label>
                                        <input type="text" name="brand" value={formData.brand || ''} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>모델번호</label>
                                        <input type="text" name="modelNo" value={formData.modelNo || ''} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>제조사</label>
                                        <input type="text" name="manufacturer" value={formData.manufacturer || ''} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>원산지</label>
                                        <input type="text" name="origin" value={formData.origin || ''} onChange={handleInputChange} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                    </div>
                                </div>

                                <h4 style={{ margin: '1.5rem 0 1rem', color: '#666' }}>가격 정보 (Pricing)</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>공급가</label>
                                        <input type="number" name="supplyPrice" value={formData.supplyPrice === undefined ? '' : formData.supplyPrice} onChange={handleInputChange} placeholder="0" style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>소비자가</label>
                                        <input type="number" name="consumerPrice" value={formData.consumerPrice === undefined ? '' : formData.consumerPrice} onChange={handleInputChange} placeholder="0" style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>B2B판매가 (필수)</label>
                                        <input type="number" name="price" value={formData.price === undefined ? '' : formData.price} onChange={handleInputChange} required placeholder="0" style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#e8f0fe' }} />
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Logistics & Details */}
                            <div>
                                <h4 style={{ marginBottom: '1rem', color: '#666' }}>물류 & 배송 (Logistics)</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>재고수량</label>
                                        <input type="number" name="stockQuantity" value={formData.stockQuantity === undefined ? '' : formData.stockQuantity} onChange={handleInputChange} placeholder="0" style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>박스입수량(Carton)</label>
                                        <input type="number" name="quantityPerCarton" value={formData.quantityPerCarton === undefined ? '' : formData.quantityPerCarton} onChange={handleInputChange} placeholder="1" style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>기본배송비</label>
                                        <input type="number" name="shippingFee" value={formData.shippingFee === undefined ? '' : formData.shippingFee} onChange={handleInputChange} placeholder="0" style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>개별비</label>
                                        <input type="number" name="shippingFeeIndividual" value={formData.shippingFeeIndividual === undefined ? '' : formData.shippingFeeIndividual} onChange={handleInputChange} placeholder="0" style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>카톤비</label>
                                        <input type="number" name="shippingFeeCarton" value={formData.shippingFeeCarton === undefined ? '' : formData.shippingFeeCarton} onChange={handleInputChange} placeholder="0" style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                    </div>
                                </div>

                                <h4 style={{ margin: '1.5rem 0 1rem', color: '#666' }}>상세 정보 (Details)</h4>
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>대표 이미지 URL</label>
                                    <input type="text" name="imageUrl" value={formData.imageUrl || ''} onChange={handleInputChange} placeholder="https://..." style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                </div>
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>상세페이지 HTML/URL</label>
                                    <textarea name="detailUrl" value={formData.detailUrl || ''} onChange={handleInputChange} rows={3} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                </div>
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                                        <input type="checkbox" name="isTaxFree" checked={formData.isTaxFree || false} onChange={handleInputChange} style={{ marginRight: '8px' }} />
                                        면세 상품 (Tax Free)
                                    </label>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div style={{ gridColumn: '1 / span 2', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', borderRadius: '4px', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}>
                                    취소
                                </button>
                                <button type="submit" style={{ padding: '10px 20px', borderRadius: '4px', border: 'none', background: 'var(--scm-primary)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                                    {isEditing ? '수정 완료' : '상품 등록'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
