import { Request, Response } from "express"
import { and, eq, getTableColumns } from "drizzle-orm"

import { db } from "../db/index.js"
import { classes, departments, enrollments, subjects, user } from "../db/schema/index.js"

const getEnrollmentDetails = async (enrollmentId: number) => {
    const [enrollment] = await db
        .select({
            ...getTableColumns(enrollments),
            class: {
                ...getTableColumns(classes)
            },
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
        .from(enrollments)
        .leftJoin(classes, eq(enrollments.classId, classes.id))
        .leftJoin(subjects, eq(classes.subjectId, subjects.id))
        .leftJoin(departments, eq(subjects.departmentId, departments.id))
        .leftJoin(user, eq(classes.teacherId, user.id))
        .where(eq(enrollments.id, enrollmentId))

    return enrollment
}

// Create enrollment
export const createEnrollment = async (req: Request, res: Response) => {
    try {
        const { classId, studentId } = req.body

        if (!classId || !studentId) {
            return res.status(400).json({ error: 'classid and studentId are required' })
        }

        const [classRecord] = await db
            .select()
            .from(classes)
            .where(eq(classes.id, classId))

        if (!classRecord) {
            return res.status(404).json({ error: 'Class not found' })
        }

        const [studentRecord] = await db
            .select()
            .from(user)
            .where(eq(user.id, studentId))

        if (!studentRecord) {
            return res.status(404).json({ error: 'student not found' })
        }

        const [existingEnrollment] = await db
            .select({ id: enrollments.id })
            .from(enrollments)
            .where(
                and(
                    eq(enrollments.classId, classId),
                    eq(enrollments.studentId, studentId)
                )
            )

        if (existingEnrollment) {
            return res.status(409).json({ error: 'student already enrolled in class' })
        }

        const [createdEnrollment] = await db
            .insert(enrollments)
            .values({ classId, studentId })
            .returning({ id: enrollments.id })

        if (!createdEnrollment) {
            return res.status(500).json({ error: 'Failed to create enrollment' })
        }

        const enrollment = await getEnrollmentDetails(createdEnrollment.id)

        res.status(201).json({ data: enrollment })

    } catch (error) {
        console.error("POST /enrollments error:", error)
        res.status(500).json({ error: "Failed to create enrollment" })
    }
}

// Join class by invite code
export const createEnrollmentByInviteCode = async (req: Request, res: Response) => {
    try {
        const { inviteCode, studentId } = req.body

        if (!inviteCode || !studentId) {
            return res.status(400).json({ error: 'invitecode and studentId are required' })
        }

        const [classRecord] = await db
            .select()
            .from(classes)
            .where(eq(classes.inviteCode, inviteCode))

        if (!classRecord) {
            return res.status(404).json({ error: 'Class not found' })
        }

        const [studentRecord] = await db
            .select()
            .from(user)
            .where(eq(user.id, studentId))

        if (!studentRecord) {
            return res.status(404).json({ error: 'student not found' })
        }

        const [existingEnrollment] = await db
            .select({ id: enrollments.id })
            .from(enrollments)
            .where(
                and(
                    eq(enrollments.classId, classRecord.id),
                    eq(enrollments.studentId, studentId)
                )
            )

        if (existingEnrollment) {
            return res.status(409).json({ error: 'student already enrolled in class' })
        }

        const [createdEnrollment] = await db
            .insert(enrollments)
            .values({ classId: classRecord.id, studentId })
            .returning({ id: enrollments.id })

        if (!createdEnrollment) {
            return res.status(500).json({ error: 'Failed to create enrollment' })
        }

        const enrollment = await getEnrollmentDetails(createdEnrollment.id)

        res.status(201).json({ data: enrollment })
    } catch (error) {
        console.error("POST /enrollments/join error:", error)
        res.status(500).json({ error: "Failed to join class" })
    }
}