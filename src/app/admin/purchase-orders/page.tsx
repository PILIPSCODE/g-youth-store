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
import { Search, Eye, CheckCircle, XCircle, Package } from "lucide-react";
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
            toast.error("Failed to load purchase orders");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleAction = async (id: string, action: "accept" | "decline") => {
        if (!confirm(`Are you sure you want to ${action} this order?`)) return;

        try {
            const res = await fetch(`/api/purchase-orders/${id}/${action}`, {
                method: "POST",
            });

            if (res.ok) {
                toast.success(`Order ${action}ed successfully`);
                if (isModalOpen) setIsModalOpen(false);
                fetchOrders();
            } else {
                const err = await res.json();
                toast.error(err.message || `Failed to ${action} order`);
            }
        } catch (error) {
            toast.error("Something went wrong");
        }
    };

    const openDetailModal = (order: PurchaseOrder) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const filteredOrders = orders.filter((o) =>
        o.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
        o.id.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <Badge className="bg-amber-500 hover:bg-amber-600">Pending</Badge>;
            case "ACCEPTED":
                return <Badge className="bg-green-500 hover:bg-green-600">Accepted</Badge>;
            case "DECLINED":
                return <Badge variant="destructive">Declined</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    return (
        <AuthLayout>
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage incoming purchase orders from public storefront.
                    </p>
                </div>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Order Details</DialogTitle>
                        </DialogHeader>

                        {selectedOrder && (
                            <div className="space-y-6 py-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="font-semibold text-muted-foreground">Customer</p>
                                        <p>{selectedOrder.customer?.name}</p>
                                        <p>{selectedOrder.customer?.phone || "No Phone"}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-muted-foreground">Order Info</p>
                                        <p>Date: {format(new Date(selectedOrder.createdAt), "dd MMM yyyy HH:mm")}</p>
                                        <p>Method: {selectedOrder.deliveryMethod}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-muted-foreground">Status:</span>
                                            {getStatusBadge(selectedOrder.status)}
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="font-semibold text-muted-foreground">Address</p>
                                        <p>{selectedOrder.customer?.address || "Pickup at store"}</p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-semibold mb-2">Order Items</h4>
                                    <div className="border rounded-md">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-12"></TableHead>
                                                    <TableHead>Product</TableHead>
                                                    <TableHead className="text-right">Qty</TableHead>
                                                    <TableHead className="text-right">Price</TableHead>
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
                                                        <TableCell>{item.product?.name || "Unknown Product"}</TableCell>
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
                                            <XCircle className="mr-2 h-4 w-4" /> Decline
                                        </Button>
                                        <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleAction(selectedOrder.id, "accept")}>
                                            <CheckCircle className="mr-2 h-4 w-4" /> Accept Order
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                <div className="flex items-center gap-2 max-w-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by customer name..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Products</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Total Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24">Loading orders...</TableCell>
                                </TableRow>
                            ) : filteredOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">No purchase orders found.</TableCell>
                                </TableRow>
                            ) : (
                                filteredOrders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell>
                                            <div className="font-medium">{order.customer?.name}</div>
                                            <div className="text-xs text-muted-foreground">{order.customer?.phone || "N/A"}</div>
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
                                                <Badge variant="outline">Pickup</Badge>
                                            ) : (
                                                <Badge variant="secondary">Delivery</Badge>
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
