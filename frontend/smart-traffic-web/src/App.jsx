import React, { useState } from 'react';
import hinhBieuDo from './assets/interface.png';
import CameraApp from './CameraApp.jsx';

const App = () => {
    const [soXe, setSoXe] = useState(69);
    const [canhBao, setCanhBao] = useState(13);
    const [trangThai, setTrangThai] = useState("NGỦ GẬT");
    const [isAuto, setIsAuto] = useState(true);
    const [denHienTai, setDenHienTai] = useState('RED');
    const [isLogOpen, setIsLogOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const lichSuCanhBao = [
        { id: 1, thoiGian: '14:30:05', loi: 'Ngủ gật (Mắt nhắm > 3s)' },
        { id: 2, thoiGian: '13:15:20', loi: 'Không tập trung (Quay mặt đi)' },
        { id: 3, thoiGian: '10:45:12', loi: 'Ngáp dài liên tục' },
        { id: 4, thoiGian: '09:20:00', loi: 'Ngủ gật (Mắt nhắm > 3s)' },
        { id: 5, thoiGian: '08:05:10', loi: 'Không thấy mặt tài xế' },
        { id: 6, thoiGian: '07:30:00', loi: 'Hệ thống bắt đầu chạy' },
    ];

    const xuLyDangNhập = (e) => {
        e.preventDefault();
        if (username === 'admin' && password === '123456') {
            setIsLoggedIn(true);
        } else {
            alert("Sai tài khoản hoặc mật khẩu rồi em ơi (Thử: admin / 123456)");
        }
    };

    const xuLyDangKy = (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert("Mật khẩu xác nhận không trùng khớp em ơi");
            return;
        }
        alert("Đăng ký thành công, quay lại đăng nhập đi em.");
        setAuthMode('login');
        setConfirmPassword('');
    };

    // Nếu Chưa đăng nhập
    if (!isLoggedIn) {
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

                    <form onSubmit={authMode === 'login' ? xuLyDangNhập : xuLyDangKy} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

    const xuLyBamDen = (mauDen) => {
        if (isAuto === false) {
            setDenHienTai(mauDen);
        } else {
            alert("Hệ thống đang AUTO. tắt AUTO để điều khiển bằng chân");
        }
    };

    return (
        <div style={{
            backgroundColor: '#000', minHeight: '100vh', color: 'white',
            fontFamily: 'Arial, sans-serif', padding: '20px', display: 'grid',
            gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto 1fr', gap: '20px',
            position: 'relative'
        }}>

            {/*HEader*/}
            <div style={{ gridColumn: '1 / span 2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '15px', height: '15px', borderRadius: '50%', backgroundColor: '#00ff00' }}></div>
                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>MQTT: <span style={{ color: '#00ff00' }}>Đã kết nối</span></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button
                        onClick={() => {
                            setIsLoggedIn(false);
                            setUsername('');
                            setPassword('');
                        }}
                        style={{ backgroundColor: '#222', color: '#ff4444', border: '1px solid #ff4444', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', transition: '0.3s' }}
                    >
                        ĐĂNG XUẤT
                    </button>
                    <span style={{ fontSize: '20px', fontWeight: 'bold' }}>USER</span>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#ccc', border: '3px solid white' }}></div>
                </div>
            </div>

            {/* BÊN TRÁI: BIỂU ĐỒ */}
            <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'start' }}>
                <img src={hinhBieuDo} alt="Chart" style={{ width: '100%', height: '320px' }} />
            </div>

            {/* BÊN PHẢI: CAMERA & THÔNG SỐ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                <div style={{ backgroundColor: '#000', border: '5px solid white', height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '20px', color: '#aaa' }}> [ CAMERA ĐANG TẠM ẨN ] </span>
                    </div>
                    {/* <CameraApp /> */}
                    <div style={{ position: 'absolute', top: 10, left: 10, borderLeft: '4px solid white', borderTop: '4px solid white', width: 30, height: 30 }}></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignSelf: 'start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'red' }}></div>
                            <span style={{ fontSize: '20px' }}>Trạng thái tài xế: <b style={{ color: 'red' }}>{trangThai}</b></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'white' }}></div>
                            <span style={{ fontSize: '20px' }}>Tổng số lần cảnh báo hôm nay: <b>{canhBao}</b></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'white' }}></div>
                            <span style={{ fontSize: '20px' }}>Tổng số xe hôm nay: <b>{soXe}</b></span>
                        </div>
                    </div>

                    {/* KHU VỰC ĐIỀU KHIỂN */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        {/* NÚT LOG */}
                        <div
                            onClick={() => setIsLogOpen(true)}
                            style={{
                                width: '60px', height: '60px', backgroundColor: '#333',
                                borderRadius: '10px', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: '30px', cursor: 'pointer',
                                border: '2px solid white', boxShadow: '0 4px 6px rgba(0,0,0,0.5)', alignSelf: 'start'
                            }}
                            title="Xem lịch sử cảnh báo"
                        >
                            📄
                        </div>

                        {/* Đèn & Auto */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', alignSelf: 'start' }}>
                            <div style={{ backgroundColor: '#222', padding: '10px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px', border: '2px solid #444' }}>
                                <div onClick={() => xuLyBamDen('RED')} style={{ width: '30px', height: '30px', borderRadius: '50%', cursor: isAuto ? 'not-allowed' : 'pointer', backgroundColor: denHienTai === 'RED' ? 'red' : '#440000', boxShadow: denHienTai === 'RED' ? '0 0 15px red' : 'none' }}></div>
                                <div onClick={() => xuLyBamDen('YELLOW')} style={{ width: '30px', height: '30px', borderRadius: '50%', cursor: isAuto ? 'not-allowed' : 'pointer', backgroundColor: denHienTai === 'YELLOW' ? 'yellow' : '#444400', boxShadow: denHienTai === 'YELLOW' ? '0 0 15px yellow' : 'none' }}></div>
                                <div onClick={() => xuLyBamDen('GREEN')} style={{ width: '30px', height: '30px', borderRadius: '50%', cursor: isAuto ? 'not-allowed' : 'pointer', backgroundColor: denHienTai === 'GREEN' ? '#00ff00' : '#004400', boxShadow: denHienTai === 'GREEN' ? '0 0 15px #00ff00' : 'none' }}></div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '12px', marginBottom: '5px' }}>AUTO</div>
                                <div onClick={() => setIsAuto(!isAuto)} style={{ width: '40px', height: '20px', backgroundColor: isAuto ? '#00ff00' : '#444', borderRadius: '10px', position: 'relative', cursor: 'pointer' }}>
                                    <div style={{ width: '16px', height: '16px', backgroundColor: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: isAuto ? '22px' : '2px', transition: '0.3s' }}></div>
                                </div>
                            </div>
                        </div>

                        {/* Nút Còi */}
                        <div style={{ width: '80px', height: '80px', background: 'repeating-linear-gradient(45deg, #ffcc00, #ffcc00 10px, #000 10px, #000 20px)', border: '4px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', alignSelf: 'start' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'red', border: '2px solid white' }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* POPUP LỊCH SỬ VI PHẠM */}
            {isLogOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
                }}>
                    <div style={{
                        backgroundColor: '#111', width: '500px', maxHeight: '70vh',
                        borderRadius: '15px', border: '2px solid #555', display: 'flex', flexDirection: 'column'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', borderBottom: '1px solid #333' }}>
                            <h2 style={{ margin: 0, color: '#f6ad55' }}>LỊCH SỬ CẢNH BÁO</h2>
                            <button
                                onClick={() => setIsLogOpen(false)}
                                style={{ backgroundColor: 'red', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                ĐÓNG X
                            </button>
                        </div>

                        <div style={{ padding: '20px', overflowY: 'auto' }}>
                            {lichSuCanhBao.map((item) => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed #444' }}>
                                    <span style={{ color: '#a0aec0', fontWeight: 'bold' }}>{item.thoiGian}</span>
                                    <span style={{ color: '#fc8181' }}>{item.loi}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default App;