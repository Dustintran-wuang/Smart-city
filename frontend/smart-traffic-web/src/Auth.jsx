import React from "react";
import { useState, useEffect } from "react";
import axiosClient from "./api/axiosClient";

const Auth = ({ setIsLoggedIn, setUserInfo }) => {
    const [authMode, setAuthMode] = useState('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const xuLyDangNhap = async (e) => {
        e.preventDefault();
        // try {
        //     const response = await axiosClient.post('/auth/login', {
        //         username: username,
        //         password: password
        //     });

        //     const data = response.data.data;

        //     const theChinh = data.accessToken;
        //     const theDuPhong = data.refreshToken;
        //     const thongTinUser = data.user;

        //     if (theChinh) {
        //         localStorage.setItem('access_token', theChinh);
        //         localStorage.setItem('refresh_token', theDuPhong);
        //         localStorage.setItem('user_info', JSON.stringify(thongTinUser));

        //         setUserInfo(thongTinUser);

        //         setIsLoggedIn(true);
        //         alert(response.data.message);
        //     }

        // } catch (error) {
        //     console.error("Lỗi đăng nhập:", error);

        //     const loiTuBackend = error.response?.data?.message || "Lỗi kết nối Server";
        //     alert("Thất bại: " + loiTuBackend);
        // }

        const thongTinUserFake = {
            id: 99,
            username: username || "TaiXe_Test",
            email: "test@gmail.com",
            role: "USER"
        };

        const tokenFake = "fake_token_xin_vcl";

        localStorage.setItem('access_token', tokenFake);
        localStorage.setItem('refresh_token', 'fake_refresh_token');
        localStorage.setItem('user_info', JSON.stringify(thongTinUserFake));

        setUserInfo(thongTinUserFake);
        setIsLoggedIn(true);
        alert("Đăng nhập bằng dữ liệu giả ok");
    };

    const xuLyDangKy = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert("Mật khẩu xác nhận không trùng khớp");
            return;
        }

        try {
            const response = await axiosClient.post('/auth/register', {
                username: username,
                password: password,
                email: email
            });

            alert("Đăng ký thành công");
            setAuthMode('login');
            setConfirmPassword('');
            setEmail('');
        } catch (error) {
            const loi = error.response?.data?.message || "Lỗi đăng ký";
            alert("Đăng ký thất bại: " + loi);
        }
    };

    return (
        <div style={{
            backgroundColor: '#000', minHeight: '100vh', display: 'flex',
            justifyContent: 'center', alignItems: 'center', fontFamily: 'Arial, sans-serif', color: 'white'
        }}>
            <div style={{
                backgroundColor: '#111', padding: '40px', borderRadius: '15px',
                border: '2px solid #333', width: '350px', boxShadow: '0 0 20px rgba(0, 255, 0, 0.1)'
            }}>
                <h2 style={{ textAlign: 'center', color: '#00ff00', marginBottom: '30px', letterSpacing: '2px' }}>
                    {authMode === 'login' ? 'ĐĂNG NHẬP HỆ THỐNG' : 'ĐĂNG KÝ TÀI KHOẢN'}
                </h2>

                <form onSubmit={authMode === 'login' ? xuLyDangNhap : xuLyDangKy} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {authMode === 'register' && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#aaa' }}>Email:</label>
                            <input
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #444', backgroundColor: '#222', color: 'white', boxSizing: 'border-box' }}
                            />
                        </div>
                    )}

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#aaa' }}>Tên đăng nhập:</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #444', backgroundColor: '#222', color: 'white', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#aaa' }}>Mật khẩu:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #444', backgroundColor: '#222', color: 'white', boxSizing: 'border-box' }}
                        />
                    </div>

                    {authMode === 'register' && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#aaa' }}>Xác nhận mật khẩu:</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #444', backgroundColor: '#222', color: 'white', boxSizing: 'border-box' }}
                            />
                        </div>
                    )}

                    <button type="submit" style={{
                        backgroundColor: '#00ff00', color: 'black', border: 'none', padding: '12px',
                        borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', marginTop: '10px',
                        transition: '0.3s', boxShadow: '0 4px 10px rgba(0, 255, 0, 0.3)'
                    }}>
                        {authMode === 'login' ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#888' }}>
                    {authMode === 'login' ? (
                        <span>Chưa có tài khoản? <b onClick={() => setAuthMode('register')} style={{ color: '#00ff00', cursor: 'pointer' }}>Đăng ký ngay</b></span>
                    ) : (
                        <span>Đã có tài khoản? <b onClick={() => setAuthMode('login')} style={{ color: '#00ff00', cursor: 'pointer' }}>Đăng nhập</b></span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Auth;