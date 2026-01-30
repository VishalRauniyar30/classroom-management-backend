import cors from 'cors'
import express from 'express'

import classesRouter from './routes/classes.routes'
import departmentsRouter from './routes/departments.routes'
import enrollmentsRouter from './routes/enrollments.routes'
import statsRouter from './routes/stats.routes'
import subjectsRouter from './routes/subjects.routes'
import usersRouter from './routes/users.routes'

const app = express()

const PORT = 8000

app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', "DELETE"],
    credentials: true
}))

app.use(express.json())

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