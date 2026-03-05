"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Minus, Trash2, ShoppingCart, Image as ImageIcon } from "lucide-react";
import { formatRupiah } from "@/lib/currency";
import { toast } from "sonner";

interface Category {
    id: string;
    name: string;
}

interface Product {
    id: string;
    name: string;
    sku: string;
    sellingPrice: number;
    stock: number;
    categoryId: string;
    imageUrl?: string;
}

export default function PosTransactionPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
    const [isLoading, setIsLoading] = useState(true);

    const { cart, addToCart, removeFromCart, updateQuantity, clearCart } = useAppStore();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [prodRes, catRes] = await Promise.all([
                    fetch("/api/products"),
                    fetch("/api/categories")
                ]);
                const prodData = await prodRes.json();
                const catData = await catRes.json();

                setProducts(prodData.data?.products || []);
                setCategories(catData.data || []);
            } catch (error) {
                toast.error("Failed to load products and categories");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleAddToCart = (product: Product) => {
        if (product.stock <= 0) {
            toast.error("Out of stock");
            return;
        }
        const existing = cart.find(item => item.id === product.id);
        if (existing && existing.quantity >= product.stock) {
            toast.error("Cannot add more than available stock");
            return;
        }
        addToCart(product, 1);
    };

    const handleUpdateQuantity = (id: string, newQuantity: number, maxStock: number) => {
        if (newQuantity <= 0) {
            removeFromCart(id);
            return;
        }
        if (newQuantity > maxStock) {
            toast.error("Exceeds available stock");
            return;
        }
        updateQuantity(id, newQuantity);
    };

    const subtotal = cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
    const total = subtotal;

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === "ALL" || p.categoryId === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <AuthLayout>
            <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-6rem)]">
                {/* Left Panel: Products */}
                <div className="flex-1 flex flex-col gap-4 min-h-[500px]">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search products..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <select
                            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="ALL">All Categories</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <ScrollArea className="flex-1 rounded-md border bg-slate-50/50 p-4">
                        {isLoading ? (
                            <div className="flex h-full items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                                No products found
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {filteredProducts.map((product) => (
                                    <Card
                                        key={product.id}
                                        className="cursor-pointer hover:border-primary/50 transition-colors overflow-hidden flex flex-col group"
                                        onClick={() => handleAddToCart(product)}
                                    >
                                        <div className="aspect-square bg-muted flex items-center justify-center w-full overflow-hidden relative">
                                            {product.imageUrl ? (
                                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                            ) : (
                                                <ImageIcon className="h-10 w-10 text-muted-foreground opacity-50" />
                                            )}
                                            {product.stock <= 5 && product.stock > 0 && (
                                                <Badge variant="destructive" className="absolute top-2 right-2 text-[10px] px-1.5 py-0 h-4">
                                                    Low Stock
                                                </Badge>
                                            )}
                                            {product.stock <= 0 && (
                                                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                                                    <Badge variant="destructive">Out of Stock</Badge>
                                                </div>
                                            )}
                                        </div>
                                        <CardContent className="p-3 flex-1 flex flex-col justify-between">
                                            <div>
                                                <p className="font-semibold text-sm line-clamp-2 leading-tight">{product.name}</p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">{product.sku}</p>
                                            </div>
                                            <div className="mt-2 flex items-end justify-between">
                                                <p className="font-bold text-primary text-sm">{formatRupiah(product.sellingPrice)}</p>
                                                <p className="text-[10px] text-muted-foreground">Stk: {product.stock}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>

                {/* Right Panel: Cart */}
                <div className="w-full lg:w-[380px] flex flex-col bg-white rounded-lg border shadow-sm">
                    <div className="p-4 border-b flex items-center justify-between bg-slate-50 rounded-t-lg">
                        <h2 className="font-semibold flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5" />
                            Current Order
                        </h2>
                        <Badge variant="secondary">{cart.length} items</Badge>
                    </div>

                    <ScrollArea className="flex-1 p-4">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-3 opacity-50 py-12">
                                <ShoppingCart className="h-12 w-12" />
                                <p>Your cart is empty</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {cart.map((item) => (
                                    <div key={item.id} className="flex gap-3 pb-4 border-b last:border-0 last:pb-0">
                                        <div className="h-12 w-12 bg-muted rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <ImageIcon className="h-5 w-5 text-muted-foreground opacity-50" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-sm leading-tight">{item.name}</p>
                                            <p className="font-bold text-primary mt-1 text-sm">{formatRupiah(item.sellingPrice)}</p>
                                        </div>
                                        <div className="flex flex-col items-end justify-between">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                                onClick={() => removeFromCart(item.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <div className="flex items-center gap-2 mt-2 bg-slate-100 rounded-md p-0.5">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 rounded-sm bg-white shadow-sm"
                                                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1, item.stock)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 rounded-sm bg-white shadow-sm"
                                                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1, item.stock)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>

                    <div className="p-4 bg-slate-50 border-t rounded-b-lg space-y-3">
                        <div className="pt-3 border-t flex justify-between items-end">
                            <span className="font-semibold text-lg">Total</span>
                            <span className="font-bold text-2xl text-primary">{formatRupiah(total)}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-4">
                            <Button
                                variant="outline"
                                className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={clearCart}
                                disabled={cart.length === 0}
                            >
                                Clear
                            </Button>
                            <Button
                                className="w-full font-bold"
                                size="lg"
                                disabled={cart.length === 0}
                                onClick={() => router.push("/pos/payment")}
                            >
                                Pay Now
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
}
