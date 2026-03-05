import { NextRequest } from "next/server";
import { withAuth, getCurrentUser } from "@/lib/rbac";
import { transactionService } from "@/services/transaction.service";
import { apiResponse, apiError } from "@/lib/helpers";

export const GET = withAuth(
    async (_req: NextRequest, context?) => {
        try {
            const { id } = await context!.params;
            const transaction = await transactionService.getTransactionById(id);
            return apiResponse(transaction);
        } catch (error) {
            return apiError((error as Error).message, 404);
        }
    },
    "ADMIN",
    "CASHIER"
);

export const DELETE = withAuth(async (_req: NextRequest, context?) => {
    try {
        const { id } = await context!.params;
        const user = await getCurrentUser();
        const result = await transactionService.cancelTransaction(id, user!.id);
        return apiResponse(result);
    } catch (error) {
        return apiError((error as Error).message);
    }
}, "ADMIN");
