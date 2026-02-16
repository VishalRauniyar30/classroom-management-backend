import { Router } from "express"

import {
    createSubject, getAllSubjects,
    getClassesInSubject, getSubjectDetails,
    getUsersOfSubjects
} from "../controllers/subjects.controller.js"

const subjectsRouter = Router()

subjectsRouter.get("/", getAllSubjects)

subjectsRouter.post('/', createSubject)

subjectsRouter.get("/:id", getSubjectDetails)

subjectsRouter.get("/:id/classes", getClassesInSubject)

subjectsRouter.get("/:id/users", getUsersOfSubjects)

export default subjectsRouter