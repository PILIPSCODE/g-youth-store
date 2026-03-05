import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { purchaseOrderService } from "@/services/purchaseOrder.service";
import { apiResponse, apiError, rateLimit } from "@/lib/helpers";
import { z } from "zod";

const createPOSchema = z.object({
    customer: z.object({
        name: z.string().min(1, "Nama harus diisi"),
        phone: z.string().min(1, "Nomor telepon harus diisi"),
        address: z.string().optional(),
    }),
    items: z
        .array(
            z.object({
                productId: z.string().uuid("Product ID tidak valid"),
                quantity: z.number().int().min(1, "Quantity minimal 1"),
                price: z.number().int().min(0, "Harga tidak valid"),
            })
        )
        .min(1, "Minimal 1 item"),
    deliveryMethod: z.enum(["PICKUP", "DELIVERY"]),
});

// PUBLIC endpoint - anyone can create a PO
export async function POST(req: NextRequest) {
    try {
        // Rate limit by IP
        const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
        if (!rateLimit(ip, 5, 60000)) {
            return apiError("Terlalu banyak permintaan. Coba lagi nanti.", 429);
        }

        const body = await req.json();
        const parsed = createPOSchema.safeParse(body);
        if (!parsed.success) {
            return apiError(parsed.error.issues[0].message);
        }

        const order = await purchaseOrderService.createOrder(parsed.data);
        return apiResponse(order, 201);
    } catch (error) {
        return apiError((error as Error).message);
    }
}

// Admin-only GET - list all POs
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status") as "PENDING" | "ACCEPTED" | "DECLINED" | undefined;
        const page = parseInt(searchParams.get("page") ?? "1");
        const limit = parseInt(searchParams.get("limit") ?? "20");

        const result = await purchaseOrderService.getAllOrders({
            status: status ?? undefined,
            page,
            limit,
        });
        return apiResponse(result);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}
