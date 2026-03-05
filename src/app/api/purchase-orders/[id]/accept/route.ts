import { NextRequest } from "next/server";
import { withAuth, getCurrentUser } from "@/lib/rbac";
import { purchaseOrderService } from "@/services/purchaseOrder.service";
import { apiResponse, apiError } from "@/lib/helpers";

export const POST = withAuth(async (_req: NextRequest, context?) => {
    try {
        const { id } = await context!.params;
        const user = await getCurrentUser();
        const result = await purchaseOrderService.acceptOrder(id, user!.id);
        return apiResponse(result);
    } catch (error) {
        return apiError((error as Error).message);
    }
}, "ADMIN");
