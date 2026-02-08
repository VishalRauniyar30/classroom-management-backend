import { Request, Response } from "express"
import { and, desc, eq, getTableColumns, ilike, or, sql } from "drizzle-orm"

import { departments, subjects } from "../db/schema/index.js"
import { db } from "../db/index.js"

export const getAllDepartments = async (req: Request, res: Response) => {
    try {
        const { search, page = 1, limit = 10 } = req.query

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
                    ilike(departments.name, `%${search}%`),
                    ilike(departments.code, `%${search}%`)
                )
            )
        }

        //combine all filters using AND if any exist
        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined

        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(departments)
            .where(whereClause)

        const totalCount = countResult[0]?.count ?? 0

        const departmentsList = await db
            .select({
                ...getTableColumns(departments),
                totalSubjects: sql<number>`count(${subjects.id})`
            })
            .from(departments)
            .leftJoin(subjects, eq(departments.id, subjects.departmentId))
            .where(whereClause)
            .groupBy(departments.id)
            .orderBy(desc(departments.createdAt))
            .limit(limitPerPage)
            .offset(offset)

        res.status(200).json({
            data: departmentsList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage)
            }
        })
    } catch (error) {
        console.error("GET /departments error:", error)
        res.status(500).json({ error: "Failed to fetch departments" })
    }
}