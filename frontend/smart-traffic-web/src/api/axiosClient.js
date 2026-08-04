import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'http://localhost:8080/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor for Requests
axiosClient.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor for Responses
axiosClient.interceptors.response.use(
    (response) => {
        // Trả về thẳng data để khỏi phải `.data` nhiều lần
        if (response && response.data) {
            return response.data;
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Nếu lỗi 401 và chưa thử refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refreshToken');

            if (refreshToken) {
                try {
                    // Gọi API refresh token
                    const res = await axios.post('http://localhost:8080/api/v1/auth/refresh', {
                        refreshToken: refreshToken
                    });

                    if (res.data && res.data.data) {
                        const newAccessToken = res.data.data.accessToken;
                        const newRefreshToken = res.data.data.refreshToken;
                        
                        localStorage.setItem('accessToken', newAccessToken);
                        localStorage.setItem('refreshToken', newRefreshToken);

                        // Đổi token cho request cũ và gọi lại
                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                        return axiosClient(originalRequest);
                    }
                } catch (refreshError) {
                    // Nếu refresh lỗi -> xóa sạch và bắt đăng nhập lại
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/'; 
                }
            }
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
