import { productRepository } from "@/repositories/product.repository";
import { activityLogRepository } from "@/repositories/activityLog.repository";

export const productService = {
    async getAllProducts(params?: {
        categoryId?: string;
        search?: string;
        page?: number;
        limit?: number;
    }) {
        return productRepository.findAll(params);
    },

    async getProductById(id: string) {
        const product = await productRepository.findById(id);
        if (!product) throw new Error("Produk tidak ditemukan");
        return product;
    },

    async createProduct(
        data: {
            name: string;
            sku: string;
            categoryId: string;
            costPrice: number;
            sellingPrice: number;
            stock?: number;
            minStockAlert?: number;
            imageUrl?: string;
        },
        adminId: string
    ) {
        const existingSku = await productRepository.findBySku(data.sku);
        if (existingSku) throw new Error("SKU sudah digunakan");

        const product = await productRepository.create({
            name: data.name,
            sku: data.sku,
            category: { connect: { id: data.categoryId } },
            costPrice: data.costPrice,
            sellingPrice: data.sellingPrice,
            stock: data.stock ?? 0,
            minStockAlert: data.minStockAlert ?? 5,
            imageUrl: data.imageUrl,
        });

        await activityLogRepository.create(adminId, "CREATE_PRODUCT", {
            productId: product.id,
            productName: product.name,
        });

        return product;
    },

    async updateProduct(
        id: string,
        data: {
            name?: string;
            sku?: string;
            categoryId?: string;
            costPrice?: number;
            sellingPrice?: number;
            stock?: number;
            minStockAlert?: number;
            imageUrl?: string;
        },
        adminId: string
    ) {
        if (data.sku) {
            const existingSku = await productRepository.findBySku(data.sku);
            if (existingSku && existingSku.id !== id) throw new Error("SKU sudah digunakan");
        }

        const updateData: Record<string, unknown> = { ...data };
        if (data.categoryId) {
            updateData.category = { connect: { id: data.categoryId } };
            delete updateData.categoryId;
        }

        const product = await productRepository.update(id, updateData);

        await activityLogRepository.create(adminId, "UPDATE_PRODUCT", {
            productId: id,
            changes: Object.keys(data),
        });

        return product;
    },

    async deleteProduct(id: string, adminId: string) {
        const product = await productRepository.findById(id);
        if (!product) throw new Error("Produk tidak ditemukan");

        await productRepository.delete(id);

        await activityLogRepository.create(adminId, "DELETE_PRODUCT", {
            productId: id,
            productName: product.name,
        });

        return product;
    },
};
