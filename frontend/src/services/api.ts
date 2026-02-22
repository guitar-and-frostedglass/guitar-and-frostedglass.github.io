import axios, { AxiosError } from 'axios'
import type { ApiResponse } from '../../../shared/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response?.status === 401 && sessionStorage.getItem('token')) {
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
      window.location.href = '/login'
    }
    const serverMessage = error.response?.data?.error
    if (serverMessage) {
      return Promise.reject(new Error(serverMessage))
    }
    return Promise.reject(error)
  }
)

export default api
