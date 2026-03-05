import { NextRequest } from "next/server";
import { withAuth, getCurrentUser } from "@/lib/rbac";
import { transactionService } from "@/services/transaction.service";
import { apiResponse, apiError } from "@/lib/helpers";
import { z } from "zod";

const createTransactionSchema = z.object({
    customerId: z.string().uuid().optional(),
    discount: z.number().int().min(0).optional(),
    tax: z.number().int().min(0).optional(),
    items: z
        .array(
            z.object({
                productId: z.string().uuid("Product ID tidak valid"),
                quantity: z.number().int().min(1, "Quantity minimal 1"),
            })
        )
        .min(1, "Minimal 1 item"),
    payments: z
        .array(
            z.object({
                method: z.enum(["CASH", "QRIS", "BANK_TRANSFER", "E_WALLET"]),
                amount: z.number().int().min(1, "Jumlah pembayaran harus lebih dari 0"),
                referenceNumber: z.string().optional(),
            })
        )
        .min(1, "Minimal 1 metode pembayaran"),
});

export const GET = withAuth(async (req: NextRequest) => {
    try {
        const { searchParams } = new URL(req.url);
        const user = await getCurrentUser();
        const page = parseInt(searchParams.get("page") ?? "1");
        const limit = parseInt(searchParams.get("limit") ?? "20");
        const status = searchParams.get("status") as "PENDING" | "PAID" | "CANCELLED" | undefined;

        // Cashiers can only see their own transactions
        const cashierId = user!.role === "CASHIER" ? user!.id : searchParams.get("cashierId") ?? undefined;

        const startDate = searchParams.get("startDate")
            ? new Date(searchParams.get("startDate")!)
            : undefined;
        const endDate = searchParams.get("endDate")
            ? new Date(searchParams.get("endDate")!)
            : undefined;

        const result = await transactionService.getAllTransactions({
            cashierId,
            status: status ?? undefined,
            startDate,
            endDate,
            page,
            limit,
        });
        return apiResponse(result);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}, "ADMIN", "CASHIER");

export const POST = withAuth(async (req: NextRequest) => {
    try {
        const user = await getCurrentUser();
        const body = await req.json();
        const parsed = createTransactionSchema.safeParse(body);
        if (!parsed.success) {
            return apiError(parsed.error.issues[0].message);
        }

        const transaction = await transactionService.createTransaction({
            cashierId: user!.id,
            ...parsed.data,
        });
        return apiResponse(transaction, 201);
    } catch (error) {
        return apiError((error as Error).message);
    }
}, "ADMIN", "CASHIER");
