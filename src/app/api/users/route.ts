import { NextRequest } from "next/server";
import { withAuth, getCurrentUser } from "@/lib/rbac";
import { userService } from "@/services/user.service";
import { apiResponse, apiError } from "@/lib/helpers";
import { z } from "zod";

const createUserSchema = z.object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
    email: z.string().email("Format email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    role: z.enum(["ADMIN", "CASHIER"]).optional(),
});

export const GET = withAuth(async () => {
    try {
        const users = await userService.getAllUsers();
        return apiResponse(users);
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}, "ADMIN");

export const POST = withAuth(async (req: NextRequest) => {
    try {
        const body = await req.json();
        const parsed = createUserSchema.safeParse(body);
        if (!parsed.success) {
            return apiError(parsed.error.issues[0].message);
        }
        const user = await userService.createUser(parsed.data);
        return apiResponse(user, 201);
    } catch (error) {
        return apiError((error as Error).message);
    }
}, "ADMIN");
