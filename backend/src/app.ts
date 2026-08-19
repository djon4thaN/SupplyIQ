import cors from 'cors'
import express from 'express'
import { corsOptions } from './config/cors.ts'
import { errorHandler } from './middleware/error-handler.ts'
import { notFoundHandler } from './middleware/not-found.ts'
import { healthRouter } from './routes/health.routes.ts'

export const app = express()

app.use(cors(corsOptions))
app.use(express.json())

app.use('/api', healthRouter)

app.use(notFoundHandler)
app.use(errorHandler)
