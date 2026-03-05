"use client";

import { useState, useEffect } from "react";
import { AuthLayout } from "@/components/layouts/auth-layout";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/currency";
import { format } from "date-fns";
import { toast } from "sonner";
import { Calendar, Receipt, CreditCard } from "lucide-react";

interface Transaction {
    id: string;
    invoiceNumber: string;
    total: number;
    paymentStatus: string;
    createdAt: string;
    payments: { method: string; amount: number }[];
    cashier: { name: string };
}

export default function PosTransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const res = await fetch("/api/transactions");
                const data = await res.json();
                if (data.success) {
                    setTransactions(data.data?.transactions || []);
                } else {
                    toast.error("Gagal memuat transaksi");
                }
            } catch (error) {
                toast.error("Terjadi kesalahan saat memuat data");
            } finally {
                setIsLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PAID":
                return <Badge className="bg-green-500 hover:bg-green-600">Lunas</Badge>;
            case "PENDING":
                return <Badge className="bg-amber-500 hover:bg-amber-600">Menunggu</Badge>;
            case "FAILED":
                return <Badge variant="destructive">Gagal</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    return (
        <AuthLayout allowedRoles={["ADMIN", "CASHIER"]}>
            <div className="flex flex-col gap-6 max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Riwayat Transaksi Kasir</h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Daftar semua transaksi yang dilakukan melalui kasir POS.
                        </p>
                    </div>
                </div>

                <div className="border rounded-md bg-white overflow-hidden shadow-sm">
                    {/* Desktop View */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead>Invoice</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Kasir</TableHead>
                                    <TableHead>Metode Bayar</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-32">
                                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-2"></div>
                                                Memuat transaksi...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : transactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                                            Belum ada transaksi di kasir.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    transactions.map((t) => (
                                        <TableRow key={t.id}>
                                            <TableCell className="font-medium text-primary">
                                                {t.invoiceNumber}
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(t.createdAt), "dd MMM yyyy, HH:mm")}
                                            </TableCell>
                                            <TableCell>{t.cashier?.name}</TableCell>
                                            <TableCell className="max-w-[150px] truncate">
                                                {t.payments?.map(p => p.method).join(", ") || "-"}
                                            </TableCell>
                                            <TableCell className="text-right font-bold">
                                                {formatRupiah(t.total)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {getStatusBadge(t.paymentStatus)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden">
                        {isLoading ? (
                            <div className="p-8 flex items-center justify-center flex-col text-muted-foreground">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                                <p>Memuat transaksi...</p>
                            </div>
                        ) : transactions.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                Belum ada transaksi di kasir.
                            </div>
                        ) : (
                            <div className="divide-y">
                                {transactions.map((t) => (
                                    <div key={t.id} className="p-4 flex flex-col gap-2 relative hover:bg-slate-50">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <Receipt className="h-4 w-4 text-primary" />
                                                <span className="font-semibold text-primary">{t.invoiceNumber}</span>
                                            </div>
                                            {getStatusBadge(t.paymentStatus)}
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                                            <span>{format(new Date(t.createdAt), "dd MMM yyyy, HH:mm")} • {t.cashier?.name}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <CreditCard className="h-3.5 w-3.5 shrink-0" />
                                            <span className="truncate">{t.payments?.map(p => p.method).join(", ") || "Belum ada metode bayar"}</span>
                                        </div>

                                        <div className="mt-2 text-right">
                                            <span className="font-bold text-lg">{formatRupiah(t.total)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
}
