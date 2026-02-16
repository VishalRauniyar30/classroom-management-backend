import AgentAPI from 'apminsight'
AgentAPI.config()

import cors from 'cors'
import express from 'express'
import { toNodeHandler } from 'better-auth/node'

import classesRouter from './routes/classes.routes.js'
import departmentsRouter from './routes/departments.routes.js'
import enrollmentsRouter from './routes/enrollments.routes.js'
import statsRouter from './routes/stats.routes.js'
import subjectsRouter from './routes/subjects.routes.js'
import usersRouter from './routes/users.routes.js'
// import securityMiddleware from './middleware/security.js'
import { auth } from './lib/auth.js'

const app = express()

const PORT = 8000

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set in .env file")
}

app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', "DELETE"],
    credentials: true
}))

app.all('/api/auth/*splat', toNodeHandler(auth))

app.use(express.json())

// app.use(securityMiddleware)

app.use('/api/subjects', subjectsRouter)
app.use('/api/users', usersRouter)
app.use('/api/classes', classesRouter)
app.use('/api/departments', departmentsRouter)
app.use('/api/stats', statsRouter)
app.use('/api/enrollments', enrollmentsRouter)

app.get("/", (req, res) => {
    res.send("Backend server is running!")
})

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`)
})