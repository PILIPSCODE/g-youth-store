import { NextRequest } from "next/server";
import { withAuth } from "@/lib/rbac";
import { reportService } from "@/services/report.service";
import { apiResponse, apiError } from "@/lib/helpers";

export const GET = withAuth(async (req: NextRequest) => {
    try {
        const { searchParams } = new URL(req.url);
        const daysParam = searchParams.get("days");
        const days = daysParam ? parseInt(daysParam, 10) : 7;

        const chartData = await reportService.getRevenueChart(days);
        return apiResponse(chartData);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}, "ADMIN");
