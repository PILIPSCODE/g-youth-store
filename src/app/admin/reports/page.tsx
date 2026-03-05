"use client";

import { useState } from "react";
import { format } from "date-fns";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function AdminReportsPage() {
    const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-01"));
    const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [cashierId, setCashierId] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("");

    const handleExport = (type: "excel" | "pdf") => {
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        if (cashierId && cashierId !== "ALL") params.append("cashierId", cashierId);
        if (paymentMethod && paymentMethod !== "ALL") params.append("paymentMethod", paymentMethod);

        const url = `/api/export/${type}?${params.toString()}`;
        window.open(url, "_blank");
    };

    return (
        <AuthLayout>
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                    <p className="text-muted-foreground mt-2">
                        Generate and export transaction reports.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Report Filters</CardTitle>
                        <CardDescription>
                            Select criteria for the report you want to generate.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 items-end">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Start Date</label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">End Date</label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Cashier</label>
                                <Select value={cashierId} onValueChange={setCashierId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Cashiers" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Cashiers</SelectItem>
                                        {/* These would be fetched from /api/users dynamically */}
                                        <SelectItem value="cm7wnp0u10000a6e0cbfp5i6p">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Payment Method</label>
                                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Methods" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Methods</SelectItem>
                                        <SelectItem value="CASH">Cash</SelectItem>
                                        <SelectItem value="QRIS">QRIS</SelectItem>
                                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                                        <SelectItem value="E_WALLET">E-Wallet</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col sm:flex-row gap-4">
                            <Button onClick={() => handleExport("excel")} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                Export to Excel
                            </Button>
                            <Button onClick={() => handleExport("pdf")} className="w-full sm:w-auto bg-red-600 hover:bg-red-700">
                                <FileText className="mr-2 h-4 w-4" />
                                Export to PDF
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AuthLayout>
    );
}
