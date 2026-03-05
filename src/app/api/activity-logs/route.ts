import { NextRequest } from "next/server";
import { withAuth } from "@/lib/rbac";
import { activityLogRepository } from "@/repositories/activityLog.repository";
import { apiResponse, apiError } from "@/lib/helpers";

export const GET = withAuth(async (req: NextRequest) => {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId") ?? undefined;
        const action = searchParams.get("action") ?? undefined;
        const page = parseInt(searchParams.get("page") ?? "1");
        const limit = parseInt(searchParams.get("limit") ?? "50");

        const startDate = searchParams.get("startDate")
            ? new Date(searchParams.get("startDate")!)
            : undefined;
        const endDate = searchParams.get("endDate")
            ? new Date(searchParams.get("endDate")!)
            : undefined;

        const result = await activityLogRepository.findAll({
            userId,
            action,
            startDate,
            endDate,
            page,
            limit,
        });
        return apiResponse(result);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}, "ADMIN");
