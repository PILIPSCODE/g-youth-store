import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const productRepository = {
    async findAll(params?: {
        categoryId?: string;
        search?: string;
        page?: number;
        limit?: number;
    }) {
        const { categoryId, search, page = 1, limit = 20 } = params || {};

        const where: Prisma.ProductWhereInput = {};
        if (categoryId) where.categoryId = categoryId;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { sku: { contains: search, mode: "insensitive" } },
            ];
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: { category: { select: { id: true, name: true } } },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.product.count({ where }),
        ]);

        return {
            products,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    },

    async findById(id: string) {
        return prisma.product.findUnique({
            where: { id },
            include: { category: { select: { id: true, name: true } } },
        });
    },

    async findBySku(sku: string) {
        return prisma.product.findUnique({ where: { sku } });
    },

    async create(data: Prisma.ProductCreateInput) {
        return prisma.product.create({
            data,
            include: { category: { select: { id: true, name: true } } },
        });
    },

    async update(id: string, data: Prisma.ProductUpdateInput) {
        return prisma.product.update({
            where: { id },
            data,
            include: { category: { select: { id: true, name: true } } },
        });
    },

    async delete(id: string) {
        return prisma.product.delete({ where: { id } });
    },

    async getLowStockProducts() {
        return prisma.product.findMany({
            where: {
                stock: { lte: prisma.product.fields.minStockAlert as unknown as number },
            },
            include: { category: { select: { id: true, name: true } } },
        });
    },

    async updateStock(id: string, quantity: number) {
        return prisma.product.update({
            where: { id },
            data: { stock: { decrement: quantity } },
        });
    },
};
