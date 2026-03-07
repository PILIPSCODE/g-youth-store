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
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Image as ImageIcon } from "lucide-react";
import { formatRupiah } from "@/lib/currency";
import { toast } from "sonner";

interface Category {
    id: string;
    name: string;
}

interface Product {
    id: string;
    name: string;
    sku: string;
    costPrice: number;
    sellingPrice: number;
    stock: number;
    categoryId: string;
    category?: Category;
    imageUrl?: string;
    description?: string;
}

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        sku: "",
        costPrice: "",
        sellingPrice: "",
        stock: "",
        categoryId: "",
        imageUrl: "",
        description: "",
    });

    const fetchProducts = async () => {
        try {
            const res = await fetch("/api/products");
            const data = await res.json();
            setProducts(data.data?.products || []);
        } catch (error) {
            toast.error("Failed to load products");
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/categories");
            const data = await res.json();
            setCategories(data.data || []);
        } catch (error) {
            toast.error("Failed to load categories");
        }
    };

    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            await Promise.all([fetchProducts(), fetchCategories()]);
            setIsLoading(false);
        };
        init();
    }, []);

    const resetForm = () => {
        setFormData({
            name: "",
            sku: "",
            costPrice: "",
            sellingPrice: "",
            stock: "",
            categoryId: "",
            imageUrl: "",
            description: "",
        });
        setIsEditing(false);
        setCurrentId("");
    };

    const openEditModal = (product: Product) => {
        setFormData({
            name: product.name,
            sku: product.sku,
            costPrice: product.costPrice.toString(),
            sellingPrice: product.sellingPrice.toString(),
            stock: product.stock.toString(),
            categoryId: product.categoryId,
            imageUrl: product.imageUrl || "",
            description: product.description || "",
        });
        setCurrentId(product.id);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this product?")) return;

        try {
            const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Product deleted successfully");
                fetchProducts();
            } else {
                toast.error("Failed to delete product");
            }
        } catch (error) {
            toast.error("Something went wrong");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = isEditing ? `/api/products/${currentId}` : "/api/products";
        const method = isEditing ? "PUT" : "POST";
        setIsSubmitting(true);

        try {
            const payload = {
                ...formData,
                costPrice: Number(formData.costPrice),
                sellingPrice: Number(formData.sellingPrice),
                stock: Number(formData.stock),
            };
            if (!payload.imageUrl) delete (payload as any).imageUrl;

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast.success(isEditing ? "Product updated" : "Product created");
                setIsModalOpen(false);
                resetForm();
                fetchProducts();
            } else {
                const err = await res.json();
                toast.error(err.error || err.message || "Failed to save product");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredProducts = products.filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === "ALL" || p.categoryId === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <AuthLayout allowedRoles={["ADMIN"]}>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Produk</h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Kelola inventaris dan katalog produk Anda.
                        </p>
                    </div>

                    <Dialog open={isModalOpen} onOpenChange={(open) => {
                        setIsModalOpen(open);
                        if (!open) resetForm();
                    }}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Tambah Produk
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>{isEditing ? "Edit Produk" : "Tambah Produk Baru"}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Nama</label>
                                        <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">SKU</label>
                                        <Input required value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Harga Beli</label>
                                        <Input type="number" required value={formData.costPrice} onChange={e => setFormData({ ...formData, costPrice: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Harga Jual</label>
                                        <Input type="number" required value={formData.sellingPrice} onChange={e => setFormData({ ...formData, sellingPrice: e.target.value })} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Stok Awal</label>
                                        <Input type="number" required value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Kategori</label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            required
                                            value={formData.categoryId}
                                            onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                                        >
                                            <option value="">Pilih Kategori</option>
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">URL Gambar</label>
                                    <Input
                                        type="url"
                                        placeholder="https://example.com/image.jpg"
                                        value={formData.imageUrl}
                                        onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Deskripsi</label>
                                    <Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                </div>

                                <DialogFooter className="pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Batal</Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <>
                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
                                                Menyimpan...
                                            </>
                                        ) : (
                                            isEditing ? "Simpan Perubahan" : "Buat Produk"
                                        )}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 max-w-2xl">
                    <div className="relative flex-1 w-full sm:max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Cari nama atau SKU..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="w-full sm:w-64">
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="ALL">Semua Kategori</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Mobile Card Layout */}
                <div className="md:hidden space-y-3">
                    {isLoading ? (
                        <div className="text-center py-12 text-muted-foreground">Memuat produk...</div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">Produk tidak ditemukan.</div>
                    ) : (
                        filteredProducts.map((product) => (
                            <div key={product.id} className="bg-white border border-slate-200 rounded-lg p-3 flex gap-3 items-start shadow-sm">
                                <div className="w-14 h-14 rounded-md bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                    {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="font-semibold text-sm text-slate-900 truncate">{product.name}</div>
                                            <div className="text-[11px] text-muted-foreground">SKU: {product.sku}</div>
                                        </div>
                                        <div className="flex items-center gap-0.5 shrink-0">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditModal(product)}>
                                                <Edit className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDelete(product.id)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className="text-sm font-bold text-slate-900">{formatRupiah(product.sellingPrice)}</span>
                                        {product.stock <= 5 ? (
                                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{product.stock} Rendah</Badge>
                                        ) : (
                                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Stok: {product.stock}</Badge>
                                        )}
                                    </div>
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
                                <TableHead className="w-[60px]">Gambar</TableHead>
                                <TableHead>Info Produk</TableHead>
                                <TableHead>Kategori</TableHead>
                                <TableHead>Harga</TableHead>
                                <TableHead>Stok</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">Memuat produk...</TableCell>
                                </TableRow>
                            ) : filteredProducts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Produk tidak ditemukan.</TableCell>
                                </TableRow>
                            ) : (
                                filteredProducts.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell>
                                            {product.imageUrl ? (
                                                <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-md object-cover border" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center border">
                                                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{product.name}</div>
                                            <div className="text-xs text-muted-foreground">SKU: {product.sku}</div>
                                        </TableCell>
                                        <TableCell>{product.category?.name || "Tanpa Kategori"}</TableCell>
                                        <TableCell>
                                            <div className="text-sm">{formatRupiah(product.sellingPrice)}</div>
                                            <div className="text-xs text-muted-foreground">Beli: {formatRupiah(product.costPrice)}</div>
                                        </TableCell>
                                        <TableCell>
                                            {product.stock <= 5 ? (
                                                <Badge variant="destructive">{product.stock} (Rendah)</Badge>
                                            ) : (
                                                <Badge variant="secondary">{product.stock}</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => openEditModal(product)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(product.id)}>
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
