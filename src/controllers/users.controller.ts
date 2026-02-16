import { Request, Response } from "express"
import { or, ilike, and, sql, eq, desc, getTableColumns } from "drizzle-orm"

import { db } from "../db/index.js"
import { classes, departments, enrollments, subjects, user } from "../db/schema/index.js"

// Get all subjects with optional search, department filter, and pagination
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const { search, role, page = 1, limit = 10 } = req.query

        //both should be at least 1
        const currentPage = Math.max(1, parseInt(String(page), 10) || 1)
        const limitPerPage = Math.min(Math.max(1, parseInt(String(limit), 10) || 10), 100) //max 100 records per page

        // how many records to skip to get to the next page
        const offset = (currentPage - 1) * limitPerPage

        const filterConditions = []

        // if search query exists, filter by subject name OR subject code
        if (search) {
            filterConditions.push(
                or(
                    ilike(user.name, `%${search}%`),
                    ilike(user.email, `%${search}%`)
                )
            )
        }

        // if department filter exists, match department name
        if (role) {
            filterConditions.push(eq(user.role, role as UserRoles))
        }

        //combine all filters using AND if any exist
        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined

        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(user)
            .where(whereClause)

        const totalCount = countResult[0]?.count ?? 0

        const usersList = await db
            .select()
            .from(user)
            .where(whereClause)
            .orderBy(desc(user.createdAt))
            .limit(limitPerPage)
            .offset(offset)

        res.status(200).json({
            data: usersList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage)
            }
        })
    } catch (error) {
        console.error("GET /users error:", error)
        res.status(500).json({ error: "Failed to fetch subjects" })
    }
}

// Get user details with role-specific data
export const getUserDetails = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id

        if (typeof userId !== "string") {
            return res.status(400).json({ error: "Invalid user id" })
        }
        const [userRecord] = await db
            .select()
            .from(user)
            .where(eq(user.id, userId))

        if (!userRecord) {
            return res.status(404).json({ error: "User not found" })
        }

        res.status(200).json({ data: userRecord })
    } catch (error) {
        console.error("GET /users/:id error:", error)
        res.status(500).json({ error: "Failed to fetch user" })
    }
}

// List departments associated with a user
export const getDepartmentOfUser = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id

        if (typeof userId !== "string") {
            return res.status(400).json({ error: "Invalid user id" })
        }
        const { page = 1, limit = 10 } = req.query

        const [userRecord] = await db
            .select({ id: user.id, role: user.role })
            .from(user)
            .where(eq(user.id, userId))

        if (!userRecord) {
            return res.status(404).json({ error: "User not found" })
        }

        if (userRecord.role !== 'teacher' && userRecord.role !== 'student') {
            return res.status(200).json({
                data: [],
                pagination: {
                    page: 1,
                    limit: 0,
                    total: 0,
                    totalPages: 0,
                },
            })
        }

        //both should be at least 1
        const currentPage = Math.max(1, parseInt(String(page), 10) || 1)
        const limitPerPage = Math.min(Math.max(1, parseInt(String(limit), 10) || 10), 100) //max 100 records per page

        // how many records to skip to get to the next page
        const offset = (currentPage - 1) * limitPerPage

        const countResult = userRecord.role === 'teacher'
            ? await db
                .select({ count: sql<number>`count(distinct ${departments.id})` })
                .from(departments)
                .leftJoin(subjects, eq(subjects.departmentId, departments.id))
                .leftJoin(classes, eq(classes.subjectId, subjects.id))
                .where(eq(classes.teacherId, userId))
            : await db
                .select({ count: sql<number>`count(distinct ${departments.id})` })
                .from(departments)
                .leftJoin(subjects, eq(subjects.departmentId, departments.id))
                .leftJoin(classes, eq(classes.subjectId, subjects.id))
                .leftJoin(enrollments, eq(enrollments.classId, classes.id))
                .where(eq(enrollments.studentId, userId))


        const totalCount = countResult[0]?.count ?? 0

        const departmentsList = userRecord.role === 'teacher'
            ? await db
                .select({
                    ...getTableColumns(departments)
                })
                .from(departments)
                .leftJoin(subjects, eq(subjects.departmentId, departments.id))
                .leftJoin(classes, eq(classes.subjectId, subjects.id))
                .where(eq(classes.teacherId, userId))
                .groupBy(
                    departments.id,
                    departments.code,
                    departments.name,
                    departments.description,
                    departments.createdAt,
                    departments.updatedAt
                )
                .orderBy(desc(departments.createdAt))
                .limit(limitPerPage)
                .offset(offset)
            : await db
                .select({
                    ...getTableColumns(departments)
                })
                .from(departments)
                .leftJoin(subjects, eq(subjects.departmentId, departments.id))
                .leftJoin(classes, eq(classes.subjectId, subjects.id))
                .leftJoin(enrollments, eq(enrollments.classId, classes.id))
                .where(eq(enrollments.studentId, userId))
                .groupBy(
                    departments.id,
                    departments.code,
                    departments.name,
                    departments.description,
                    departments.createdAt,
                    departments.updatedAt
                )
                .orderBy(desc(departments.createdAt))
                .limit(limitPerPage)
                .offset(offset)

        res.status(200).json({
            data: departmentsList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage),
            },
        })
    } catch (error) {
        console.error("GET /users/:id/departments error:", error)
        res.status(500).json({ error: "Failed to fetch user subjects" })
    }
}

// List subjects associated with a user
export const getSubjectOfUser = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id

        if (typeof userId !== "string") {
            return res.status(400).json({ error: "Invalid user id" })
        }
        const { page = 1, limit = 10 } = req.query

        const [userRecord] = await db
            .select({ id: user.id, role: user.role })
            .from(user)
            .where(eq(user.id, userId))

        if (!userRecord) {
            return res.status(404).json({ error: "User not found" })
        }

        if (userRecord.role !== 'teacher' && userRecord.role !== 'student') {
            return res.status(200).json({
                data: [],
                pagination: {
                    page: 1,
                    limit: 0,
                    total: 0,
                    totalPages: 0,
                },
            })
        }

        //both should be at least 1
        const currentPage = Math.max(1, parseInt(String(page), 10) || 1)
        const limitPerPage = Math.min(Math.max(1, parseInt(String(limit), 10) || 10), 100) //max 100 records per page

        // how many records to skip to get to the next page
        const offset = (currentPage - 1) * limitPerPage

        const countResult = userRecord.role === 'teacher'
            ? await db
                .select({ count: sql<number>`count(distinct ${subjects.id})` })
                .from(subjects)
                .leftJoin(classes, eq(classes.subjectId, subjects.id))
                .where(eq(classes.teacherId, userId))
            : await db
                .select({ count: sql<number>`count(distinct ${subjects.id})` })
                .from(subjects)
                .leftJoin(classes, eq(classes.subjectId, subjects.id))
                .leftJoin(enrollments, eq(enrollments.classId, classes.id))
                .where(eq(enrollments.studentId, userId))


        const totalCount = countResult[0]?.count ?? 0

        const subjectsList = userRecord.role === "teacher"
            ? await db
                .select({
                    ...getTableColumns(subjects),
                    department: {
                        ...getTableColumns(departments),
                    },
                })
                .from(subjects)
                .leftJoin(departments, eq(subjects.departmentId, departments.id))
                .leftJoin(classes, eq(classes.subjectId, subjects.id))
                .where(eq(classes.teacherId, userId))
                .groupBy(
                    subjects.id,
                    subjects.departmentId,
                    subjects.name,
                    subjects.code,
                    subjects.description,
                    subjects.createdAt,
                    subjects.updatedAt,
                    departments.id,
                    departments.code,
                    departments.name,
                    departments.description,
                    departments.createdAt,
                    departments.updatedAt
                )
                .orderBy(desc(subjects.createdAt))
                .limit(limitPerPage)
                .offset(offset)
            : await db
                .select({
                    ...getTableColumns(subjects),
                    department: {
                        ...getTableColumns(departments),
                    },
                })
                .from(subjects)
                .leftJoin(departments, eq(subjects.departmentId, departments.id))
                .leftJoin(classes, eq(classes.subjectId, subjects.id))
                .leftJoin(enrollments, eq(enrollments.classId, classes.id))
                .where(eq(enrollments.studentId, userId))
                .groupBy(
                    subjects.id,
                    subjects.departmentId,
                    subjects.name,
                    subjects.code,
                    subjects.description,
                    subjects.createdAt,
                    subjects.updatedAt,
                    departments.id,
                    departments.code,
                    departments.name,
                    departments.description,
                    departments.createdAt,
                    departments.updatedAt
                )
                .orderBy(desc(subjects.createdAt))
                .limit(limitPerPage)
                .offset(offset);

        res.status(200).json({
            data: subjectsList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage),
            },
        })
    } catch (error) {
        console.error("GET /users/:id/subjects error:", error)
        res.status(500).json({ error: "Failed to fetch user subjects" })
    }
}