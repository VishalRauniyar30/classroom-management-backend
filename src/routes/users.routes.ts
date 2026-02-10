import { Router } from "express"

import { getAllUsers } from "../controllers/users.controller.js"

const usersRouter = Router()

usersRouter.get('/', getAllUsers)

export default usersRouter