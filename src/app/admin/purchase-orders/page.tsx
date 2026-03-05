"use client";

import { useState, useEffect } from "react";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, CheckCircle, XCircle, Package, Filter } from "lucide-react";
import { formatRupiah } from "@/lib/currency";
import { toast } from "sonner";
import { format } from "date-fns";

interface POItem {
    id: string;
    productId: string;
    quantity: number;
    price: number;
    product?: { name: string; imageUrl?: string | null };
}

interface PurchaseOrder {
    id: string;
    customer: {
        name: string;
        phone: string;
        address?: string;
    };
    status: "PENDING" | "ACCEPTED" | "DECLINED";
    deliveryMethod: "PICKUP" | "DELIVERY";
    totalAmount: number;
    createdAt: string;
    items: POItem[];
}

export default function AdminPurchaseOrdersPage() {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/purchase-orders");
            const data = await res.json();
            setOrders(data.data?.orders || []);
        } catch (error) {
            toast.error("Gagal memuat pesanan");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleAction = async (id: string, action: "accept" | "decline") => {
        if (!confirm(`Apakah Anda yakin ingin ${action === 'accept' ? 'menerima' : 'menolak'} pesanan ini?`)) return;

        try {
            const res = await fetch(`/api/purchase-orders/${id}/${action}`, {
                method: "POST",
            });

            if (res.ok) {
                toast.success(`Pesanan berhasil ${action === 'accept' ? 'diterima' : 'ditolak'}`);
                if (isModalOpen) setIsModalOpen(false);
                fetchOrders();
            } else {
                const err = await res.json();
                toast.error(err.message || `Gagal ${action === 'accept' ? 'menerima' : 'menolak'} pesanan`);
            }
        } catch (error) {
            toast.error("Terjadi kesalahan");
        }
    };

    const openDetailModal = (order: PurchaseOrder) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const filteredOrders = orders.filter((o) => {
        const matchesSearch = o.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
            o.id.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
        const orderDate = new Date(o.createdAt);
        const matchesDateFrom = !dateFrom || orderDate >= new Date(dateFrom);
        const matchesDateTo = !dateTo || orderDate <= new Date(dateTo + "T23:59:59");
        return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <Badge className="bg-amber-500 hover:bg-amber-600">Menunggu</Badge>;
            case "ACCEPTED":
                return <Badge className="bg-green-500 hover:bg-green-600">Diterima</Badge>;
            case "DECLINED":
                return <Badge variant="destructive">Ditolak</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    return (
        <AuthLayout allowedRoles={["ADMIN"]}>
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Pesanan Masuk</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Kelola pesanan dari toko online G-YOUTH STORE.
                    </p>
                </div>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Detail Pesanan</DialogTitle>
                        </DialogHeader>

                        {selectedOrder && (
                            <div className="space-y-6 py-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="font-semibold text-muted-foreground">Pelanggan</p>
                                        <p>{selectedOrder.customer?.name}</p>
                                        <p>{selectedOrder.customer?.phone || "Tidak ada nomor"}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-muted-foreground">Info Pesanan</p>
                                        <p>Tanggal: {format(new Date(selectedOrder.createdAt), "dd MMM yyyy HH:mm")}</p>
                                        <p>Metode: {selectedOrder.deliveryMethod === "PICKUP" ? "Ambil di Toko" : "Diantar"}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-muted-foreground">Status:</span>
                                            {getStatusBadge(selectedOrder.status)}
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="font-semibold text-muted-foreground">Alamat</p>
                                        <p>{selectedOrder.customer?.address || "Ambil di toko"}</p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-semibold mb-2">Item Pesanan</h4>
                                    <div className="border rounded-md">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-12"></TableHead>
                                                    <TableHead>Produk</TableHead>
                                                    <TableHead className="text-right">Jml</TableHead>
                                                    <TableHead className="text-right">Harga</TableHead>
                                                    <TableHead className="text-right">Total</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedOrder.items?.map((item, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell className="w-12">
                                                            <div className="h-10 w-10 bg-slate-100 rounded border flex items-center justify-center overflow-hidden">
                                                                {item.product?.imageUrl ? (
                                                                    <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full object-cover" />
                                                                ) : (
                                                                    <Package className="h-4 w-4 text-slate-300" />
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{item.product?.name || "Produk tidak diketahui"}</TableCell>
                                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                                        <TableCell className="text-right">{formatRupiah(item.price)}</TableCell>
                                                        <TableCell className="text-right font-medium">{formatRupiah(item.price * item.quantity)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center text-lg font-bold">
                                    <span>Grand Total</span>
                                    <span>{formatRupiah(selectedOrder.totalAmount)}</span>
                                </div>

                                {selectedOrder.status === "PENDING" && (
                                    <div className="flex justify-end gap-2 pt-4 border-t">
                                        <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleAction(selectedOrder.id, "decline")}>
                                            <XCircle className="mr-2 h-4 w-4" /> Tolak
                                        </Button>
                                        <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleAction(selectedOrder.id, "accept")}>
                                            <CheckCircle className="mr-2 h-4 w-4" /> Terima Pesanan
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                <div className="flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Cari nama pelanggan..."
                                className="pl-8 h-9 text-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {[
                                { value: "ALL", label: "Semua" },
                                { value: "PENDING", label: "Menunggu" },
                                { value: "ACCEPTED", label: "Diterima" },
                                { value: "DECLINED", label: "Ditolak" },
                            ].map((s) => (
                                <Button
                                    key={s.value}
                                    variant={statusFilter === s.value ? "default" : "outline"}
                                    size="sm"
                                    className="h-8 text-xs px-3"
                                    onClick={() => setStatusFilter(s.value)}
                                >
                                    {s.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Dari:</label>
                            <Input
                                type="date"
                                className="h-8 text-xs w-36"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Sampai:</label>
                            <Input
                                type="date"
                                className="h-8 text-xs w-36"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                        {(dateFrom || dateTo || statusFilter !== "ALL") && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs text-muted-foreground"
                                onClick={() => { setStatusFilter("ALL"); setDateFrom(""); setDateTo(""); }}
                            >
                                Reset Filter
                            </Button>
                        )}
                    </div>
                </div>

                {/* Mobile Card Layout */}
                <div className="md:hidden space-y-3">
                    {isLoading ? (
                        <div className="text-center py-12 text-muted-foreground">Memuat pesanan...</div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">Tidak ada pesanan ditemukan.</div>
                    ) : (
                        filteredOrders.map((order) => (
                            <div key={order.id} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm space-y-2.5">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="font-semibold text-sm text-slate-900 truncate">{order.customer?.name}</div>
                                        <div className="text-[11px] text-muted-foreground">{order.customer?.phone || "-"}</div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        {getStatusBadge(order.status)}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {order.items?.slice(0, 4).map((item, idx) => (
                                        <div key={idx} className="h-8 w-8 rounded border bg-slate-100 flex items-center justify-center overflow-hidden">
                                            {item.product?.imageUrl ? (
                                                <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <Package className="h-3 w-3 text-slate-300" />
                                            )}
                                        </div>
                                    ))}
                                    {order.items && order.items.length > 4 && (
                                        <div className="h-8 w-8 rounded border bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                            +{order.items.length - 4}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-slate-900">{formatRupiah(order.totalAmount)}</span>
                                        <span className="text-[11px] text-muted-foreground">
                                            {format(new Date(order.createdAt), "dd MMM yyyy")}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-0.5">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDetailModal(order)}>
                                            <Eye className="h-3.5 w-3.5" />
                                        </Button>
                                        {order.status === "PENDING" && (
                                            <>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={() => handleAction(order.id, "accept")}>
                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleAction(order.id, "decline")}>
                                                    <XCircle className="h-3.5 w-3.5" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop Table Layout */}
                <div className="hidden md:block border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Pelanggan</TableHead>
                                <TableHead>Produk</TableHead>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Metode</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24">Memuat pesanan...</TableCell>
                                </TableRow>
                            ) : filteredOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">Tidak ada pesanan ditemukan.</TableCell>
                                </TableRow>
                            ) : (
                                filteredOrders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell>
                                            <div className="font-medium">{order.customer?.name}</div>
                                            <div className="text-xs text-muted-foreground">{order.customer?.phone || "-"}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex -space-x-2 overflow-hidden py-1">
                                                {order.items?.slice(0, 3).map((item, idx) => (
                                                    <div key={idx} className="inline-block h-8 w-8 rounded-md border-2 border-white bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm" title={item.product?.name}>
                                                        {item.product?.imageUrl ? (
                                                            <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full object-cover" />
                                                        ) : (
                                                            <Package className="h-3 w-3 text-slate-300" />
                                                        )}
                                                    </div>
                                                ))}
                                                {order.items && order.items.length > 3 && (
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-white bg-slate-100 text-[10px] font-bold text-slate-500 shadow-sm">
                                                        +{order.items.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(order.createdAt), "dd MMM yyyy")}
                                        </TableCell>
                                        <TableCell>
                                            {order.deliveryMethod === "PICKUP" ? (
                                                <Badge variant="outline">Ambil</Badge>
                                            ) : (
                                                <Badge variant="secondary">Diantar</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {formatRupiah(order.totalAmount)}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(order.status)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => openDetailModal(order)}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            {order.status === "PENDING" && (
                                                <>
                                                    <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700" onClick={() => handleAction(order.id, "accept")}>
                                                        <CheckCircle className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleAction(order.id, "decline")}>
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AuthLayout>
    );
}
