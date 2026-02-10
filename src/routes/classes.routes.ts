import { Router } from "express"

import { createClass, getAllClasses, getClassDetails, getUsersOfClass } from "../controllers/classes.controller.js"

const classesRouter = Router()

classesRouter.get('/', getAllClasses)

classesRouter.post('/', createClass)

classesRouter.get("/:id", getClassDetails)

classesRouter.get('/:id/users', getUsersOfClass)

export default classesRouter