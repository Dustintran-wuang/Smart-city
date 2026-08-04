import axiosClient from './axiosClient';

const dashboardApi = {
    getStats: () => {
        const url = '/dashboard/stats';
        return axiosClient.get(url);
    }
};

export default dashboardApi;
