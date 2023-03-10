import express from 'express'
import morgan from 'morgan'
import path from 'path'
import { config } from './config'

import AuthRouter from './routes/Auth.router'

// Initializations
const app = express()

// Settings
app.set('port', config.express.port)

// Middelwares
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(morgan('dev'))

// routes
app.use('/api/v1/user', AuthRouter)

// Static routes
app.use('/static', express.static(path.join(__dirname, 'public')))

// export app
export default app