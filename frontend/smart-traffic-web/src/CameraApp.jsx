import React from 'react';

function CameraApp() {
    const streamUrl = "http://192.168.1.4:81/stream";

    return (
        <div className="camera-container">

            <div className="video-box">
                <div style={{ width: '100%', height: '100%' }}>
                    <img
                        src={streamUrl}
                        alt="ESP32 Camera Stream"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block'
                        }}
                    />
                </div>
            </div>

        </div>
    );
}

export default CameraApp;