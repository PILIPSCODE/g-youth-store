import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Role = "ADMIN" | "CASHIER";

type RouteHandler = (
    req: NextRequest,
    context: any
) => Promise<NextResponse>;

/**
 * Wraps an API route handler with authentication and role-based access control.
 */
export function withAuth(handler: RouteHandler, ...allowedRoles: Role[]): RouteHandler {
    return async (req: NextRequest, context?) => {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized. Silakan login terlebih dahulu." },
                { status: 401 }
            );
        }

        if (allowedRoles.length > 0 && !allowedRoles.includes(session.user.role as Role)) {
            return NextResponse.json(
                { error: "Forbidden. Anda tidak memiliki akses." },
                { status: 403 }
            );
        }

        return handler(req, context);
    };
}

/**
 * Gets the current authenticated user session. Returns null if not authenticated.
 */
export async function getCurrentUser() {
    const session = await getServerSession(authOptions);
    return session?.user ?? null;
}
