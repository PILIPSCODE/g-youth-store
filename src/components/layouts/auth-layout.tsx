"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "./sidebar";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShiftManager } from "@/components/pos/shift-manager";

interface AuthLayoutProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export function AuthLayout({ children, allowedRoles }: AuthLayoutProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
    const toggleSidebar = useAppStore((state) => state.toggleSidebar);

    const userRole = (session?.user as { role?: string })?.role;

    useEffect(() => {
        if (status === "authenticated" && allowedRoles && userRole && !allowedRoles.includes(userRole)) {
            if (userRole === "CASHIER") {
                router.replace("/pos");
            } else {
                router.replace("/admin/dashboard");
            }
        }
    }, [status, userRole, allowedRoles, router]);

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (status === "unauthenticated") {
        if (typeof window !== "undefined") {
            window.location.href = "/auth/login";
        }
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // If role is not allowed, show loading while redirecting
    if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 flex">
            <Sidebar />
            <div
                className={cn(
                    "flex-1 flex flex-col min-h-screen transition-all duration-200 md:ml-64"
                )}
            >
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 md:px-6 shadow-sm md:hidden">
                    <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                        <Menu className="h-5 w-5" />
                    </Button>
                    <div className="font-semibold px-2">G-YOUTH STORE</div>
                </header>

                <main className="flex-1 p-4 md:p-6 lg:p-8">
                    <div className="mx-auto max-w-7xl">
                        {children}
                    </div>
                </main>
            </div>

            {userRole === "CASHIER" && <ShiftManager />}
        </div>
    );
}
