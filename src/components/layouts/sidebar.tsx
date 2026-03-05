import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Package,
    Users,
    FileText,
    ShoppingCart,
    LogOut,
    Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";

const adminNavItems = [
    { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { title: "Products", href: "/admin/products", icon: Package },
    { title: "Users", href: "/admin/users", icon: Users },
    { title: "Reports", href: "/admin/reports", icon: FileText },
    { title: "Purchase Orders", href: "/admin/purchase-orders", icon: ShoppingCart },
];

const cashierNavItems = [
    { title: "POS", href: "/pos", icon: ShoppingCart },
    { title: "Transactions", href: "/pos/transactions", icon: FileText },
];

export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
    const toggleSidebar = useAppStore((state) => state.toggleSidebar);

    const isAdmin = session?.user?.role === "ADMIN";
    const navItems = isAdmin ? adminNavItems : cashierNavItems;

    return (
        <div
            className={cn(
                "fixed left-0 top-0 z-40 h-screen w-64 transform bg-white border-r transition-transform duration-200 ease-in-out dark:bg-gray-900 md:translate-x-0",
                !isSidebarOpen && "-translate-x-full"
            )}
        >
            <div className="flex h-16 items-center justify-between px-4 border-b">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
                    G-YOUTH POS
                </Link>
                <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
                    <Menu className="h-5 w-5" />
                </Button>
            </div>

            <div className="flex flex-col h-[calc(100vh-4rem)] justify-between py-4">
                <nav className="flex flex-col gap-2 px-2">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.title}
                            </Link>
                        );
                    })}
                </nav>

                <div className="px-4 py-4 border-t">
                    <div className="mb-4">
                        <p className="text-sm font-medium">{session?.user?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
                        <p className="text-xs font-semibold text-primary mt-1">{session?.user?.role}</p>
                    </div>
                    <Button
                        variant="outline"
                        className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => signOut({ callbackUrl: "/" })}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </Button>
                </div>
            </div>
        </div>
    );
}
