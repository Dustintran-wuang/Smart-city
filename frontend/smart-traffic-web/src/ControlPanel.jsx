import React from 'react';

const ControlPanel = ({ onBuzzerClick, isSending }) => {
    return (
        <div style={{ backgroundColor: '#2d3748', padding: '20px', borderRadius: '12px', marginTop: '20px' }}>
            <h3 style={{ color: '#cbd5e0', marginTop: 0 }}>🎛️ ĐIỀU KHIỂN HỆ THỐNG</h3>
            <button
                onClick={onBuzzerClick}
                disabled={isSending}
                style={{
                    padding: '12px 25px',
                    backgroundColor: isSending ? '#4a5568' : '#e53e3e',
                    color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
                }}
            >
                {isSending ? "ĐANG GỬI LỆNH..." : "🚨 BẬT CÒI CẢNH BÁO"}
            </button>
        </div>
    );
};

export default ControlPanel;