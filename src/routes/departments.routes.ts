import { Router } from "express"

import { getAllDepartments } from "../controllers/departments.controller"

const departmentsRouter = Router()

departmentsRouter.get('/', getAllDepartments)

export default departmentsRouter