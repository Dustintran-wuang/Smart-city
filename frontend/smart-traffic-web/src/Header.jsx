import React from 'react';

const Header = ({ mqttStatus }) => {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #4a5568' }}>
            <h1 style={{ margin: 0, color: '#63b3ed', fontSize: '24px' }}>🚦 TRAFFIC AI DASHBOARD</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: mqttStatus === 'Connected' ? '#48bb78' : '#f56565' }}></div>
                <span style={{ color: '#cbd5e0' }}>MQTT: {mqttStatus}</span>
            </div>
        </div>
    );
};

export default Header;