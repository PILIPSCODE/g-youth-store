"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Image as ImageIcon } from "lucide-react";
import { formatRupiah } from "@/lib/currency";
import { toast } from "sonner";

export default function StorefrontPage() {
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const { cart, addToCart } = useAppStore();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch("/api/products");
                const data = await res.json();
                // For public storefront, only show products with stock > 0
                const available = (data.data?.products || []).filter((p: any) => p.stock > 0);
                setProducts(available);
            } catch (error) {
                toast.error("Failed to load products");
            } finally {
                setIsLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const handleAddToCart = (product: any) => {
        const existing = cart.find(item => item.id === product.id);
        if (existing && existing.quantity >= product.stock) {
            toast.error("Cannot add more than available stock");
            return;
        }
        addToCart(product, 1);
        toast.success(`Added ${product.name} to cart`);
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 pb-16">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-primary via-blue-600 to-blue-800 text-white pt-20 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl"></div>

                <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center text-center">
                    <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none mb-6 px-4 py-1.5 backdrop-blur-sm">
                        Welcome to G-YOUTH STORE
                    </Badge>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight max-w-3xl">
                        Discover Quality Products <br className="hidden md:block" /> For Every Need
                    </h1>
                    <p className="text-lg md:text-xl text-blue-100 max-w-2xl mb-10">
                        Browse our curated collection of items. Simple ordering, fast processing, and reliable service right to your hands.
                    </p>

                    <div className="w-full max-w-2xl bg-white/10 backdrop-blur-md p-2 rounded-2xl flex items-center shadow-2xl border border-white/20">
                        <Search className="h-6 w-6 text-white/70 ml-4 mr-2" />
                        <input
                            type="search"
                            placeholder="Find what you're looking for..."
                            className="w-full bg-transparent border-none text-white placeholder-white/60 focus:ring-0 text-lg px-2 h-14 outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
                <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                        <Badge variant="default" className="text-sm px-4 py-1.5 cursor-pointer whitespace-nowrap">All Products</Badge>
                        <Badge variant="outline" className="text-sm px-4 py-1.5 cursor-pointer whitespace-nowrap hover:bg-slate-100 text-muted-foreground">Books</Badge>
                        <Badge variant="outline" className="text-sm px-4 py-1.5 cursor-pointer whitespace-nowrap hover:bg-slate-100 text-muted-foreground">Apparel</Badge>
                        <Badge variant="outline" className="text-sm px-4 py-1.5 cursor-pointer whitespace-nowrap hover:bg-slate-100 text-muted-foreground">Accessories</Badge>
                    </div>

                    <Button
                        onClick={() => router.push("/order/checkout")}
                        className="relative hidden sm:flex shadow-md hover:shadow-lg transition-all"
                        size="lg"
                    >
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        View Cart
                        {cart.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-white shadow-sm ring-2 ring-red-500/20 animate-pulse">
                                {cart.length}
                            </span>
                        )}
                    </Button>
                </div>

                {/* Mobile Cart Button Fixed */}
                <div className="fixed bottom-6 right-6 z-50 sm:hidden">
                    <Button
                        onClick={() => router.push("/order/checkout")}
                        className="relative rounded-full w-14 h-14 shadow-2xl"
                        size="icon"
                    >
                        <ShoppingCart className="h-6 w-6" />
                        {cart.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-white shadow-sm">
                                {cart.length}
                            </span>
                        )}
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-64 bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-32 text-muted-foreground border border-slate-200 rounded-2xl bg-white shadow-sm">
                        <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-slate-900 mb-1">No products found</h3>
                        <p className="text-slate-500">We couldn't match anything with "{search}"</p>
                        <Button variant="outline" className="mt-6" onClick={() => setSearch("")}>Clear Search</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredProducts.map((product) => (
                            <Card key={product.id} className="overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300 border-slate-200/60 bg-white hover:-translate-y-1">
                                <div className="aspect-[4/3] bg-slate-100 flex items-center justify-center relative overflow-hidden">
                                    {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <div className="h-full w-full flex flex-col items-center justify-center opacity-40 bg-slate-200 group-hover:opacity-60 transition-opacity">
                                            <ImageIcon className="h-16 w-16 text-slate-400 mb-2" />
                                            <span className="text-sm font-medium text-slate-500">No Image</span>
                                        </div>
                                    )}
                                    {product.stock <= 5 && (
                                        <Badge variant="destructive" className="absolute top-3 right-3 shadow-md border-white border text-[10px] uppercase tracking-wider font-bold">
                                            Only {product.stock} left
                                        </Badge>
                                    )}
                                </div>
                                <CardContent className="p-5 flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="text-xs font-medium text-blue-600 mb-1 uppercase tracking-wider">
                                            {product.category?.name || "Product"}
                                        </div>
                                        <h3 className="font-semibold text-slate-900 line-clamp-2 text-lg leading-tight mb-2 group-hover:text-primary transition-colors">{product.name}</h3>
                                        <p className="text-2xl font-black text-slate-900 mb-1 relative inline-block">
                                            {formatRupiah(product.sellingPrice)}
                                            <span className="absolute bottom-1 left-0 w-full h-2 bg-blue-100 -z-10 group-hover:h-3 transition-all"></span>
                                        </p>
                                    </div>
                                    <Button
                                        className="w-full mt-6 shadow-sm hover:shadow-md transition-shadow font-semibold"
                                        variant="default"
                                        onClick={() => handleAddToCart(product)}
                                    >
                                        Add to Cart
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
