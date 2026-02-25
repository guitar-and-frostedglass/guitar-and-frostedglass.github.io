import { createNoteService } from '../../../shared/services/noteService'
import api from './api'

export const noteService = createNoteService(api)
