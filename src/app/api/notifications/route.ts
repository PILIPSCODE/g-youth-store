import { NextRequest } from "next/server";
import { withAuth } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError } from "@/lib/helpers";

export const GET = withAuth(async (req: NextRequest) => {
    try {
        const { searchParams } = new URL(req.url);
        const unreadOnly = searchParams.get("unread") === "true";

        const notifications = await prisma.notification.findMany({
            where: unreadOnly ? { isRead: false } : {},
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        return apiResponse(notifications);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}, "ADMIN");

export const PUT = withAuth(async (req: NextRequest) => {
    try {
        const body = await req.json();
        const { ids } = body as { ids?: string[] };

        if (ids && ids.length > 0) {
            await prisma.notification.updateMany({
                where: { id: { in: ids } },
                data: { isRead: true },
            });
        } else {
            await prisma.notification.updateMany({
                where: { isRead: false },
                data: { isRead: true },
            });
        }

        return apiResponse({ message: "Notifikasi ditandai sudah dibaca" });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}, "ADMIN");
