import { createServerFn } from '@tanstack/react-start'
import { eq, desc, and, sql } from 'drizzle-orm'
import { db, creatorsTable, lessonsTable, storyboardsTable, auditEventsTable, creditLedgerTable, renderJobsTable } from '@workspace/db'
import { z } from 'zod/v4'

// --- Auth ---

export const signupCreator = createServerFn({ method: 'POST' })
  .validator(z.object({ email: z.string().email(), name: z.string().optional() }))
  .handler(async ({ data }) => {
    const { email, name } = data
    const [existing] = await db.select().from(creatorsTable).where(sql`${creatorsTable.email} = ${email}`)
    if (existing) return { id: existing.id, email: existing.email, name: existing.name, createdAt: existing.createdAt }
    const [creator] = await db.insert(creatorsTable).values({ clerkId: `dev_${email.replace(/[^a-zA-Z0-9]/g, '_')}`, email, name: name ?? email.split('@')[0] }).returning()
    return { id: creator.id, email: creator.email, name: creator.name, createdAt: creator.createdAt }
  })

// --- Lessons ---

export const listLessons = createServerFn({ method: 'GET' })
  .validator(z.number())
  .handler(async ({ data: creatorId }) => {
    return db.select().from(lessonsTable).where(and(eq(lessonsTable.creatorId, creatorId), eq(lessonsTable.isDeleted, false))).orderBy(desc(lessonsTable.updatedAt))
  })

export const getLesson = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.number(), creatorId: z.number() }))
  .handler(async ({ data }) => {
    const [lesson] = await db.select().from(lessonsTable).where(and(eq(lessonsTable.id, data.id), eq(lessonsTable.creatorId, data.creatorId), eq(lessonsTable.isDeleted, false)))
    return lesson ?? null
  })

export const createLesson = createServerFn({ method: 'POST' })
  .validator(z.object({ creatorId: z.number(), title: z.string(), grade: z.string(), language: z.string() }))
  .handler(async ({ data }) => {
    const [lesson] = await db.insert(lessonsTable).values({ creatorId: data.creatorId, title: data.title, grade: data.grade, language: data.language, status: 'in_progress' }).returning()
    return lesson
  })

export const deleteLesson = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.number(), creatorId: z.number() }))
  .handler(async ({ data }) => {
    const [lesson] = await db.update(lessonsTable).set({ isDeleted: true, updatedAt: new Date() }).where(and(eq(lessonsTable.id, data.id), eq(lessonsTable.creatorId, data.creatorId))).returning()
    if (lesson) await db.insert(auditEventsTable).values({ creatorId: data.creatorId, action: 'delete', entityType: 'lesson', entityId: lesson.id, metadata: { title: lesson.title } })
    return lesson ?? null
  })

// --- Storyboards ---

export const generateStoryboard = createServerFn({ method: 'POST' })
  .validator(z.object({ creatorId: z.number(), lessonId: z.number(), brief: z.string() }))
  .handler(async ({ data }) => {
    // Inline mock planner
    await new Promise(r => setTimeout(r, 500))
    const storyboard = {
      title: `Lesson: ${data.brief.slice(0, 60)}`,
      grade: 'Grade 10', language: 'English',
      scenes: [
        { id: 1, order: 1, title: 'Introduction', narration: 'Welcome to this lesson.', durationSec: 30, elements: [{ type: 'text', content: data.brief.slice(0, 100), x: 100, y: 200, drawOrder: 0 }] },
        { id: 2, order: 2, title: 'Main Content', narration: 'Let us explore the key concepts.', durationSec: 60, elements: [{ type: 'text', content: 'Key concept explanation', x: 100, y: 100, drawOrder: 0 }, { type: 'math', content: 'E = mc^2', x: 100, y: 300, drawOrder: 1 }] },
        { id: 3, order: 3, title: 'Summary', narration: 'To summarise what we have learned.', durationSec: 30, elements: [{ type: 'text', content: 'Summary of key points', x: 200, y: 200, drawOrder: 0 }] },
      ],
    }
    const [board] = await db.insert(storyboardsTable).values({ lessonId: data.lessonId, briefText: data.brief, status: 'validated', scenes: JSON.parse(result.rawOutput), safetyFlags: [] }).returning()
    return { id: board.id, lessonId: board.lessonId, revision: board.revision, status: board.status, scenes: result.storyboard.scenes, safetyFlags: [], createdAt: board.createdAt }
  })

export const getStoryboard = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.number(), creatorId: z.number() }))
  .handler(async ({ data }) => {
    const [board] = await db.select().from(storyboardsTable).where(eq(storyboardsTable.id, data.id))
    if (!board) return null
    const [lesson] = await db.select().from(lessonsTable).where(and(eq(lessonsTable.id, board.lessonId), eq(lessonsTable.creatorId, data.creatorId)))
    if (!lesson) return null
    return board
  })

export const listStoryboards = createServerFn({ method: 'GET' })
  .validator(z.object({ lessonId: z.number(), creatorId: z.number() }))
  .handler(async ({ data }) => {
    const [lesson] = await db.select().from(lessonsTable).where(and(eq(lessonsTable.id, data.lessonId), eq(lessonsTable.creatorId, data.creatorId)))
    if (!lesson) return []
    return db.select().from(storyboardsTable).where(eq(storyboardsTable.lessonId, data.lessonId)).orderBy(desc(storyboardsTable.createdAt))
  })

// --- Credits ---

export const getCreditBalance = createServerFn({ method: 'GET' })
  .validator(z.number())
  .handler(async ({ data: creatorId }) => {
    const [row] = await db.select({ balance: sql<string>`COALESCE((SELECT balance_after FROM ${creditLedgerTable} WHERE creator_id = ${creatorId} ORDER BY id DESC LIMIT 1), '0')` }).from(creditLedgerTable).where(eq(creditLedgerTable.creatorId, creatorId)).limit(1)
    return { available: Number(row?.balance ?? 0), held: 0, totalGrants: 0 }
  })

export const purchaseCredits = createServerFn({ method: 'POST' })
  .validator(z.object({ creatorId: z.number(), amount: z.number().positive() }))
  .handler(async ({ data }) => {
    const [lastEntry] = await db.select({ balanceAfter: creditLedgerTable.balanceAfter }).from(creditLedgerTable).where(eq(creditLedgerTable.creatorId, data.creatorId)).orderBy(sql`${creditLedgerTable.id} DESC`).limit(1)
    const currentBalance = lastEntry ? Number(lastEntry.balanceAfter) : 0
    const balanceAfter = currentBalance + data.amount
    await db.insert(creditLedgerTable).values({ creatorId: data.creatorId, entryType: 'grant', amount: String(data.amount), balanceAfter: String(balanceAfter), description: 'Credit purchase', metadata: { mock: true } })
    return { success: true, creditsAdded: data.amount, newBalance: balanceAfter }
  })

// --- Render ---

export const triggerExport = createServerFn({ method: 'POST' })
  .validator(z.object({ creatorId: z.number(), storyboardId: z.number() }))
  .handler(async ({ data }) => {
    const [job] = await db.insert(renderJobsTable).values({ storyboardId: data.storyboardId, jobType: 'full_export', status: 'queued', progress: '0', estimatedCost: '50' }).returning()
    // In production, dispatch to a background worker. For now, process inline.
    setTimeout(async () => {
      await db.update(renderJobsTable).set({ status: 'completed', progress: '100', outputUrl: '/api/renderer/output/' + job.id, updatedAt: new Date() }).where(eq(renderJobsTable.id, job.id))
    }, 100)
    return { jobId: job.id, status: 'queued' }
  })

export const getRenderJob = createServerFn({ method: 'GET' })
  .validator(z.number())
  .handler(async ({ data: jobId }) => {
    const [job] = await db.select().from(renderJobsTable).where(eq(renderJobsTable.id, jobId))
    return job ?? null
  })
