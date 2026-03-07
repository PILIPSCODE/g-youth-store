"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/currency";
import { toast } from "sonner";
import { Store, Truck, ArrowLeft, Trash2, Plus, Minus } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
    const router = useRouter();
    const { cart, removeFromCart, updateQuantity, clearCart, addOrderToHistory } = useAppStore();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        customerName: "",
        customerPhone: "",
        customerAddress: "",
        deliveryMethod: "PICKUP" as "PICKUP" | "DELIVERY",
    });

    const subtotal = cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
    const total = subtotal;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (cart.length === 0) {
            toast.error("Keranjang Anda kosong");
            return;
        }

        setIsSubmitting(true);

        const promise = async () => {
            const payload = {
                customer: {
                    name: formData.customerName,
                    phone: formData.customerPhone,
                    address: formData.customerAddress,
                },
                deliveryMethod: formData.deliveryMethod,
                items: cart.map(item => ({
                    productId: item.id,
                    quantity: item.quantity,
                    price: item.sellingPrice
                }))
            };

            const res = await fetch("/api/purchase-orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to place order");
            }

            return res.json();
        };

        toast.promise(promise(), {
            loading: 'Memproses pesanan Anda...',
            success: (data) => {
                if (data.data?.id) {
                    addOrderToHistory(data.data.id);
                }
                clearCart();
                router.push("/order");
                return "Pesanan berhasil dibuat! Mengalihkan...";
            },
            error: (err) => {
                setIsSubmitting(false);
                return err.message;
            }
        });
    };

    if (cart.length === 0 && !isSubmitting) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-16 text-center">
                <h2 className="text-2xl font-bold mb-4">Keranjang Anda Kosong</h2>
                <p className="text-muted-foreground mb-8">Sepertinya Anda belum menambahkan produk ke keranjang.</p>
                <Button onClick={() => router.push("/order")}>Belanja Sekarang</Button>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
                <Link href="/order" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali ke Toko
                </Link>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-4">Keranjang</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-6">
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                            <CardTitle className="text-xl">Metode Pengambilan</CardTitle>
                            <CardDescription>Bagaimana Anda ingin menerima pesanan?</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div
                                    className={`border-2 rounded-xl p-5 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 hover:-translate-y-1 ${formData.deliveryMethod === 'PICKUP' ? 'border-primary bg-primary/5 text-primary shadow-md' : 'border-slate-200 hover:border-primary/40 hover:bg-slate-50 text-slate-500'}`}
                                    onClick={() => setFormData({ ...formData, deliveryMethod: 'PICKUP' })}
                                >
                                    <Store className="h-8 w-8" />
                                    <div className="text-center">
                                        <div className="font-bold text-slate-900">Ambil di Gereja Minggu Besuk</div>
                                        <div className="text-xs font-medium text-emerald-600 mt-1">Gratis</div>
                                    </div>
                                </div>
                                <div
                                    className={`border-2 rounded-xl p-5 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 hover:-translate-y-1 ${formData.deliveryMethod === 'DELIVERY' ? 'border-primary bg-primary/5 text-primary shadow-md' : 'border-slate-200 hover:border-primary/40 hover:bg-slate-50 text-slate-500'}`}
                                    onClick={() => setFormData({ ...formData, deliveryMethod: 'DELIVERY' })}
                                >
                                    <Truck className="h-8 w-8" />
                                    <div className="text-center">
                                        <div className="font-bold text-slate-900">Diantar</div>
                                        <div className="text-xs font-medium text-amber-600 mt-1">Biaya menyesuaikan</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200 overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                            <CardTitle className="text-xl">Informasi Pemesan</CardTitle>
                            <CardDescription>Masukkan data Anda untuk menyelesaikan pesanan.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Nama Lengkap</label>
                                        <Input
                                            required
                                            className="h-11 bg-slate-50 focus:bg-white"
                                            placeholder="contoh: Budi Santoso"
                                            value={formData.customerName}
                                            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Nomor HP</label>
                                        <Input
                                            required
                                            type="tel"
                                            className="h-11 bg-slate-50 focus:bg-white"
                                            placeholder="contoh: 0812..."
                                            value={formData.customerPhone}
                                            onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {formData.deliveryMethod === 'DELIVERY' && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
                                        <label className="text-sm font-semibold text-slate-700">Alamat Pengiriman</label>
                                        <Textarea
                                            required
                                            placeholder="Masukkan alamat lengkap Anda, RT/RW, kelurahan, kecamatan..."
                                            className="resize-none bg-slate-50 focus:bg-white p-3 min-h-[100px]"
                                            value={formData.customerAddress}
                                            onChange={(e: any) => setFormData({ ...formData, customerAddress: e.target.value })}
                                        />
                                    </div>
                                )}
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                            <CardTitle className="text-xl">Ringkasan Belanja</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="divide-y divide-slate-100">
                                {cart.map((item) => (
                                    <div key={item.id} className="flex gap-3 sm:gap-4 py-4 items-center">
                                        <div className="h-14 w-14 sm:h-16 sm:w-16 bg-slate-100 rounded-md border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                            {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" /> : <Store className="h-6 w-6 text-slate-300" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-slate-900 line-clamp-1 text-sm sm:text-base">{item.name}</h4>
                                            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">{formatRupiah(item.sellingPrice)}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={() => {
                                                        if (item.quantity <= 1) {
                                                            removeFromCart(item.id);
                                                        } else {
                                                            updateQuantity(item.id, item.quantity - 1);
                                                        }
                                                    }}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <div className="font-bold text-slate-900 text-sm sm:text-base">
                                                {formatRupiah(item.sellingPrice * item.quantity)}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => removeFromCart(item.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-5">
                    <Card className="sticky top-24 shadow-md border-primary/20 bg-slate-50/50">
                        <CardHeader className="pb-4 border-b border-slate-200/60">
                            <CardTitle className="flex justify-between items-center text-xl">
                                <span>Ringkasan Pesanan</span>
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">{cart.length} Item</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">

                            <div className="space-y-3">
                                <div className="flex justify-between text-slate-600">
                                    <span>Subtotal</span>
                                    <span className="font-medium text-slate-900">{formatRupiah(subtotal)}</span>
                                </div>
                                {formData.deliveryMethod === 'DELIVERY' && (
                                    <div className="flex justify-between text-slate-600 animate-in fade-in">
                                        <span>Ongkos kirim (perkiraan)</span>
                                        <span className="font-medium text-amber-600">Dihitung nanti</span>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-slate-200 pt-4 flex justify-between items-end">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 mb-1">Total Pembayaran</p>
                                    <p className="text-3xl font-black text-primary">{formatRupiah(total)}</p>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                form="checkout-form"
                                className="w-full h-14 text-lg font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Processing Order...
                                    </div>
                                ) : "Buat Pesanan Sekarang"}
                            </Button>

                            <p className="text-center text-xs text-slate-500">
                                Dengan membuat pesanan, Anda menyetujui kebijakan toko kami.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
