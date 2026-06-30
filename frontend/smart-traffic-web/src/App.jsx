import React, { useState, useEffect } from 'react';
import CameraApp from './CameraApp.jsx';
import axiosClient from './api/axiosClient.js';
import AlertLog from './AlertLog.jsx';
import Auth from './Auth.jsx';
import DeviceLog from './DeviceLog';
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
    const [soXe, setSoXe] = useState(0);
    const [canhBao, setCanhBao] = useState(0);
    const [trangThai, setTrangThai] = useState("");
    const [isAuto, setIsAuto] = useState(true);
    const [denHienTai, setDenHienTai] = useState('RED');
    const [isLogOpen, setIsLogOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userInfo, setUserInfo] = useState({});
    const [isDeviceLogOpen, setIsDeviceLogOpen] = useState(false);
    const [danhSachThietBi, setDanhSachThietBi] = useState([
        {
            id: 1,
            deviceCode: "ESP32-CAM-01",
            deviceType: "CAMERA",
            location: "Bla bla",
            isActive: true,
            lastHeartbeat: "2026-06-25T14:32:10"
        },
        {
            id: 2,
            deviceCode: "LED-01",
            deviceType: "TRAFFIC_LIGHT",
            location: "^$(#$@)(%)@",
            isActive: true,
            lastHeartbeat: "2026-06-25T14:32:10"
        },
        {
            id: 3,
            deviceCode: "BUZZER-02",
            deviceType: "BUZZER",
            location: "Lmao",
            isActive: false,
            lastHeartbeat: "2026-06-25T10:15:05"
        }
    ]);

    const tongSoThietBi = danhSachThietBi.length;
    const soThietBiConnected = danhSachThietBi.filter(device => device.isActive).length;

    const [duLieuBieuDo, setDuLieuBieuDo] = useState([
        { hour: 7, count: 1 },
        { hour: 8, count: 4 },
        { hour: 9, count: 7 },
        { hour: 10, count: 3 },
        { hour: 11, count: 0 },
        { hour: 12, count: 1 },
        { hour: 13, count: 5 },
        { hour: 14, count: 9 },
        { hour: 15, count: 4 },
        { hour: 16, count: 2 },
        { hour: 17, count: 1 }]);

    useEffect(() => {
        const kiemTraDangNhap = async () => {
            const token = localStorage.getItem('access_token');

            if (token) {
                if (token === "fake_token_xin_vcl") {
                    const thongTinXin = JSON.parse(localStorage.getItem('user_info'));
                    setUserInfo(thongTinXin);
                    setIsLoggedIn(true);
                    return;
                }

                try {
                    const response = await axiosClient.get('/auth/me');

                    const thongTinXin = response.data.data;
                    setUserInfo(thongTinXin);

                    localStorage.setItem('user_info', JSON.stringify(thongTinXin));

                    setIsLoggedIn(true);

                } catch (error) {
                    console.error("Phiên đăng nhập không hợp lệ");

                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('user_info');

                    setIsLoggedIn(false);
                }
            }
        };

        kiemTraDangNhap();
    }, []);

    useEffect(() => {
        if (!isLoggedIn) return;

        const kiemTraKetNoi = async () => {
            try {
                const response = await axiosClient.get('/devices');

                if (response.data) {
                    setDanhSachThietBi(response.data);
                }

            } catch (error) {
                console.error("Lỗi khi kết nối", error);
            }
        };

        kiemTraKetNoi();

        const intervalId = setInterval(kiemTraKetNoi, 5000);

        return () => clearInterval(intervalId);

    }, [isLoggedIn]);

    const xuLyDangXuat = async () => {
        try {
            const theDuPhong = localStorage.getItem('refresh_token');

            if (theDuPhong) {
                axiosClient.post('/auth/logout', {
                    refreshToken: theDuPhong
                }).catch(err => console.error("Lỗi ngầm khi logout:", err));
            }
        } catch (error) {
            console.error("Lỗi khi gọi API đăng xuất:", error);

        } finally {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user_info');

            setIsLoggedIn(false);
        }
    };

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                const response = await axiosClient.get('/dashboard/stats');
                const dataFromServer = response.data;

                //setSoXe(dataFromServer);
                setCanhBao(dataFromServer.totalAlertsToday);
                if (dataFromServer.alertsByHour) {
                    setDuLieuBieuDo(dataFromServer.alertsByHour);
                }
            } catch (error) {
                console.error("Lỗi khi lấy dữ liệu thống kê dashboard:", error);
            }
        };

        fetchDashboardStats();

        const intervalId = setInterval(fetchDashboardStats, 10000);

        return () => clearInterval(intervalId);

    }, []);

    // Nếu Chưa đăng nhập
    if (!isLoggedIn) {
        return (
            <Auth
                setIsLoggedIn={setIsLoggedIn}
                setUserInfo={setUserInfo}
            />
        );
    }

    const xuLyBamDen = (mauDen) => {
        if (isAuto === false) {
            setDenHienTai(mauDen);
        } else {
            alert("Hệ thống đang AUTO. tắt AUTO để điều khiển bằng chân");
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
                    {/* XANH: ÍT NHẤT 1 TB CHẠY, ĐỎ: 0 TBCHẠY*/}
                    <div style={{
                        width: '15px', height: '15px', borderRadius: '50%',
                        backgroundColor: soThietBiConnected > 0 ? '#00ff00' : 'red',
                        boxShadow: soThietBiConnected > 0 ? '0 0 8px #00ff00' : '0 0 8px red'
                    }}></div>

                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>
                        {/*bUTTON THIẾT BỊ*/}
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
                        {/* x/y đã kết nối */}
                        <span>{soThietBiConnected}/{tongSoThietBi} đã kết nối</span>
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button
                        onClick={xuLyDangXuat}
                        style={{ backgroundColor: '#222', color: '#ff4444', border: '1px solid #ff4444', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', transition: '0.3s' }}
                    >
                        ĐĂNG XUẤT
                    </button>
                    <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
                        {userInfo.username ? userInfo.username.toUpperCase() : 'USER'}
                    </span>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#ccc', border: '3px solid white' }}></div>
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
                        <button
                            onClick={() => setIsLogOpen(true)}
                            style={{
                                width: '60px', height: '60px',
                                backgroundColor: '#333',
                                color: 'white',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '30px',
                                cursor: 'pointer',
                                border: '2px solid white',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.5)',
                                alignSelf: 'start'
                            }}
                            title="Xem lịch sử cảnh báo"
                        >
                            📄
                        </button>

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
                <AlertLog
                    setIsLogOpen={setIsLogOpen}
                />
            )}

            {/* POPUP DEVICES LOG */}
            {isDeviceLogOpen && (
                <DeviceLog danhSachThietBi={danhSachThietBi} setIsDeviceLogOpen={setIsDeviceLogOpen} />
            )}

        </div>
    );
};

export default App;