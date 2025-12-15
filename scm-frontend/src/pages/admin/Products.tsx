import { useEffect, useState } from 'react';
import api from '../../api/axios';

interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    imageUrl: string | null;
    isAvailable: boolean;
    category: {
        name: string;
    };
}

const Products = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

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

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>상품 관리 (Products)</h2>
                <button className="scm-btn scm-btn-primary">
                    <i className="fas fa-plus"></i> 상품 등록
                </button>
            </div>

            <div className="scm-card">
                <table className="scm-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>이미지</th>
                            <th>상품명</th>
                            <th>카테고리</th>
                            <th>가격</th>
                            <th>상태</th>
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
                                <td>{product.name}</td>
                                <td>{product.category.name}</td>
                                <td>₩{product.price.toLocaleString()}</td>
                                <td>
                                    {product.isAvailable ? (
                                        <span className="status-badge status-approved">판매중</span>
                                    ) : (
                                        <span className="status-badge status-rejected">품절</span>
                                    )}
                                </td>
                                <td>
                                    <button style={{ marginRight: '5px', border: '1px solid #ddd', background: 'white', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer' }}>
                                        수정
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Products;
