import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://lated-regardlessly-harland.ngrok-free.dev/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  }
})

// Add auth token to all requests
apiClient.interceptors.request.use(
  (config) => {
    // Read token from auth store's persisted storage
    const authStorage = localStorage.getItem('ryvex-auth')
    if (authStorage) {
      try {
        const authData = JSON.parse(authStorage)
        const token = authData.state?.token
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      } catch (e) {
        console.error('Failed to parse auth storage:', e)
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - but don't redirect if it's a logout call
      const isLogoutCall = error.config?.url?.includes('/logout')
      if (!isLogoutCall) {
        localStorage.removeItem('ryvex-auth')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
