import { Request, Response } from "express"
import { and, desc, eq, getTableColumns, ilike, or, sql } from "drizzle-orm"

import { db } from "../db/index.js"
import { classes, departments, enrollments, subjects, user } from "../db/schema/index.js"

export const getAllClasses = async (req: Request, res: Response) => {
    try {
        const { search, subject, teacher, page = 1, limit = 10 } = req.query

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
                    ilike(classes.name, `%${search}%`),
                    ilike(classes.inviteCode, `%${search}%`)
                )
            )
        }

        if (subject) {
            filterConditions.push(ilike(subjects.name, `%${subject}%`))
        }

        if (teacher) {
            filterConditions.push(ilike(user.name, `%${teacher}%`))
        }

        //combine all filters using AND if any exist
        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined

        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(classes)
            .leftJoin(subjects, eq(classes.subjectId, subjects.id))
            .leftJoin(user, eq(classes.teacherId, user.id))
            .where(whereClause)

        const totalCount = countResult[0]?.count ?? 0

        const classesList = await db
            .select({
                ...getTableColumns(classes),
                subject: {
                    ...getTableColumns(subjects)
                },
                teacher: {
                    ...getTableColumns(user)
                }
            })
            .from(classes)
            .leftJoin(subjects, eq(classes.subjectId, subjects.id))
            .leftJoin(user, eq(classes.teacherId, user.id))
            .where(whereClause)
            .orderBy(desc(classes.createdAt))
            .limit(limitPerPage)
            .offset(offset)

        res.status(200).json({
            data: classesList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage)
            }
        })
    } catch (error) {
        console.error("GET /classes error:", error)
        res.status(500).json({ error: "Failed to fetch classes" })
    }
}

export const createClass = async (req: Request, res: Response) => {
    try {
        const {
            name, teacherId, subjectId, capacity,
            description, status, bannerUrl, bannerCldPubId
        } = req.body

        const [createdClass] = await db
            .insert(classes)
            .values({
                subjectId,
                inviteCode: Math.random().toString(36).substring(2, 9),
                name,
                teacherId,
                bannerCldPubId,
                bannerUrl,
                capacity,
                description,
                schedules: [],
                status
            })
            .returning({ id: classes.id })

        if (!createdClass) throw Error

        res.status(201).json({ data: createdClass })
    } catch (error) {
        console.error("POST /classes error:", error)
        res.status(500).json({ error: "Failed to create class" })
    }
}

export const getClassDetails = async (req: Request, res: Response) => {
    try {
        const classId = Number(req.params.id)

        if (!Number.isFinite(classId)) {
            return res.status(400).json({ error: 'Invalid class id' })
        }

        const [classDetails] = await db
            .select({
                ...getTableColumns(classes),
                subject: {
                    ...getTableColumns(subjects)
                },
                department: {
                    ...getTableColumns(departments)
                },
                teacher: {
                    ...getTableColumns(user)
                }
            })
            .from(classes)
            .leftJoin(subjects, eq(classes.subjectId, subjects.id))
            .leftJoin(departments, eq(subjects.departmentId, departments.id))
            .leftJoin(user, eq(classes.teacherId, user.id))
            .where(eq(classes.id, classId))

        if (!classDetails) {
            return res.status(404).json({ error: 'Class not found' })
        }

        res.status(200).json({ data: classDetails })

    } catch (error) {
        console.error("GET /classes/:id error:", error)
        res.status(500).json({ error: "Failed to fetch class details" })
    }
}

export const getUsersOfClass = async (req: Request, res: Response) => {
    try {
        const classId = Number(req.params.id)
        const { role, page = 1, limit = 10 } = req.query

        if (!Number.isFinite(classId)) {
            return res.status(400).json({ error: "Invalid class id" })
        }

        if (role !== "teacher" && role !== "student") {
            return res.status(400).json({ error: "Invalid role" })
        }

        const currentPage = Math.max(1, +page)
        const limitPerPage = Math.max(1, +limit)
        const offset = (currentPage - 1) * limitPerPage

        const baseSelect = {
            id: user.id,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            image: user.image,
            role: user.role,
            imageCldPubId: user.imageCldPubId,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }

        const groupByFields = [
            user.id,
            user.name,
            user.email,
            user.emailVerified,
            user.image,
            user.role,
            user.imageCldPubId,
            user.createdAt,
            user.updatedAt,
        ]

        const countResult =
            role === "teacher"
                ? await db
                    .select({ count: sql<number>`count(distinct ${user.id})` })
                    .from(user)
                    .leftJoin(classes, eq(user.id, classes.teacherId))
                    .where(and(eq(user.role, role), eq(classes.id, classId)))
                : await db
                    .select({ count: sql<number>`count(distinct ${user.id})` })
                    .from(user)
                    .leftJoin(enrollments, eq(user.id, enrollments.studentId))
                    .where(and(eq(user.role, role), eq(enrollments.classId, classId)))

        const totalCount = countResult[0]?.count ?? 0

        const usersList =
            role === "teacher"
                ? await db
                    .select(baseSelect)
                    .from(user)
                    .leftJoin(classes, eq(user.id, classes.teacherId))
                    .where(and(eq(user.role, role), eq(classes.id, classId)))
                    .groupBy(...groupByFields)
                    .orderBy(desc(user.createdAt))
                    .limit(limitPerPage)
                    .offset(offset)
                : await db
                    .select(baseSelect)
                    .from(user)
                    .leftJoin(enrollments, eq(user.id, enrollments.studentId))
                    .where(and(eq(user.role, role), eq(enrollments.classId, classId)))
                    .groupBy(...groupByFields)
                    .orderBy(desc(user.createdAt))
                    .limit(limitPerPage)
                    .offset(offset)

        res.status(200).json({
            data: usersList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage),
            },
        })
    } catch (error) {
        console.error("GET /classes/:id/users error:", error)
        res.status(500).json({ error: "Failed to fetch class users" })
    }
}