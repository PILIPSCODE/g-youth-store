import { NextRequest } from "next/server";
import { withAuth } from "@/lib/rbac";
import { reportService } from "@/services/report.service";
import { apiResponse, apiError } from "@/lib/helpers";

export const GET = withAuth(async (req: NextRequest) => {
    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") ?? "10");
        const startDate = searchParams.get("startDate")
            ? new Date(searchParams.get("startDate")!)
            : undefined;
        const endDate = searchParams.get("endDate")
            ? new Date(searchParams.get("endDate")!)
            : undefined;
        const report = await reportService.getTopProducts(limit, startDate, endDate);
        return apiResponse(report);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}, "ADMIN");
