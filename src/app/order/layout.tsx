import Link from "next/link";
import { Store, ShoppingCart, Menu, Package, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

export default function OrderLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const navLinks = [
        { href: "/order", label: "Produk", icon: Package },
        { href: "/order/history", label: "Pesanan", icon: History },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="sticky top-0 z-30 border-b bg-white shadow-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-2 text-primary font-bold text-xl">
                            <Store className="h-6 w-6" />
                            <span className="hidden sm:inline-block">G-YOUTH STORE</span>
                            <span className="sm:hidden">GYS</span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-2">
                        <nav className="hidden md:flex items-center gap-6">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="text-sm font-medium text-black hover:text-primary transition-colors flex items-center gap-1.5"
                                >
                                    <link.icon className="h-4 w-4" />
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                        <Link href="/order/checkout">
                            <Button variant="ghost" size="sm" className="flex items-center gap-2">
                                <ShoppingCart className="h-4 w-4" />
                                <span className="hidden sm:inline-block">Keranjang</span>
                            </Button>
                        </Link>

                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden">
                                    <Menu className="h-5 w-5" />
                                    <span className="sr-only">Buka menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                                <SheetHeader>
                                    <SheetTitle className="text-left">
                                        <Link href="/" className="flex items-center gap-2 text-primary font-bold text-xl">
                                            <Store className="h-6 w-6" />
                                            G-YOUTH STORE
                                        </Link>
                                    </SheetTitle>
                                </SheetHeader>
                                <nav className="flex flex-col gap-4 mt-8">
                                    {navLinks.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className="text-lg font-medium hover:text-primary transition-colors flex items-center gap-3"
                                        >
                                            <link.icon className="h-5 w-5" />
                                            {link.label}
                                        </Link>
                                    ))}
                                    <Link
                                        href="/order/checkout"
                                        className="text-lg font-medium hover:text-primary transition-colors flex items-center gap-2"
                                    >
                                        <ShoppingCart className="h-5 w-5" />
                                        Keranjang
                                    </Link>
                                </nav>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </header>
            <main className="flex-1">
                {children}
            </main>
            <footer className="border-t bg-white py-6">
                <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} G-YOUTH STORE — Komisi Remaja GKJ Gebyok. Seluruh hak cipta dilindungi.</p>
                    <div className="mt-2">
                        <Link href="/api/auth/signin" className="hover:underline">Login Staf</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
