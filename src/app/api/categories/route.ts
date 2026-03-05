import { NextRequest } from "next/server";
import { withAuth } from "@/lib/rbac";
import { categoryService } from "@/services/category.service";
import { apiResponse, apiError } from "@/lib/helpers";
import { z } from "zod";

const categorySchema = z.object({
    name: z.string().min(1, "Nama kategori harus diisi"),
});

export const GET = async () => {
    try {
        const categories = await categoryService.getAllCategories();
        return apiResponse(categories, 200, {
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
        });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
};

export const POST = withAuth(async (req: NextRequest) => {
    try {
        const body = await req.json();
        const parsed = categorySchema.safeParse(body);
        if (!parsed.success) {
            return apiError(parsed.error.issues[0].message);
        }
        const category = await categoryService.createCategory(parsed.data.name);
        return apiResponse(category, 201);
    } catch (error) {
        return apiError((error as Error).message);
    }
}, "ADMIN");
