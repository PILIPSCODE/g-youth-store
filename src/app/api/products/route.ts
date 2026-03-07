import { NextRequest } from "next/server";
import { withAuth, getCurrentUser } from "@/lib/rbac";
import { productService } from "@/services/product.service";
import { apiResponse, apiError } from "@/lib/helpers";
import { z } from "zod";

const createProductSchema = z.object({
    name: z.string().min(1, "Nama produk harus diisi"),
    sku: z.string().min(1, "SKU harus diisi"),
    categoryId: z.string().uuid("Category ID tidak valid"),
    costPrice: z.number().int().min(0, "Harga modal tidak boleh negatif"),
    sellingPrice: z.number().int().min(0, "Harga jual tidak boleh negatif"),
    stock: z.number().int().min(0).optional(),
    minStockAlert: z.number().int().min(0).optional(),
    imageUrl: z.string().url().optional(),
});

export const GET = async (req: NextRequest) => {
    try {
        const { searchParams } = new URL(req.url);
        const categoryId = searchParams.get("categoryId") ?? undefined;
        const search = searchParams.get("search") ?? undefined;
        const page = parseInt(searchParams.get("page") ?? "1");
        const limit = parseInt(searchParams.get("limit") ?? "20");

        const result = await productService.getAllProducts({ categoryId, search, page, limit });
        return apiResponse(result, 200);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
};

export const POST = withAuth(async (req: NextRequest) => {
    try {
        const user = await getCurrentUser();
        const body = await req.json();
        const parsed = createProductSchema.safeParse(body);
        if (!parsed.success) {
            return apiError(parsed.error.issues[0].message);
        }
        const product = await productService.createProduct(parsed.data, user!.id);
        return apiResponse(product, 201);
    } catch (error) {
        return apiError((error as Error).message);
    }
}, "ADMIN");
