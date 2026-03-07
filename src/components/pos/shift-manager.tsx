"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatRupiah } from "@/lib/currency";
import { Wallet, Settings, LogOut, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ShiftManager() {
    const { data: session } = useSession();
    const router = useRouter();

    const userId = (session?.user as any)?.id;
    const userRole = (session?.user as any)?.role;

    const [activeShift, setActiveShift] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [showOpenModal, setShowOpenModal] = useState(false);
    const [showManageModal, setShowManageModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);

    const [openingCash, setOpeningCash] = useState("");
    const [expenseAmount, setExpenseAmount] = useState("");
    const [expenseDesc, setExpenseDesc] = useState("");
    const [actualCash, setActualCash] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchShiftStatus = async () => {
        if (!userId) return;
        try {
            setIsLoading(true);
            const res = await fetch(`/api/cash-register?userId=${userId}`);
            const data = await res.json();

            if (data.success) {
                if (data.data) {
                    setActiveShift(data.data);
                    setShowOpenModal(false);
                } else {
                    setActiveShift(null);
                    // Only force shift opening for CASHIER role directly in POS views
                    setShowOpenModal(true);
                }
            }
        } catch (error) {
            console.error("Error fetching shift:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchShiftStatus();
        }
    }, [userId]);

    const handleOpenShift = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!openingCash) return;

        try {
            setIsSubmitting(true);
            const res = await fetch("/api/cash-register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    openingCash: parseInt(openingCash.replace(/[^0-9]/g, "")),
                }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success("Shift berhasil dibuka!");
                setOpeningCash("");
                fetchShiftStatus();
            } else {
                toast.error(data.error || "Gagal membuka shift");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRecordExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!expenseAmount || !expenseDesc || !activeShift) return;

        try {
            setIsSubmitting(true);
            const res = await fetch("/api/cash-expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    registerId: activeShift.id,
                    amount: parseInt(expenseAmount.replace(/[^0-9]/g, "")),
                    description: expenseDesc
                }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success("Pengeluaran berhasil dicatat!");
                setShowExpenseModal(false);
                setExpenseAmount("");
                setExpenseDesc("");
                fetchShiftStatus();
            } else {
                toast.error(data.error || "Gagal mencatat pengeluaran");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseShift = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!actualCash || !activeShift) return;

        try {
            setIsSubmitting(true);
            const res = await fetch("/api/cash-register", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    registerId: activeShift.id,
                    actualCash: parseInt(actualCash.replace(/[^0-9]/g, "")),
                }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success("Shift berhasil ditutup!");
                setShowCloseModal(false);
                setShowManageModal(false);
                setActualCash("");
                fetchShiftStatus();

                // Show summary alert?
                alert(`Shift Ditutup.\n\nKas Diharapkan: ${formatRupiah(data.data.expectedCash)}\nKas Aktual: ${formatRupiah(data.data.closingCash)}\nSelisih: ${formatRupiah(data.data.difference)}`);
            } else {
                toast.error(data.error || "Gagal menutup shift");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!userId) return null;
    if (isLoading) return null;

    return (
        <>
            {activeShift && (
                <div className="fixed bottom-6 right-6 z-40">
                    <Button
                        size="lg"
                        className="rounded-full shadow-lg gap-2"
                        onClick={() => setShowManageModal(true)}
                    >
                        <Wallet className="h-5 w-5" />
                        Atur Shift
                    </Button>
                </div>
            )}

            {/* Force Open Shift Modal */}
            <Dialog open={showOpenModal} onOpenChange={(open) => {
                // Only allow closing if admin, else force cashier to open shift to use POS
                if (!open && userRole === "ADMIN") setShowOpenModal(false);
            }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Buka Shift Kasir</DialogTitle>
                        <DialogDescription>
                            Masukkan jumlah uang kas awal (modal kembalian) yang ada di mesin kasir saat ini.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleOpenShift}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="openingCash">Uang Kas Awal (Rp)</Label>
                                <Input
                                    id="openingCash"
                                    type="text"
                                    placeholder="Contoh: 200000"
                                    value={openingCash}
                                    onChange={(e) => setOpeningCash(e.target.value.replace(/[^0-9]/g, ""))}
                                    required
                                />
                                <p className="text-sm text-muted-foreground h-5">
                                    {openingCash ? formatRupiah(parseInt(openingCash)) : ""}
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            {userRole === "ADMIN" ? (
                                <Button type="button" variant="outline" onClick={() => setShowOpenModal(false)}>Batal</Button>
                            ) : (
                                <Button type="button" variant="destructive" onClick={() => signOut({ callbackUrl: "/" })}>
                                    <LogOut className="mr-2 h-4 w-4" /> Keluar
                                </Button>
                            )}
                            <Button type="submit" disabled={isSubmitting || !openingCash}>
                                {isSubmitting ? "Menyimpan..." : "Buka Shift"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Manage Shift Modal */}
            <Dialog open={showManageModal} onOpenChange={setShowManageModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Kelola Shift Kasir</DialogTitle>
                        <DialogDescription>
                            Kas awal Anda: <strong className="text-black">{formatRupiah(activeShift?.openingCash || 0)}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Button variant="outline" className="justify-start h-14" onClick={() => { setShowManageModal(false); setShowExpenseModal(true); }}>
                            <ReceiptText className="mr-3 h-5 w-5 text-amber-500" />
                            <div className="text-left">
                                <div className="font-semibold">Catat Pengeluaran Kas</div>
                                <div className="text-xs text-muted-foreground">Beli kresek, galon, dll pake kas</div>
                            </div>
                        </Button>

                        <Button variant="outline" className="justify-start h-14" onClick={() => { setShowManageModal(false); setShowCloseModal(true); }}>
                            <LogOut className="mr-3 h-5 w-5 text-destructive" />
                            <div className="text-left">
                                <div className="font-semibold">Tutup Shift</div>
                                <div className="text-xs text-muted-foreground">Hitung kas dan rekap shift</div>
                            </div>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Expense Modal */}
            <Dialog open={showExpenseModal} onOpenChange={setShowExpenseModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Catat Pengeluaran Kas</DialogTitle>
                        <DialogDescription>Uang yang diambil dari laci mesin kasir.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRecordExpense}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="expenseAmount">Nominal (Rp)</Label>
                                <Input
                                    id="expenseAmount"
                                    value={expenseAmount}
                                    onChange={(e) => setExpenseAmount(e.target.value.replace(/[^0-9]/g, ""))}
                                    required
                                />
                                <p className="text-sm text-muted-foreground h-5 font-medium">
                                    {expenseAmount ? formatRupiah(parseInt(expenseAmount)) : ""}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="expenseDesc">Keterangan</Label>
                                <Textarea
                                    id="expenseDesc"
                                    placeholder="Contoh: Beli Kresek Hitam"
                                    value={expenseDesc}
                                    onChange={(e) => setExpenseDesc(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowExpenseModal(false)}>Batal</Button>
                            <Button type="submit" disabled={isSubmitting || !expenseAmount || !expenseDesc}>Simpan</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Close Shift Modal */}
            <Dialog open={showCloseModal} onOpenChange={setShowCloseModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Tutup Shift Kasir</DialogTitle>
                        <DialogDescription>
                            Hitung fisik uang tunai di laci mesin kasir Anda secara teliti.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCloseShift}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="actualCash">Total Kas Fisik (Rp)</Label>
                                <Input
                                    id="actualCash"
                                    className="text-lg font-bold"
                                    value={actualCash}
                                    onChange={(e) => setActualCash(e.target.value.replace(/[^0-9]/g, ""))}
                                    required
                                />
                                <p className="text-sm text-muted-foreground h-5 font-medium text-emerald-600">
                                    {actualCash ? formatRupiah(parseInt(actualCash)) : ""}
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowCloseModal(false)}>Batal</Button>
                            <Button type="submit" variant="destructive" disabled={isSubmitting || !actualCash}>
                                Tutup Shift Permanen
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
