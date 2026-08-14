import React, { useState, useEffect, useContext } from 'react';
import CameraApp from './CameraApp.jsx';
import { AuthContext } from './context/AuthContext';
import authApi from './api/authApi';
import dashboardApi from './api/dashboardApi';
import axiosClient from './api/axiosClient.js';
import AlertLog from './AlertLog.jsx';
import DeviceLog from './DeviceLog';
import Chatbot from './Chatbot.jsx';
import chatbot_icon from './assets/chatbot_icon.png';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const App = () => {
    const { user, isLoggedIn, login, logout, loading } = useContext(AuthContext);

    const [soXe, setSoXe] = useState(0);
    const [canhBao, setCanhBao] = useState(0);
    const [trangThai, setTrangThai] = useState("BÌNH THƯỜNG");

    const [isAuto, setIsAuto] = useState(true);
    const [denHienTai, setDenHienTai] = useState(false);
    const [coiHienTai, setCoiHienTai] = useState(false);
    const [isLogOpen, setIsLogOpen] = useState(false);
    const [isDeviceLogOpen, setIsDeviceLogOpen] = useState(false);
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const [lichSuCanhBao, setLichSuCanhBao] = useState([]);

    const [authMode, setAuthMode] = useState('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState('');
    const [authError, setAuthError] = useState('');

    const [danhSachThietBi, setDanhSachThietBi] = useState([]);
    const [duLieuBieuDo, setDuLieuBieuDo] = useState([]);

    const tongSoThietBi = danhSachThietBi.length;
    const soThietBiConnected = danhSachThietBi.filter(device => device.isActive).length;

    const fetchAlerts = async () => {
        try {
            const alertsRes = await axiosClient.get('/alerts');
            // Do interceptor đã bóc data, alertsRes có thể chính là mảng kết quả
            const data = alertsRes.data?.data || alertsRes.data || alertsRes;

            if (Array.isArray(data)) {
                setLichSuCanhBao(data);
            } else if (data && Array.isArray(data.content)) {
                setLichSuCanhBao(data.content);
            }
        } catch (error) {
            console.error("Lỗi khi tải lịch sử cảnh báo:", error);
        }
    };

    useEffect(() => {
        let interval;
        if (isLoggedIn) {
            fetchDashboardData();
            fetchDevices();
            fetchAlerts();

            interval = setInterval(() => {
                fetchDashboardData();
                fetchDevices();
                fetchAlerts();
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [isLoggedIn]);

    useEffect(() => {
        let interval;
        if (isLoggedIn) {
            fetchDashboardData();
            fetchDevices();
            interval = setInterval(() => {
                fetchDashboardData();
                fetchDevices();
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [isLoggedIn]);

    const fetchDashboardData = async () => {
        try {
            const statsRes = await dashboardApi.getStats();
            if (statsRes) {
                const data = statsRes.data || statsRes;
                setSoXe(data.totalVehicles || 0);
                setCanhBao(data.totalAlertsToday || 0);
                setTrangThai(data.totalAlertsToday > 0 ? "CÓ CẢNH BÁO" : "BÌNH THƯỜNG");
                if (data.alertsByHour) {
                    setDuLieuBieuDo(data.alertsByHour);
                }
            }
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu dashboard", error);
        }
    };

    const fetchDevices = async () => {
        try {
            const devicesRes = await axiosClient.get('/devices');
            const data = devicesRes.data || devicesRes;
            if (Array.isArray(data)) {
                setDanhSachThietBi(data);
            }
        } catch (error) {
            console.error("Lỗi khi tải danh sách thiết bị", error);
        }
    };

    const xuLyDangNhap = async (e) => {
        e.preventDefault();
        setAuthError('');
        try {
            const res = await authApi.login({ username, password });
            if (res && res.data) {
                login(res.data.user, res.data.accessToken, res.data.refreshToken);
            }
        } catch (error) {
            const msg = error.response?.data?.message || error.message || "Sai tài khoản hoặc mật khẩu!";
            setAuthError(msg);
        }
    };

    const xuLyDangKy = async (e) => {
        e.preventDefault();
        setAuthError('');
        if (password !== confirmPassword) {
            setAuthError("Mật khẩu xác nhận không trùng khớp");
            return;
        }
        try {
            await authApi.register({ username, password, email });
            alert("Đăng ký thành công, quay lại đăng nhập.");
            setAuthMode('login');
            setConfirmPassword('');
        } catch (error) {
            const msg = error.response?.data?.message;
            if (msg) {
                setAuthError("Lỗi từ server: " + (typeof msg === 'string' ? msg : JSON.stringify(msg)));
            } else {
                setAuthError("Lỗi mạng hoặc server không phản hồi: " + error.message);
            }
        }
    };

    if (loading) {
        return <div style={{ backgroundColor: '#000', color: '#00ff00', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Đang tải cấu hình...</div>;
    }

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

                    {authError && <div style={{ color: 'red', marginBottom: '15px', textAlign: 'center', fontSize: '14px' }}>{authError}</div>}

                    <form onSubmit={authMode === 'login' ? xuLyDangNhap : xuLyDangKy} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

                        {authMode === 'register' && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#aaa' }}>Email:</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #444', backgroundColor: '#222', color: 'white', boxSizing: 'border-box' }}
                                />
                            </div>
                        )}

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

    const getTargetDeviceCode = () => {
        const activeDevice = danhSachThietBi.find(d => d.isOnline || d.isActive);
        return activeDevice ? activeDevice.deviceCode : 'DEV-CAM-001';
    };

    const xuLyBamDen = async () => {
        if (isAuto === false) {
            const newStatus = !denHienTai;
            setDenHienTai(newStatus);
            try {
                await axiosClient.post(`/devices/${getTargetDeviceCode()}/control/light`, { action: newStatus ? "ON" : "OFF" });
            } catch (err) {
                console.error("Lỗi khi điều khiển đèn", err);
            }
        } else {
            alert("Hệ thống đang AUTO. tắt AUTO để điều khiển bằng tay");
        }
    };

    const xuLyBamCoi = async () => {
        if (isAuto === false) {
            const newStatus = !coiHienTai;
            setCoiHienTai(newStatus);
            try {
                await axiosClient.post(`/devices/${getTargetDeviceCode()}/control/buzzer`, { action: newStatus ? "ON" : "OFF" });
            } catch (err) {
                console.error("Lỗi khi điều khiển còi", err);
            }
        } else {
            alert("Hệ thống đang AUTO. tắt AUTO để điều khiển bằng tay");
        }
    };

    const chartData = {
        labels: duLieuBieuDo.map(item => `${item.hour}h`),
        datasets: [
            {
                label: 'Số lần cảnh báo',
                data: duLieuBieuDo.map(item => item.count),
                backgroundColor: 'rgba(255, 99, 132, 0.7)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: {
                display: true,
                text: 'Thống kê cảnh báo theo giờ trong ngày',
                font: { size: 16 }
            }
        },
        scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } }
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
                    <div style={{
                        width: '15px',
                        height: '15px',
                        borderRadius: '50%',
                        backgroundColor: soThietBiConnected > 0 ? '#00ff00' : 'red',
                        boxShadow: soThietBiConnected > 0 ? '0 0 8px #00ff00' : '0 0 8px red'
                    }}></div>

                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>
                        <button
                            onClick={() => setIsDeviceLogOpen(true)}
                            style={{
                                background: 'none', border: 'none',
                                color: '#00ff00', fontSize: '18px', fontWeight: 'bold',
                                cursor: 'pointer', padding: 0, textDecoration: 'underline',
                                marginRight: '6px', display: 'inline-block', transition: '0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.color = '#f6ad55'}
                            onMouseOut={(e) => e.target.style.color = '#00ff00'}
                        >
                            Thiết bị:
                        </button>
                        <span>{soThietBiConnected}/{tongSoThietBi} đã kết nối</span>
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button
                        onClick={logout}
                        style={{ backgroundColor: '#222', color: '#ff4444', border: '1px solid #ff4444', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', transition: '0.3s' }}
                    >
                        ĐĂNG XUẤT
                    </button>
                    <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{user?.username?.toUpperCase() || 'USER'}</span>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#ccc', border: '3px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', fontWeight: 'bold', fontSize: '14px' }}>
                        {user?.username?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                </div>
            </div>

            {/* BÊN TRÁI: BIỂU ĐỒ */}
            <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '20px', height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'start', width: '100%', boxSizing: 'border-box' }}>
                {duLieuBieuDo.length > 0 ? (
                    <Bar data={chartData} options={chartOptions} />
                ) : (
                    <span style={{ color: '#555' }}>Chưa có dữ liệu cảnh báo hoặc đang tải...</span>
                )}
            </div>

            {/* Chatbot */}
            <button
                onClick={() => {
                    setIsChatbotOpen(!isChatbotOpen);
                }}
                style={{
                    position: "fixed",
                    bottom: '0px',
                    left: '10px',
                    borderRadius: '50%',
                    backgroundColor: 'black',
                    width: '80px',
                    height: '80px',
                    cursor: 'pointer',
                    border: 'none',
                    overflow: 'hidden',
                    zIndex: '9999'
                }}>
                <img src={chatbot_icon} width="100%" height="100%" object-fit="cover" />
            </button>

            {/* BÊN PHẢI: CAMERA & THÔNG SỐ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                <div style={{ backgroundColor: '#000', border: '5px solid white', height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <div style={{
                        backgroundColor: '#000',
                        border: '5px solid white',
                        boxSizing: 'border-box',
                        height: '350px',
                        width: '100%',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <CameraApp />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignSelf: 'start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: trangThai === 'CÓ CẢNH BÁO' ? 'red' : 'green' }}></div>
                            <span style={{ fontSize: '20px' }}>Trạng thái tài xế: <b style={{ color: trangThai === 'CÓ CẢNH BÁO' ? 'red' : 'green' }}>{trangThai}</b></span>
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
                        {/* BẢNG ĐIỀU KHIỂN CÔNG NGHIỆP */}
                        <div style={{ backgroundColor: '#1a1a1a', padding: '15px 25px', borderRadius: '12px', border: '3px solid #333', display: 'flex', gap: '30px', boxShadow: '5px 5px 15px rgba(0,0,0,0.5)' }}>
                            
                            {/* Chế độ */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#aaa', letterSpacing: '1px' }}>CHẾ ĐỘ ⚙️</div>
                                <div onClick={() => setIsAuto(!isAuto)} style={{ width: '56px', height: '28px', backgroundColor: isAuto ? '#00cc00' : '#555', borderRadius: '14px', position: 'relative', cursor: 'pointer', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.4)', border: '1px solid #444' }}>
                                    <div style={{ width: '24px', height: '24px', backgroundColor: '#fff', borderRadius: '50%', position: 'absolute', top: '1px', left: isAuto ? '29px' : '2px', transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}></div>
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: isAuto ? '#00cc00' : '#888' }}>{isAuto ? 'AUTO' : 'MANUAL'}</div>
                            </div>

                            <div style={{ width: '2px', backgroundColor: '#333', borderRadius: '1px' }}></div>

                            {/* Đèn */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#aaa', letterSpacing: '1px' }}>ĐÈN 🚨</div>
                                <div onClick={xuLyBamDen} style={{ width: '56px', height: '28px', backgroundColor: denHienTai ? '#ff0000' : '#440000', borderRadius: '14px', position: 'relative', cursor: isAuto ? 'not-allowed' : 'pointer', opacity: isAuto ? 0.4 : 1, boxShadow: denHienTai ? '0 0 15px red' : 'inset 0 2px 5px rgba(0,0,0,0.4)', border: '1px solid #444' }}>
                                    <div style={{ width: '24px', height: '24px', backgroundColor: '#fff', borderRadius: '50%', position: 'absolute', top: '1px', left: denHienTai ? '29px' : '2px', transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}></div>
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: denHienTai ? '#ff0000' : '#777' }}>{denHienTai ? 'BẬT' : 'TẮT'}</div>
                            </div>

                            {/* Còi */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#aaa', letterSpacing: '1px' }}>CÒI 📢</div>
                                <div onClick={xuLyBamCoi} style={{ width: '56px', height: '28px', backgroundColor: coiHienTai ? '#ff0000' : '#440000', borderRadius: '14px', position: 'relative', cursor: isAuto ? 'not-allowed' : 'pointer', opacity: isAuto ? 0.4 : 1, boxShadow: coiHienTai ? '0 0 15px red' : 'inset 0 2px 5px rgba(0,0,0,0.4)', border: '1px solid #444' }}>
                                    <div style={{ width: '24px', height: '24px', backgroundColor: '#fff', borderRadius: '50%', position: 'absolute', top: '1px', left: coiHienTai ? '29px' : '2px', transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}></div>
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: coiHienTai ? '#ff0000' : '#777' }}>{coiHienTai ? 'BẬT' : 'TẮT'}</div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* POPUP LỊCH SỬ VI PHẠM */}
            {isLogOpen && (
                <AlertLog
                    setIsLogOpen={setIsLogOpen}
                    lichSuCanhBao={lichSuCanhBao}
                />
            )}

            {/* POPUP DEVICES LOG */}
            {isDeviceLogOpen && (
                <DeviceLog danhSachThietBi={danhSachThietBi} setIsDeviceLogOpen={setIsDeviceLogOpen} />
            )}

            {/* Khung Chatbot */}
            <div style={{ display: isChatbotOpen ? 'block' : 'none' }}>
                <Chatbot
                    setIsChatbotOpen={setIsChatbotOpen}
                    canhBao={canhBao}
                    lichSuCanhBao={lichSuCanhBao}
                    soThietBiConnected={soThietBiConnected}
                    tongSoThietBi={tongSoThietBi}
                />
            </div>

        </div>
    );
};

export default App;