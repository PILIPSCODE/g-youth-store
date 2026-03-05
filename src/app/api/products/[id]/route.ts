import { NextRequest } from "next/server";
import { withAuth, getCurrentUser } from "@/lib/rbac";
import { productService } from "@/services/product.service";
import { apiResponse, apiError } from "@/lib/helpers";
import { z } from "zod";

const updateProductSchema = z.object({
    name: z.string().min(1).optional(),
    sku: z.string().min(1).optional(),
    categoryId: z.string().uuid().optional(),
    costPrice: z.number().int().min(0).optional(),
    sellingPrice: z.number().int().min(0).optional(),
    stock: z.number().int().min(0).optional(),
    minStockAlert: z.number().int().min(0).optional(),
    imageUrl: z.string().url().optional(),
});

export const GET = withAuth(
    async (_req: NextRequest, context?) => {
        try {
            const { id } = await context!.params;
            const product = await productService.getProductById(id);
            return apiResponse(product);
        } catch (error) {
            return apiError((error as Error).message, 404);
        }
    },
    "ADMIN",
    "CASHIER"
);

export const PUT = withAuth(async (req: NextRequest, context?) => {
    try {
        const { id } = await context!.params;
        const user = await getCurrentUser();
        const body = await req.json();
        const parsed = updateProductSchema.safeParse(body);
        if (!parsed.success) {
            return apiError(parsed.error.issues[0].message);
        }
        const product = await productService.updateProduct(id, parsed.data, user!.id);
        return apiResponse(product);
    } catch (error) {
        return apiError((error as Error).message);
    }
}, "ADMIN");

export const DELETE = withAuth(async (_req: NextRequest, context?) => {
    try {
        const { id } = await context!.params;
        const user = await getCurrentUser();
        await productService.deleteProduct(id, user!.id);
        return apiResponse({ message: "Produk berhasil dihapus" });
    } catch (error) {
        return apiError((error as Error).message);
    }
}, "ADMIN");
