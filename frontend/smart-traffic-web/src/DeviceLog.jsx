import React from 'react';

const DeviceLog = ({ danhSachThietBi, setIsDeviceLogOpen }) => {
    const formatTime = (timeString) => {
        if (!timeString) return "Chưa từng kết nối";
        return timeString.replace('T', ' ').substring(0, 19);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
            <div style={{
                backgroundColor: '#111', width: '700px', maxHeight: '80vh',
                borderRadius: '15px', border: '2px solid #555', display: 'flex', flexDirection: 'column'
            }}>
                {/* Header Popup */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', borderBottom: '1px solid #333' }}>
                    <h2 style={{ margin: 0, color: '#00ff00', letterSpacing: '1px' }}>DANH SÁCH THIẾT BỊ GIÁM SÁT</h2>
                    <button
                        onClick={() => setIsDeviceLogOpen(false)}
                        style={{ backgroundColor: '#ff4444', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        X
                    </button>
                </div>

                {/* Nội dung bảng danh sách */}
                <div style={{ padding: '20px', overflowY: 'auto' }}>
                    {danhSachThietBi.length === 0 ? (
                        <div style={{ color: '#a0aec0', textAlign: 'center' }}>Hệ thống chưa đăng ký thiết bị nào.</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cbd5e0', fontSize: '14px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #333', color: '#a0aec0', textAlign: 'left' }}>
                                    <th style={{ padding: '10px' }}>Mã thiết bị</th>
                                    <th style={{ padding: '10px' }}>Vị trí lắp đặt</th>
                                    <th style={{ padding: '10px' }}>Tín hiệu cuối</th>
                                    <th style={{ padding: '10px', textAlign: 'center' }}>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {danhSachThietBi.map((device) => (
                                    <tr key={device.id} style={{ borderBottom: '1px solid #222', transition: '0.3s' }}>
                                        <td style={{ padding: '12px', fontWeight: 'bold', color: '#f6ad55' }}>{device.deviceCode}</td>
                                        <td style={{ padding: '12px' }}>{device.location || 'Chưa định vị'}</td>
                                        <td style={{ padding: '12px', color: '#a0aec0' }}>{formatTime(device.lastHeartbeat)}</td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            <span style={{
                                                backgroundColor: device.isActive ? 'rgba(72, 187, 120, 0.2)' : 'rgba(245, 101, 101, 0.2)',
                                                color: device.isActive ? '#48bb78' : '#f56565',
                                                border: `1px solid ${device.isActive ? '#48bb78' : '#f56565'}`,
                                                padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold'
                                            }}>
                                                {device.isActive ? 'Trực tuyến' : 'Ngoại tuyến'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeviceLog;