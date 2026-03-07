"use client";

import { useEffect, useState } from "react";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRupiah } from "@/lib/currency";
import { PlusCircle, Wallet } from "lucide-react";

export default function CapitalPage() {
    const [history, setHistory] = useState<any[]>([]);
    const [totalCapital, setTotalCapital] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");

    const fetchCapital = async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/capital");
            const data = await res.json();
            if (data.success) {
                setHistory(data.data.history);
                setTotalCapital(data.data.totalCapital);
            }
        } catch (error) {
            console.error("Error fetching capital data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCapital();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !description) return;

        try {
            setIsSubmitting(true);
            const res = await fetch("/api/capital", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: parseInt(amount.replace(/[^0-9]/g, "")),
                    description
                }),
            });

            const data = await res.json();
            if (data.success) {
                setAmount("");
                setDescription("");
                alert("Modal berhasil ditambahkan!");
                fetchCapital();
            } else {
                alert("Gagal menambahkan modal: " + data.error);
            }
        } catch (error) {
            console.error("Submit error:", error);
            alert("Terjadi kesalahan sistem.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^0-9]/g, "");
        setAmount(val);
    };

    return (
        <AuthLayout allowedRoles={["ADMIN"]}>
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manajemen Modal Usaha</h1>
                    <p className="text-muted-foreground mt-2">
                        Kelola dan catat penambahan modal untuk operasional dan pembelian stok.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="md:col-span-1 shadow-sm border-l-4 border-l-emerald-500">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Modal Usaha</CardTitle>
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <Wallet className="h-4 w-4 text-emerald-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {isLoading ? "..." : formatRupiah(totalCapital)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-2 shadow-sm">
                        <CardHeader>
                            <CardTitle>Tambah Modal Baru</CardTitle>
                            <CardDescription>Catat penambahan modal dari pemilik/investor.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="amount">Jumlah (Rp)</Label>
                                        <Input
                                            id="amount"
                                            placeholder="Contoh: 5000000"
                                            value={amount}
                                            onChange={handleAmountChange}
                                            required
                                        />
                                        <p className="text-xs text-muted-foreground min-h-[16px]">
                                            {amount ? formatRupiah(parseInt(amount)) : ""}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Deskripsi</Label>
                                        <Input
                                            id="description"
                                            placeholder="Contoh: Tambahan modal bulan ini"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            required
                                        />
                                        <p className="text-xs text-transparent min-h-[16px]">.</p>
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={isSubmitting || !amount || !description}>
                                        {isSubmitting ? "Menyimpan..." : (
                                            <>
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                Tambah Modal
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Riwayat Modal Usaha</CardTitle>
                        <CardDescription>Daftar semua penambahan modal yang pernah dilakukan.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center p-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-center p-8 text-muted-foreground">
                                Belum ada data modal yang dicatat.
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tanggal</TableHead>
                                            <TableHead>Deskripsi</TableHead>
                                            <TableHead className="text-right">Jumlah</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {history.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    {new Date(item.createdAt).toLocaleDateString("id-ID", {
                                                        day: "numeric",
                                                        month: "long",
                                                        year: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit"
                                                    })}
                                                </TableCell>
                                                <TableCell>{item.description}</TableCell>
                                                <TableCell className="text-right font-medium text-emerald-600">
                                                    +{formatRupiah(item.amount)}
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
