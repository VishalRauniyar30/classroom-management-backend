import { Router } from "express"

import { getAllDepartments } from "../controllers/departments.controller.js"

const departmentsRouter = Router()

departmentsRouter.get('/', getAllDepartments)

export default departmentsRouter