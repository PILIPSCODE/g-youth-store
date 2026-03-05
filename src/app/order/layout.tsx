import Link from "next/link";
import { Store, ShoppingCart } from "lucide-react";

export default function OrderLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="sticky top-0 z-30 border-b bg-white shadow-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-primary font-bold text-xl">
                        <Store className="h-6 w-6" />
                        G-YOUTH STORE
                    </Link>
                    <nav className="flex items-center gap-4">
                        <Link href="/order" className="text-sm font-medium hover:text-primary">Products</Link>
                        <Link href="/order/history" className="text-sm font-medium hover:text-primary">My Orders</Link>
                        <Link href="/order/checkout" className="text-sm font-medium flex items-center gap-1 hover:text-primary">
                            <ShoppingCart className="h-4 w-4" />
                            Checkout
                        </Link>
                    </nav>
                </div>
            </header>
            <main className="flex-1">
                {children}
            </main>
            <footer className="border-t bg-white py-6">
                <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} G-YOUTH STORE. All rights reserved.</p>
                    <div className="mt-2">
                        <Link href="/api/auth/signin" className="hover:underline">Staff Login</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
