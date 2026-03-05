import { NextRequest } from "next/server";
import { purchaseOrderService } from "@/services/purchaseOrder.service";
import { apiResponse, apiError } from "@/lib/helpers";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const order = await purchaseOrderService.getOrderById(id);

        // Return minimal data for public view
        return apiResponse({
            id: order.id,
            status: order.status,
            totalAmount: order.totalAmount,
            createdAt: order.createdAt,
            items: order.items.map((item: any) => ({
                product: { name: item.product.name },
                quantity: item.quantity,
                price: item.price
            })),
            deliveryMethod: order.deliveryMethod
        });
    } catch (error: any) {
        return apiError(error.message || "Order not found", 404);
    }
}
