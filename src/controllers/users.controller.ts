import { Request, Response } from "express"
import { or, ilike, and, sql, eq, desc } from "drizzle-orm"

import { db } from "../db/index.js"
import { user } from "../db/schema/auth.js"

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