import React from 'react';

const StatCard = ({ title, value, unit, icon, color }) => {
    return (
        <div style={{ backgroundColor: '#2d3748', padding: '20px', borderRadius: '12px', width: '220px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
            <p style={{ color: '#a0aec0', fontSize: '14px', margin: '0 0 10px 0' }}>{icon} {title}</p>
            <h2 style={{ color: color, fontSize: '36px', margin: 0 }}>
                {value} <span style={{ fontSize: '16px', color: '#718096' }}>{unit}</span>
            </h2>
        </div>
    );
};

export default StatCard;