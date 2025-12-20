import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            if (user.role === 'ADMIN') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (err: any) {
            console.error("Login failed", err);
            setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
        }
    };

    return (
        <div style={{
            backgroundColor: '#f0f2f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            margin: 0,
            // Using a solid color fallback or we can copy the image to assets later
            backgroundImage: `linear-gradient(rgba(0, 137, 123, 0.05), rgba(0, 137, 123, 0.05))`
        }}>
            <div style={{
                background: 'white',
                padding: '3rem',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                width: '100%',
                maxWidth: '400px',
                textAlign: 'center',
            }}>
                <div style={{
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    color: '#00897b',
                    marginBottom: '0.5rem',
                    textDecoration: 'none',
                    display: 'inline-block'
                }}>
                    RIUM
                </div>
                <p style={{ color: '#666', marginBottom: '2rem', fontSize: '0.95rem' }}>
                    SCM Partner System
                </p>

                {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

                <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: 600, fontSize: '0.9rem' }}>
                            Email (ID)
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@rium.co.kr"
                            required
                            style={{
                                width: '100%',
                                padding: '0.8rem 1rem',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                fontSize: '1rem',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: 600, fontSize: '0.9rem' }}>
                            비밀번호 (Password)
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            required
                            style={{
                                width: '100%',
                                padding: '0.8rem 1rem',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                fontSize: '1rem',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <button type="submit" style={{
                        width: '100%',
                        padding: '1rem',
                        backgroundColor: '#00897b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        marginTop: '1rem'
                    }}>
                        로그인 (Login)
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                    <a href="#" style={{ color: '#666', textDecoration: 'none' }}>아이디/비밀번호 찾기</a>
                    {/* Link back to main site contact */}
                    <a href="http://localhost:5173/contact.html" style={{ color: '#666', textDecoration: 'none' }}>파트너 입점 문의</a>
                </div>
            </div>
        </div>
    );
};

export default Login;
