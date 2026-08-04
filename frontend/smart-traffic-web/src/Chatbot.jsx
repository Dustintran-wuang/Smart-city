import React, { useState, useEffect } from 'react';
import chatbot_icon from './assets/chatbot_icon.png'

const Chatbot = () => {
    return (
        <div style={{
            position: "fixed",
            bottom: '0px',
            left: '10px',
            width: '80px',
            height: '80px',
            zIndex: '9999'
        }}>
            <img src={chatbot_icon} width="100%" height="100%" object-fit="cover" />
        </div>
    )
}

export default Chatbot;