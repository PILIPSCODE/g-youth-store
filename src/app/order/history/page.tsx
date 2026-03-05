"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/currency";
import { format } from "date-fns";
import { Package, Calendar, Clock, ArrowLeft, PhoneForwarded, Store, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface OrderDetail {
    id: string;
    status: "PENDING" | "ACCEPTED" | "DECLINED";
    totalAmount: number;
    createdAt: string;
    items: { product: { name: string; imageUrl?: string | null }; quantity: number }[];
}

export default function OrderHistoryPage() {
    const { orderHistoryIds } = useAppStore();
    const [orders, setOrders] = useState<OrderDetail[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("ALL");

    const statusConfig: Record<string, { label: string; className: string }> = {
        PENDING: { label: "Menunggu", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
        ACCEPTED: { label: "Diterima", className: "bg-green-100 text-green-800 border-green-200" },
        DECLINED: { label: "Ditolak", className: "bg-red-100 text-red-800 border-red-200" },
    };

    const filterTabs = [
        { value: "ALL", label: "Semua" },
        { value: "PENDING", label: "Menunggu" },
        { value: "ACCEPTED", label: "Diterima" },
        { value: "DECLINED", label: "Ditolak" },
    ];

    useEffect(() => {
        const fetchOrderStatuses = async () => {
            if (orderHistoryIds.length === 0) {
                setIsLoading(false);
                return;
            }

            try {
                const fetchedOrders = await Promise.all(
                    orderHistoryIds.map(async (id) => {
                        try {
                            const res = await fetch(`/api/purchase-orders/${id}`);
                            if (res.ok) {
                                const data = await res.json();
                                return data.data;
                            }
                            return null;
                        } catch {
                            return null;
                        }
                    })
                );

                setOrders(fetchedOrders.filter((o): o is OrderDetail => o !== null));
            } catch (error) {
                console.error("Failed to fetch order history", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrderStatuses();
    }, [orderHistoryIds]);

    if (isLoading) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-16 text-center">
                <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Memuat riwayat pesanan...</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-display">Pesanan Saya</h1>
                    <Button variant="ghost" asChild className="hidden sm:flex">
                        <Link href="/order" className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Kembali ke Toko
                        </Link>
                    </Button>
                </div>
                <p className="text-muted-foreground mt-1 text-sm">Daftar pesanan yang Anda buat di perangkat ini.</p>
                <Button variant="outline" size="sm" asChild className="sm:hidden mt-3">
                    <Link href="/order" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Kembali ke Toko
                    </Link>
                </Button>
            </div>

            {/* Status Filter Tabs */}
            <div className="mb-6 flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                {filterTabs.map((tab) => (
                    <Badge
                        key={tab.value}
                        variant={statusFilter === tab.value ? "default" : "outline"}
                        className={`text-xs px-3 py-1.5 cursor-pointer whitespace-nowrap ${statusFilter !== tab.value ? "text-muted-foreground hover:bg-slate-100" : ""}`}
                        onClick={() => setStatusFilter(tab.value)}
                    >
                        {tab.label}
                        {tab.value !== "ALL" && (
                            <span className="ml-1.5 text-[10px] opacity-70">
                                ({orders.filter(o => o.status === tab.value).length})
                            </span>
                        )}
                    </Badge>
                ))}
            </div>

            {(() => {
                const filtered = statusFilter === "ALL"
                    ? orders
                    : orders.filter(o => o.status === statusFilter);

                if (orders.length === 0) {
                    return (
                        <Card className="border-dashed border-2 bg-slate-50/50">
                            <CardContent className="py-12 items-center flex flex-col justify-center text-center">
                                <div className="bg-slate-200 p-4 rounded-full mb-4">
                                    <Package className="h-8 w-8 text-slate-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900">Belum Ada Pesanan</h3>
                                <p className="text-muted-foreground max-w-xs mx-auto mt-2 mb-6">
                                    Anda belum membuat pesanan apapun di perangkat ini.
                                </p>
                                <Button asChild>
                                    <Link href="/order">Mulai Belanja</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    );
                }

                if (filtered.length === 0) {
                    return (
                        <Card className="border-dashed border-2 bg-slate-50/50">
                            <CardContent className="py-12 items-center flex flex-col justify-center text-center">
                                <div className="bg-slate-200 p-4 rounded-full mb-4">
                                    <Filter className="h-8 w-8 text-slate-500" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900">Tidak ada pesanan dengan status ini</h3>
                                <p className="text-muted-foreground max-w-xs mx-auto mt-2 mb-6">
                                    Coba pilih filter status lain.
                                </p>
                                <Button variant="outline" onClick={() => setStatusFilter("ALL")}>Tampilkan Semua</Button>
                            </CardContent>
                        </Card>
                    );
                }

                return (
                    <div className="space-y-4 sm:space-y-6">
                        {filtered.map((order) => (
                            <Card key={order.id} className="overflow-hidden shadow-sm hover:shadow-md transition-all border-slate-200 group">
                                <div className="bg-slate-50 border-b border-slate-100 px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap justify-between items-center gap-3 sm:gap-4">
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">ID</div>
                                        <div className="font-mono text-xs sm:text-sm text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                                            #{order.id.slice(0, 8)}...
                                        </div>
                                        <Badge className={`text-[10px] sm:text-xs font-bold border ${statusConfig[order.status]?.className || "bg-gray-100 text-gray-700"}`}>
                                            {statusConfig[order.status]?.label || order.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-500">
                                        <div className="flex items-center gap-1.5 font-medium">
                                            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                            {format(new Date(order.createdAt), "dd MMM yyyy")}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                            {format(new Date(order.createdAt), "HH:mm")}
                                        </div>
                                    </div>
                                </div>
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row justify-between gap-8">
                                        <div className="flex-1 space-y-4">
                                            <h4 className="font-semibold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-2">
                                                <Package className="h-4 w-4" />
                                                Item Pesanan
                                            </h4>
                                            <div className="space-y-3">
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} className="flex gap-4 items-center animate-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                                                        <div className="h-12 w-12 bg-slate-100 rounded-md border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                            {item.product?.imageUrl ? (
                                                                <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full object-cover" />
                                                            ) : (
                                                                <Store className="h-5 w-5 text-slate-300" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm font-medium text-slate-700 truncate">
                                                                {item.product?.name}
                                                            </div>
                                                            <div className="text-xs text-slate-500 font-medium">
                                                                {item.quantity} × item
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="md:text-right flex flex-col justify-end items-end gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                                            <div className="flex flex-col items-end">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Pembayaran</div>
                                                <div className="text-3xl font-black text-primary">
                                                    {formatRupiah(order.totalAmount)}
                                                </div>
                                            </div>
                                            <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-[11px] font-bold flex items-center gap-2.5 mt-3 border border-emerald-100 shadow-sm animate-pulse-subtle">
                                                <PhoneForwarded className="h-3.5 w-3.5" />
                                                Admin akan menghubungi nomor Anda
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                );
            })()}

            <div className="mt-12 bg-blue-50 border border-blue-100 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6 shadow-inner animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-blue-600 p-4 rounded-xl shadow-lg shadow-blue-200">
                    <Clock className="h-8 w-8 text-white" />
                </div>
                <div>
                    <h4 className="font-bold text-blue-900 text-lg text-center md:text-left">Info Konfirmasi & Pengiriman</h4>
                    <p className="text-blue-800/80 text-sm mt-2 text-center md:text-left leading-relaxed">
                        Terima kasih sudah berbelanja! Admin <strong>G-YOUTH STORE</strong> akan menghubungi <strong>nomor HP</strong> yang Anda masukkan saat checkout untuk memberikan update status dan detail pengiriman pesanan Anda secara manual.
                    </p>
                </div>
            </div>
        </div>
    );
}
