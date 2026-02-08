import { Router } from "express"

import { getAllClasses } from "../controllers/classes.controller.js"

const classesRouter = Router()

classesRouter.get('/', getAllClasses)

export default classesRouter