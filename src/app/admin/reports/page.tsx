"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileSpreadsheet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatRupiah } from "@/lib/currency";

export default function AdminReportsPage() {
    const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-01"));
    const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [cashierId, setCashierId] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("");
    const [statusFilter, setStatusFilter] = useState("PAID");
    const [cashiers, setCashiers] = useState<{ id: string; name: string }[]>([]);
    const [financialData, setFinancialData] = useState<any>(null);
    const [isLoadingFinancials, setIsLoadingFinancials] = useState(false);

    useEffect(() => {
        const fetchCashiers = async () => {
            try {
                const res = await fetch("/api/users");
                const data = await res.json();
                if (data.data) {
                    setCashiers(data.data.filter((u: any) => u.role === "CASHIER" || u.role === "ADMIN"));
                }
            } catch (error) {
                console.error("Failed to fetch cashiers");
            }
        };
        fetchCashiers();
    }, []);

    useEffect(() => {
        const fetchFinancials = async () => {
            setIsLoadingFinancials(true);
            try {
                const params = new URLSearchParams();
                if (startDate) params.append("startDate", startDate);
                if (endDate) params.append("endDate", endDate);

                const res = await fetch(`/api/reports/financial?${params.toString()}`);
                const data = await res.json();

                if (data.success) {
                    setFinancialData(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch financial reports");
            } finally {
                setIsLoadingFinancials(false);
            }
        };
        fetchFinancials();
    }, [startDate, endDate]);

    const handleExport = (type: "excel") => {
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        if (cashierId && cashierId !== "ALL") params.append("cashierId", cashierId);
        if (paymentMethod && paymentMethod !== "ALL") params.append("paymentMethod", paymentMethod);
        if (statusFilter && statusFilter !== "ALL") params.append("status", statusFilter);

        const url = `/api/export/${type}?${params.toString()}`;
        window.open(url, "_blank");
    };

    return (
        <AuthLayout allowedRoles={["ADMIN"]}>
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Laporan</h1>
                    <p className="text-muted-foreground mt-2">
                        Ringkasan finansial dan unduh laporan transaksi.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="border-l-4 border-l-blue-500 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Laporan Penjualan & Laba</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 mt-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Total Penjualan:</span>
                                    <span className="font-semibold">{financialData ? formatRupiah(financialData.salesReport.totalSales) : "..."}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Total HPP (Modal Barang):</span>
                                    <span className="font-semibold text-rose-600">-{financialData ? formatRupiah(financialData.salesReport.totalCOGS) : "..."}</span>
                                </div>
                                <div className="border-t pt-2 flex justify-between font-bold text-base mt-2">
                                    <span>Laba Bersih:</span>
                                    <span className="text-emerald-600">{financialData ? formatRupiah(financialData.salesReport.profit) : "..."}</span>
                                </div>
                                <div className="border-t mt-4 pt-2 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Nilai Inventaris (Modal):</span>
                                        <span className="font-medium text-amber-600">{financialData ? formatRupiah(financialData.salesReport.totalInventoryValue) : "..."}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Potensi Laba (Unrealized):</span>
                                        <span className="font-semibold text-emerald-600">{financialData ? formatRupiah(financialData.salesReport.unrealizedProfit) : "..."}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-base border-t mt-2 pt-2">
                                        <span>Total Aset Fisik & Barang:</span>
                                        <span className="text-blue-600">{financialData ? formatRupiah(financialData.salesReport.totalAssetValue) : "..."}</span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground leading-tight mt-1">
                                        * Total Aset = Kas Aktual Laci + Modal Inventaris + Potensi Laba (Estimasi jika semua barang terjual).
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-amber-500 shadow-sm md:col-span-2">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Laporan Arus Kas Laci (Tutup Shift)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Total Kas Awal:</span>
                                        <span className="font-medium">{financialData ? formatRupiah(financialData.cashReport.totalOpeningCash) : "..."}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Penjualan Tunai:</span>
                                        <span className="font-medium text-emerald-600">+{financialData ? formatRupiah(financialData.cashReport.totalCashSales) : "..."}</span>
                                    </div>
                                    <div className="flex justify-between text-sm border-b pb-2">
                                        <span className="text-muted-foreground">Pengeluaran Kas:</span>
                                        <span className="font-medium text-rose-600">-{financialData ? formatRupiah(financialData.cashReport.totalExpenses) : "..."}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-semibold pt-1">
                                        <span>Kas Diharapkan:</span>
                                        <span>{financialData ? formatRupiah(financialData.cashReport.totalExpectedCash) : "..."}</span>
                                    </div>
                                </div>
                                <div className="space-y-2 sm:border-l sm:pl-4">
                                    <div className="flex justify-between text-sm mt-8 sm:mt-0 font-semibold">
                                        <span>Kas Aktual (Fisik Laci):</span>
                                        <span>{financialData ? formatRupiah(financialData.cashReport.totalClosingCash) : "..."}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Selisih Kas:</span>
                                        <span className={`font-bold ${financialData && financialData.cashReport.totalDifference < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                            {financialData ? formatRupiah(financialData.cashReport.totalDifference) : "..."}
                                        </span>
                                    </div>
                                    {financialData && financialData.cashReport.totalDifference < 0 && (
                                        <p className="text-[10px] text-rose-500 leading-tight">
                                            * Terdapat selisih minus, kemungkinan ada kesalahan input atau uang hilang di laci kasir.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Filter Laporan</CardTitle>
                        <CardDescription>
                            Pilih kriteria untuk laporan yang ingin Anda buat.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 items-end">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tanggal Mulai</label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tanggal Akhir</label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Kasir</label>
                                <Select value={cashierId} onValueChange={setCashierId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua Kasir" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Semua Kasir</SelectItem>
                                        {cashiers.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Metode Pembayaran</label>
                                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua Metode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Semua Metode</SelectItem>
                                        <SelectItem value="CASH">Tunai</SelectItem>
                                        <SelectItem value="QRIS">QRIS</SelectItem>
                                        <SelectItem value="BANK_TRANSFER">Transfer Bank</SelectItem>
                                        <SelectItem value="E_WALLET">E-Wallet</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Status Pembayaran</label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Semua Status</SelectItem>
                                        <SelectItem value="PAID">Lunas</SelectItem>
                                        <SelectItem value="PENDING">Menunggu</SelectItem>
                                        <SelectItem value="FAILED">Gagal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col sm:flex-row gap-4">
                            <Button onClick={() => handleExport("excel")} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                Ekspor Semua Trx ke Excel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AuthLayout>
    );
}
