import { NextRequest } from "next/server";
import { withAuth } from "@/lib/rbac";
import { userService } from "@/services/user.service";
import { apiResponse, apiError } from "@/lib/helpers";

export const DELETE = withAuth(async (req: NextRequest, { params }: any) => {
    try {
        const { id } = await params;
        const user = await userService.getUserById(id);
        if (user.role === "ADMIN") {
            return apiError("Cannot delete admin users via this API", 403);
        }

        await userService.deleteUser(id);
        return apiResponse({ message: "User deleted successfully" });
    } catch (error: any) {
        if (error.code === "P2003") {
            return apiError("Cannot delete user with transaction history or activity logs", 400);
        }
        return apiError(error.message || "Failed to delete user", 500);
    }
}, "ADMIN");
