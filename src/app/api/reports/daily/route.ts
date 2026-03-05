import { NextRequest } from "next/server";
import { withAuth } from "@/lib/rbac";
import { reportService } from "@/services/report.service";
import { apiResponse, apiError } from "@/lib/helpers";

export const GET = withAuth(async (req: NextRequest) => {
    try {
        const { searchParams } = new URL(req.url);
        const date = searchParams.get("date") ?? undefined;
        const report = await reportService.getDailyReport(date);
        return apiResponse(report);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}, "ADMIN");
