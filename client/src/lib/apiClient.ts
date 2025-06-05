import axios from 'axios';

// You might want to set your API base URL here
// For example, if your API is served from '/api' on the same domain:
// const baseURL = '/api';
// Or if it's on a different domain:
// const baseURL = 'https://your-api-domain.com/api';

const apiClient = axios.create({
  // baseURL, // Uncomment and set this if you have a base URL
  headers: {
    'Content-Type': 'application/json',
    // You can add other default headers here, like Authorization tokens
  },
});

// Add a request interceptor to include the auth token if available
apiClient.interceptors.request.use(
  (config) => {
    // Example: Retrieve token from localStorage or an auth context
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Add a response interceptor for global error handling or data transformation
apiClient.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response;
  },
  (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    // For example, redirect to login on 401 errors
    // if (error.response && error.response.status === 401) {
    //   // Handle unauthorized access, e.g., redirect to login
    //   console.error('Unauthorized, redirecting to login.');
    //   // window.location.href = '/login';
    // }
    return Promise.reject(error);
  }
);

export { apiClient };
