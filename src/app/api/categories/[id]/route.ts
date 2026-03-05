import { NextRequest } from "next/server";
import { withAuth } from "@/lib/rbac";
import { categoryService } from "@/services/category.service";
import { apiResponse, apiError } from "@/lib/helpers";
import { z } from "zod";

const updateSchema = z.object({
    name: z.string().min(1, "Nama kategori harus diisi"),
});

export const GET = withAuth(
    async (_req: NextRequest, context?) => {
        try {
            const { id } = await context!.params;
            const category = await categoryService.getCategoryById(id);
            return apiResponse(category);
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
        const body = await req.json();
        const parsed = updateSchema.safeParse(body);
        if (!parsed.success) {
            return apiError(parsed.error.issues[0].message);
        }
        const category = await categoryService.updateCategory(id, parsed.data.name);
        return apiResponse(category);
    } catch (error) {
        return apiError((error as Error).message);
    }
}, "ADMIN");

export const DELETE = withAuth(async (_req: NextRequest, context?) => {
    try {
        const { id } = await context!.params;
        await categoryService.deleteCategory(id);
        return apiResponse({ message: "Kategori berhasil dihapus" });
    } catch (error) {
        return apiError((error as Error).message);
    }
}, "ADMIN");
