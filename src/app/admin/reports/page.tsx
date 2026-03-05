"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileSpreadsheet } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function AdminReportsPage() {
    const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-01"));
    const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [cashierId, setCashierId] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("");
    const [statusFilter, setStatusFilter] = useState("PAID");
    const [cashiers, setCashiers] = useState<{ id: string; name: string }[]>([]);

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
                        Buat dan unduh laporan transaksi.
                    </p>
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
                                Ekspor ke Excel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AuthLayout>
    );
}
