import axios from 'axios'
import { setupApiInterceptors } from '../../../shared/services/api'
import { webTokenStorage, webNavigation } from '../platform'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

setupApiInterceptors(api, webTokenStorage, webNavigation)

export default api
