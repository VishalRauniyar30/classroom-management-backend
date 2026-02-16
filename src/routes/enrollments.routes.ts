import { Router } from "express"

import {
    createEnrollment, createEnrollmentByInviteCode
} from "../controllers/enrollments.controller.js"

const enrollmentsRouter = Router()

enrollmentsRouter.post('/', createEnrollment)

enrollmentsRouter.post('/join', createEnrollmentByInviteCode)

export default enrollmentsRouter