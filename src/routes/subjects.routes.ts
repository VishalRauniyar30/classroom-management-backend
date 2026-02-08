import { Router } from "express"
import { getAllSubjects } from "../controllers/subjects.controller"

const subjectsRouter = Router()

subjectsRouter.get("/", getAllSubjects)

export default subjectsRouter