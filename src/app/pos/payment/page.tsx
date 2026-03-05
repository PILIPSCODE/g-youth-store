"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRupiah } from "@/lib/currency";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, CheckCircle2 } from "lucide-react";

type PaymentMethod = "CASH" | "QRIS" | "BANK_TRANSFER" | "E_WALLET";

interface PaymentEntry {
    method: PaymentMethod;
    amount: number;
}

export default function PaymentPage() {
    const router = useRouter();
    const { cart, clearCart } = useAppStore();
    const [payments, setPayments] = useState<PaymentEntry[]>([{ method: "CASH", amount: 0 }]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Redirect to POS if cart is empty
    useEffect(() => {
        if (cart.length === 0 && !isSubmitting) {
            router.push("/pos");
        }
    }, [cart.length, router, isSubmitting]);

    const subtotal = cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
    const totalAmount = subtotal;

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = totalAmount - totalPaid;
    const change = totalPaid > totalAmount ? totalPaid - totalAmount : 0;

    // Can submit if exact amount or using cash and paid > total (needs change)
    const canSubmit = totalPaid >= totalAmount &&
        (totalPaid === totalAmount || payments.some(p => p.method === "CASH"));

    const updatePayment = (index: number, field: keyof PaymentEntry, value: any) => {
        const newPayments = [...payments];
        newPayments[index] = { ...newPayments[index], [field]: value };
        setPayments(newPayments);
    };

    const addPaymentMethod = () => {
        if (payments.length >= 4) return toast.error("Maximum 4 payment methods allowed");
        setPayments([...payments, { method: "QRIS", amount: remaining > 0 ? remaining : 0 }]);
    };

    const removePaymentMethod = (index: number) => {
        if (payments.length <= 1) return toast.error("Must have at least one payment method");
        const newPayments = [...payments];
        newPayments.splice(index, 1);
        setPayments(newPayments);
    };

    const handleCheckout = async () => {
        if (!canSubmit) return toast.error("Payment amount does not match total");
        setIsSubmitting(true);

        try {

            const payload = {
                items: cart.map((item) => ({
                    productId: item.id,
                    quantity: item.quantity,
                    price: item.sellingPrice,
                })),
                payments: payments.map(p => ({
                    method: p.method,
                    amount: p.amount
                }))
            };

            const res = await fetch("/api/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast.success("Transaction completed successfully!");
                clearCart();
                router.push("/pos");
            } else {
                const error = await res.json();
                toast.error(error.message || "Checkout failed");
                setIsSubmitting(false);
            }
        } catch (err) {
            toast.error("Something went wrong");
            setIsSubmitting(false);
        }
    };

    if (cart.length === 0 && !isSubmitting) return null;

    return (
        <AuthLayout allowedRoles={["ADMIN", "CASHIER"]}>
            <div className="max-w-4xl mx-auto flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.push("/pos")}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Pembayaran</h1>
                        <p className="text-muted-foreground mt-1">Transaksi saat ini</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Summary Card */}
                    <Card className="bg-slate-50 border-none shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg text-muted-foreground font-medium">Total Order</CardTitle>
                            <div className="text-5xl font-black text-primary truncate py-2">
                                {formatRupiah(totalAmount)}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 pt-4 border-t border-slate-200">
                                <div className="flex justify-between text-muted-foreground pt-3 border-t border-slate-200">
                                    <span>Subtotal ({cart.length} items)</span>
                                    <span>{formatRupiah(subtotal)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Input */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Metode Pembayaran</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                {payments.map((p, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <select
                                            className="h-11 rounded-md border border-input bg-background px-3 py-2 text-sm max-w-[140px]"
                                            value={p.method}
                                            onChange={(e) => updatePayment(idx, "method", e.target.value)}
                                        >
                                            <option value="CASH">Cash</option>
                                            <option value="QRIS">QRIS</option>
                                            <option value="BANK_TRANSFER">Transfer</option>
                                            <option value="E_WALLET">E-Wallet</option>
                                        </select>

                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-2.5 text-muted-foreground font-medium">Rp</span>
                                            <Input
                                                type="number"
                                                className="pl-10 h-11 text-lg font-medium"
                                                value={p.amount || ""}
                                                onChange={(e) => updatePayment(idx, "amount", parseFloat(e.target.value) || 0)}
                                                placeholder="0"
                                                onFocus={(e) => e.target.select()}
                                            />
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive h-11 w-11 shrink-0"
                                            onClick={() => removePaymentMethod(idx)}
                                            disabled={payments.length === 1}
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            {remaining > 0 && payments.length < 4 && (
                                <Button variant="outline" className="w-full border-dashed" onClick={addPaymentMethod}>
                                    <Plus className="mr-2 h-4 w-4" /> Tambah Metode Pembayaran Terpisah
                                </Button>
                            )}

                            <div className="pt-6 border-t space-y-3">
                                <div className="flex justify-between text-lg font-medium">
                                    <span className="text-muted-foreground">Total Dibayar</span>
                                    <span>{formatRupiah(totalPaid)}</span>
                                </div>

                                {remaining > 0 ? (
                                    <div className="flex justify-between text-lg text-destructive font-bold">
                                        <span>Saldo yang Harus Dibayar</span>
                                        <span>{formatRupiah(remaining)}</span>
                                    </div>
                                ) : change > 0 ? (
                                    <div className="flex justify-between text-xl text-green-600 font-bold bg-green-50 p-3 rounded-lg">
                                        <span>Kembalian</span>
                                        <span>{formatRupiah(change)}</span>
                                    </div>
                                ) : (
                                    <div className="flex justify-between text-xl text-green-600 font-bold bg-green-50 p-3 rounded-lg">
                                        <span>Lunas</span>
                                        <CheckCircle2 className="h-6 w-6" />
                                    </div>
                                )}
                            </div>

                            <Button
                                size="lg"
                                className="w-full h-14 text-lg font-bold mt-6"
                                disabled={!canSubmit || isSubmitting}
                                onClick={handleCheckout}
                            >
                                {isSubmitting ? "Processing..." : "Complete Transaction"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthLayout>
    );
}
