import React from 'react';

const LichSuCanhBao = ({ setIsLogOpen, lichSuCanhBao = [] }) => {

    const dich = (type) => {
        switch (type) {
            case 'DROWSY': return 'Ngủ gật';
            default: return 'Không xác định';
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
            <div style={{
                backgroundColor: '#111', width: '650px', maxHeight: '80vh',
                borderRadius: '15px', border: '2px solid #555', display: 'flex', flexDirection: 'column'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', borderBottom: '1px solid #333' }}>
                    <h2 style={{ margin: 0, color: '#f6ad55' }}>LỊCH SỬ CẢNH BÁO ({lichSuCanhBao.length})</h2>
                    <button
                        onClick={() => setIsLogOpen(false)}
                        style={{ backgroundColor: 'red', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        X
                    </button>
                </div>

                <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {lichSuCanhBao.length === 0 ? (
                        <div style={{ color: '#a0aec0' }}>Chưa có dữ liệu cảnh báo nào.</div>
                    ) : (
                        lichSuCanhBao.map((item) => {
                            const time = item.created_at;
                            const ear = item.ear_value;
                            const threshold = item.ear_threshold;
                            const frames = item.consecutive_frames;
                            const isAck = item.is_acknowledged;
                            const type = item.type;

                            return (
                                <div key={item.id} style={{
                                    display: 'flex', flexDirection: 'column', padding: '15px',
                                    backgroundColor: '#222', borderRadius: '8px', borderLeft: `5px solid ${isAck ? '#48bb78' : '#f56565'}`
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <span style={{ color: '#a0aec0', fontWeight: 'bold' }}> {time}</span>
                                        <span style={{
                                            backgroundColor: type === 'DROWSY' ? '#f56565' : '#ed8936',
                                            padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', color: 'white'
                                        }}>
                                            {dich(type)}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#cbd5e0' }}>
                                        <span>EAR: <b style={{ color: ear < threshold ? 'red' : '#00ff00' }}>{ear}</b> / {threshold}</span>
                                        <span>Số frame: <b>{frames}</b></span>
                                        <span>Trạng thái: <b style={{ color: isAck ? '#48bb78' : '#a0aec0' }}>{isAck ? 'Đã xác nhận' : 'Chưa xử lý'}</b></span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default LichSuCanhBao;