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
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Search, Edit, Trash2, FolderTree } from "lucide-react";
import { toast } from "sonner";

interface Category {
    id: string;
    name: string;
    createdAt: string;
}

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState("");
    const [formData, setFormData] = useState({
        name: "",
    });

    const fetchCategories = async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/categories");
            const data = await res.json();
            setCategories(data.data || []);
        } catch (error) {
            toast.error("Gagal memuat kategori");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const resetForm = () => {
        setFormData({ name: "" });
        setIsEditing(false);
        setCurrentId("");
    };

    const openEditModal = (category: Category) => {
        setFormData({ name: category.name });
        setCurrentId(category.id);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus kategori "${name}"? Semua produk dengan kategori ini mungkin perlu diperbarui.`)) return;

        try {
            const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Kategori berhasil dihapus");
                fetchCategories();
            } else {
                const err = await res.json();
                toast.error(err.error || err.message || "Gagal menghapus kategori");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan pada sistem");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = isEditing ? `/api/categories/${currentId}` : "/api/categories";
        const method = isEditing ? "PUT" : "POST";
        setIsSubmitting(true);

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast.success(isEditing ? "Kategori diperbarui" : "Kategori dibuat");
                setIsModalOpen(false);
                resetForm();
                fetchCategories();
            } else {
                const err = await res.json();
                toast.error(err.error || err.message || "Gagal menyimpan kategori");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan pada sistem");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredCategories = categories.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AuthLayout allowedRoles={["ADMIN"]}>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Kategori Produk</h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Kelola kategori atau jenis-jenis barang toko Anda.
                        </p>
                    </div>

                    <Dialog open={isModalOpen} onOpenChange={(open) => {
                        setIsModalOpen(open);
                        if (!open) resetForm();
                    }}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Tambah Kategori
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>{isEditing ? "Edit Kategori" : "Tambah Kategori Baru"}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nama Kategori</label>
                                    <Input
                                        required
                                        placeholder="Contoh: Makanan Ringan"
                                        value={formData.name}
                                        onChange={e => setFormData({ name: e.target.value })}
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <DialogFooter className="pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Batal</Button>
                                    <Button type="submit" disabled={isSubmitting || !formData.name.trim()}>
                                        {isSubmitting ? "Menyimpan..." : (isEditing ? "Simpan Perubahan" : "Buat Kategori")}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="flex items-center gap-2 max-w-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Cari nama kategori..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Mobile Card Layout */}
                <div className="md:hidden space-y-3">
                    {isLoading ? (
                        <div className="text-center py-12 text-muted-foreground">Memuat kategori...</div>
                    ) : filteredCategories.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">Kategori tidak ditemukan.</div>
                    ) : (
                        filteredCategories.map((category) => (
                            <div key={category.id} className="bg-white border border-slate-200 rounded-lg p-4 flex gap-3 items-center shadow-sm">
                                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center">
                                    <FolderTree className="h-5 w-5 text-slate-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-sm text-slate-900 truncate">{category.name}</div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditModal(category)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(category.id, category.name)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
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
                                <TableHead className="w-[100px] text-center">Ikon</TableHead>
                                <TableHead>Nama Kategori</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24">Memuat kategori...</TableCell>
                                </TableRow>
                            ) : filteredCategories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">Kategori tidak ditemukan.</TableCell>
                                </TableRow>
                            ) : (
                                filteredCategories.map((category) => (
                                    <TableRow key={category.id}>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border">
                                                    <FolderTree className="h-4 w-4 text-slate-500" />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-slate-900">{category.name}</div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => openEditModal(category)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(category.id, category.name)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
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
