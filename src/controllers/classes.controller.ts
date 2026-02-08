import { Request, Response } from "express"
import { and, desc, eq, getTableColumns, ilike, or, sql } from "drizzle-orm"

import { db } from "../db/index.js"
import { classes, subjects, user } from "../db/schema/index.js"

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
            filterConditions.push(ilike(subjects.name, `%${subject}%`));
        }

        if (teacher) {
            filterConditions.push(ilike(user.name, `%${teacher}%`));
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
