import { Router } from "express"
import { getAllSubjects } from "../controllers/subjects.controller.js"

const subjectsRouter = Router()

subjectsRouter.get("/", getAllSubjects)

export default subjectsRouter