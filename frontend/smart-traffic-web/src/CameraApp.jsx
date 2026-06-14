import React from 'react';

function CameraApp() {
    const streamUrl = "http://192.168.1.14:81/stream";

    return (
        <div className="camera-container">

            <div className="video-box">
                <img
                    src={streamUrl}
                    alt="ESP32 Camera Stream"
                    style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                />
            </div>

        </div>
    );
}

export default CameraApp;