import axiosClient from './axiosClient';

const alertApi = {
    getAllAlerts: () => {
        const url = '/alerts';
        return axiosClient.get(url);
    }
};

export default alertApi;
