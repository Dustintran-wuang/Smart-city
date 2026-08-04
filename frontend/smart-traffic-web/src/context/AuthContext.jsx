import React, { createContext, useState, useEffect } from 'react';
import authApi from '../api/authApi';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Kiểm tra token khi khởi động
        const checkAuth = async () => {
            const token = localStorage.getItem('accessToken');
            if (token) {
                try {
                    const res = await authApi.getCurrentUser();
                    if (res && res.data) {
                        setUser(res.data);
                        setIsLoggedIn(true);
                    }
                } catch (error) {
                    // Nếu lỗi (token hết hạn mà refresh fail), tự động xóa token (axios interceptor đã làm)
                    setIsLoggedIn(false);
                    setUser(null);
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = (userData, accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        setUser(userData);
        setIsLoggedIn(true);
    };

    const logout = async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            try {
                await authApi.logout({ refreshToken });
            } catch (err) {
                console.error("Logout API failed", err);
            }
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
        setIsLoggedIn(false);
    };

    return (
        <AuthContext.Provider value={{ user, isLoggedIn, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
