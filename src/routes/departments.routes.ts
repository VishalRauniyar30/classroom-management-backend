import { Router } from "express"

import {
    createDepartment, getAllDepartments,
    getClassesInDepartment, getDepartmentDetails,
    getSubjectsInDepartment, getUsersInDepartment
} from "../controllers/departments.controller.js"

const departmentsRouter = Router()

departmentsRouter.get('/', getAllDepartments)

departmentsRouter.post("/", createDepartment)

departmentsRouter.get('/:id', getDepartmentDetails)

departmentsRouter.get('/:id/subjects', getSubjectsInDepartment)

departmentsRouter.get('/:id/classes', getClassesInDepartment)

departmentsRouter.get('/:id/users', getUsersInDepartment)

export default departmentsRouter