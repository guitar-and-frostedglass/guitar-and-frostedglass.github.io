import { createAdminService } from '../../../shared/services/adminService'
import api from './api'

export const adminService = createAdminService(api)
