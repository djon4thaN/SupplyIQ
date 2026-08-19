import { Router } from 'express'
import { postChat } from '../controllers/chat.controller.ts'

export const chatRouter = Router()

chatRouter.post('/chat', postChat)
