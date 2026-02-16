import { Router } from "express"

import {
    getAllUsers, getDepartmentOfUser,
    getSubjectOfUser, getUserDetails
} from "../controllers/users.controller.js"

const usersRouter = Router()

usersRouter.get('/', getAllUsers)

usersRouter.get('/:id', getUserDetails)

usersRouter.get('/:id/departments', getDepartmentOfUser)

usersRouter.get('/:id/subjects', getSubjectOfUser)

export default usersRouter