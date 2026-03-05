import { NextRequest } from "next/server";
import { withAuth } from "@/lib/rbac";
import { reportService } from "@/services/report.service";
import { apiResponse, apiError } from "@/lib/helpers";

export const GET = withAuth(async (req: NextRequest) => {
    try {
        const { searchParams } = new URL(req.url);
        const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;
        const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : undefined;
        const report = await reportService.getMonthlyReport(year, month);
        return apiResponse(report);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}, "ADMIN");
