import React, { useState } from 'react';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const Chatbot = ({ setIsChatbotOpen, canhBao, lichSuCanhBao = [], soThietBiConnected, tongSoThietBi }) => {

    const soCanhBaoChuaXuLy = lichSuCanhBao.filter(item => !item.is_acknowledged).length;

    const chitietCanhBaoText = lichSuCanhBao.length > 0
        ? lichSuCanhBao.map(item =>
            `- Lúc ${item.created_at}: EAR=${item.ear_value} (Ngưỡng: ${item.ear_threshold}) - Trạng thái: ${item.is_acknowledged ? 'Đã xử lý' : 'Chưa xử lý'}`
        ).join('\n')
        : "Chưa có cảnh báo nào.";

    const SYSTEM_PROMPT = `
Bạn là "Trợ lý AI An Toàn Giao Thông" tích hợp trong hệ thống cảnh báo ngủ gật.

DỮ LIỆU THỰC TẾ ĐANG CHẠY TRÊN HỆ THỐNG LÚC NÀY:
- Tổng số lần cảnh báo hôm nay: ${canhBao} lần.
- Số lần cảnh báo chưa xử lý: ${soCanhBaoChuaXuLy} lần.
- Chi tiết các lần cảnh báo gần đây:
${chitietCanhBaoText}
- Số thiết bị kết nối: ${soThietBiConnected}/${tongSoThietBi} thiết bị.

Nhiệm vụ:
- Khi người dùng hỏi về số lượng cảnh báo, cảnh báo chưa xử lý, thời gian bị cảnh báo hay chỉ số EAR, hãy trả lời CHÍNH XÁC theo DỮ LIỆU THỰC TẾ ở trên.
- Trả lời ngắn gọn, thân thiện, tư vấn an toàn lái xe.
`;

    const [messages, setMessages] = useState([
        { sender: 'bot', text: 'Xin chào! Mình là Trợ lý AI. Bạn cần tư vấn gì về hệ thống hoặc an toàn lái xe không?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userText = input.trim();
        const updatedMessages = [...messages, { sender: 'user', text: userText }];

        setMessages(updatedMessages);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    messages: [
                        { role: "system", content: SYSTEM_PROMPT },
                        { role: "user", content: userText }
                    ],
                    model: "llama-3.3-70b-versatile"
                })
            });

            const data = await response.json();

            if (data.error) {
                setMessages([...updatedMessages, { sender: 'bot', text: `Lỗi: ${data.error.message}` }]);
                return;
            }

            const botReply = data.choices?.[0]?.message?.content;
            if (botReply) {
                setMessages([...updatedMessages, { sender: 'bot', text: botReply }]);
            }
        } catch (error) {
            setMessages([...updatedMessages, { sender: 'bot', text: 'Lỗi kết nối mạng!' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '90px',
                left: '10px',
                width: '350px',
                height: '500px',
                maxWidth: 'calc(100vw - 20px)',
                maxHeight: 'calc(100vh - 110px)',
                backgroundColor: 'white',
                borderRadius: '16px',
                boxShadow: '0 5px 20px rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                zIndex: '9999',
                border: '3px solid #e0e0e0',
                transition: 'all 0.3s ease'
            }}
        >
            {/* Header */}
            <div
                style={{
                    backgroundColor: 'black',
                    color: 'white',
                    padding: '15px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: 'bold'
                }}
            >
                <span>Chatbot</span>

                <button
                    onClick={() => setIsChatbotOpen(false)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        fontSize: '18px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    ✕
                </button>
            </div>

            {/* Body (Khung chứa tin nhắn) */}
            <div style={{ padding: '15px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        style={{
                            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                            backgroundColor: msg.sender === 'user' ? '#000' : '#f0f0f0',
                            color: msg.sender === 'user' ? '#fff' : '#000',
                            padding: '10px 14px',
                            borderRadius: '14px',
                            maxWidth: '80%',
                            fontSize: '14px',
                            lineHeight: '1.4',
                            wordBreak: 'break-word'
                        }}
                    >
                        {msg.text}
                    </div>
                ))}
                {loading && (
                    <div style={{ alignSelf: 'flex-start', color: '#888', fontSize: '13px', fontStyle: 'italic' }}>
                        AI đang suy nghĩ...
                    </div>
                )}
            </div>

            {/* Footer (Ô nhập và nút gửi) */}
            <div style={{ padding: '10px', borderTop: '1px solid #eee', display: 'flex', gap: '8px' }}>
                <input
                    type="text"
                    placeholder="Hỏi về EAR, chống ngủ gật..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #ccc',
                        outline: 'none',
                        color: 'black'
                    }}
                />
                <button
                    onClick={handleSend}
                    disabled={loading}
                    style={{
                        backgroundColor: 'black',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0 15px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    Gửi
                </button>
            </div>
        </div>
    );
};

export default Chatbot;