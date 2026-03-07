"use client";

import { useEffect, useState } from "react";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatRupiah } from "@/lib/currency";
import { PlusCircle, ShoppingCart, Trash2 } from "lucide-react";

export default function PurchasesPage() {
    const [history, setHistory] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [supplier, setSupplier] = useState("");
    const [purchaseItems, setPurchaseItems] = useState<{ productId: string, quantity: string, costPrice: string }[]>([]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [historyRes, productsRes] = await Promise.all([
                fetch("/api/purchases"),
                fetch("/api/products")
            ]);

            const historyData = await historyRes.json();
            const productsData = await productsRes.json();

            if (historyData.success) {
                setHistory(historyData.data);
            }
            if (productsData.success) {
                setProducts(productsData.data.products);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const totalCost = purchaseItems.reduce((sum, item) => {
        const q = parseInt(item.quantity || "0");
        const cp = parseInt(item.costPrice.replace(/[^0-9]/g, "") || "0");
        return sum + (q * cp);
    }, 0);

    const handleAddItem = () => {
        setPurchaseItems([...purchaseItems, { productId: "", quantity: "1", costPrice: "0" }]);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...purchaseItems];
        newItems.splice(index, 1);
        setPurchaseItems(newItems);
    };

    const handleItemChange = (index: number, field: string, value: string) => {
        const newItems = [...purchaseItems];
        if (field === 'costPrice') {
            value = value.replace(/[^0-9]/g, "");
        }
        newItems[index] = { ...newItems[index], [field]: value };

        // Auto-fill cost price if product changes
        if (field === 'productId') {
            const selectedProduct = products.find(p => p.id === value);
            if (selectedProduct) {
                newItems[index].costPrice = selectedProduct.costPrice.toString();
            }
        }

        setPurchaseItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supplier || purchaseItems.length === 0) return;

        // Validate items
        const invalidItems = purchaseItems.some(i => !i.productId || parseInt(i.quantity) <= 0 || parseInt(i.costPrice) <= 0);
        if (invalidItems) {
            alert("Mohon lengkapi semua data barang dengan benar.");
            return;
        }

        try {
            setIsSubmitting(true);
            const res = await fetch("/api/purchases", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    supplier,
                    totalCost,
                    items: purchaseItems.map(item => ({
                        productId: item.productId,
                        quantity: parseInt(item.quantity),
                        costPrice: parseInt(item.costPrice)
                    }))
                }),
            });

            const data = await res.json();
            if (data.success) {
                setSupplier("");
                setPurchaseItems([]);
                alert("Pembelian stok berhasil disimpan!");
                fetchData();
            } else {
                alert("Gagal menyimpan pembelian: " + data.error);
            }
        } catch (error) {
            console.error("Submit error:", error);
            alert("Terjadi kesalahan sistem.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthLayout allowedRoles={["ADMIN"]}>
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pembelian Stok</h1>
                    <p className="text-muted-foreground mt-2">
                        Catat belanja barang dari supplier untuk menambah stok inventory.
                    </p>
                </div>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Catat Pembelian Baru</CardTitle>
                        <CardDescription>Masukkan detail supplier dan barang yang dibeli.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2 max-w-sm">
                                <Label htmlFor="supplier">Nama Supplier / Pemasok</Label>
                                <Input
                                    id="supplier"
                                    placeholder="Contoh: PT ABC atau Toko Makmur"
                                    value={supplier}
                                    onChange={(e) => setSupplier(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-medium">Daftar Barang</h3>
                                    <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                                        <PlusCircle className="h-4 w-4 mr-2" />
                                        Tambah Barang
                                    </Button>
                                </div>

                                {purchaseItems.length === 0 ? (
                                    <div className="text-center p-6 border rounded-md text-slate-500 bg-slate-50 text-sm">
                                        Belum ada barang ditambahkan. Klik tombol "Tambah Barang".
                                    </div>
                                ) : (
                                    <div className="border rounded-md divide-y">
                                        {purchaseItems.map((item, index) => (
                                            <div key={index} className="p-4 grid grid-cols-12 gap-4 items-end">
                                                <div className="col-span-12 md:col-span-5 space-y-2">
                                                    <Label>Pilih Produk</Label>
                                                    <Select
                                                        value={item.productId}
                                                        onValueChange={(val) => handleItemChange(index, 'productId', val)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Pilih produk..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {products.map(p => (
                                                                <SelectItem key={p.id} value={p.id}>
                                                                    {p.name} (Stok: {p.stock})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="col-span-6 md:col-span-2 space-y-2">
                                                    <Label>Quantity</Label>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="col-span-6 md:col-span-3 space-y-2">
                                                    <Label>Harga Beli Satuan (Rp)</Label>
                                                    <Input
                                                        value={item.costPrice}
                                                        onChange={(e) => handleItemChange(index, 'costPrice', e.target.value)}
                                                        required
                                                    />
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {formatRupiah(parseInt(item.costPrice || "0"))}
                                                    </p>
                                                </div>
                                                <div className="col-span-12 md:col-span-2 flex justify-end">
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        onClick={() => handleRemoveItem(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {purchaseItems.length > 0 && (
                                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-md border">
                                        <span className="font-semibold text-slate-700">Total Pembelian:</span>
                                        <span className="text-xl font-bold text-slate-900">{formatRupiah(totalCost)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end pt-4 border-t">
                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={isSubmitting || !supplier || purchaseItems.length === 0}
                                >
                                    {isSubmitting ? "Menyimpan..." : (
                                        <>
                                            <ShoppingCart className="mr-2 h-5 w-5" />
                                            Simpan Pembelian
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Riwayat Pembelian Stok</CardTitle>
                        <CardDescription>Daftar pembelian barang yang sudah dicatat sebelumnya.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center p-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-center p-8 text-muted-foreground">
                                Belum ada riwayat pembelian.
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tanggal</TableHead>
                                            <TableHead>Supplier</TableHead>
                                            <TableHead>Item Beli</TableHead>
                                            <TableHead className="text-right">Total Biaya</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {history.map((purchase) => (
                                            <TableRow key={purchase.id}>
                                                <TableCell>
                                                    {new Date(purchase.createdAt).toLocaleDateString("id-ID", {
                                                        day: "numeric",
                                                        month: "short",
                                                        year: "numeric",
                                                    })}
                                                </TableCell>
                                                <TableCell className="font-medium">{purchase.supplier}</TableCell>
                                                <TableCell>
                                                    <ul className="text-sm text-slate-600 list-disc list-inside">
                                                        {purchase.items?.map((item: any, i: number) => (
                                                            <li key={i}>{item.product?.name} ({item.quantity}x)</li>
                                                        ))}
                                                    </ul>
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-slate-900">
                                                    {formatRupiah(purchase.totalCost)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AuthLayout>
    );
}
