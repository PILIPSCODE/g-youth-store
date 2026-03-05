import { prisma } from "@/lib/prisma";

export const activityLogRepository = {
    async findAll(params?: {
        userId?: string;
        action?: string;
        startDate?: Date;
        endDate?: Date;
        page?: number;
        limit?: number;
    }) {
        const { userId, action, startDate, endDate, page = 1, limit = 50 } = params || {};

        const where: {
            userId?: string;
            action?: string;
            createdAt?: { gte?: Date; lte?: Date };
        } = {};

        if (userId) where.userId = userId;
        if (action) where.action = action;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = startDate;
            if (endDate) where.createdAt.lte = endDate;
        }

        const [logs, total] = await Promise.all([
            prisma.activityLog.findMany({
                where,
                include: { user: { select: { id: true, name: true, role: true } } },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.activityLog.count({ where }),
        ]);

        return {
            logs,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    },

    async create(userId: string, action: string, metadata?: Record<string, unknown>) {
        return prisma.activityLog.create({
            data: { userId, action, metadata: (metadata ?? undefined) as unknown as undefined },
        });
    },
};
