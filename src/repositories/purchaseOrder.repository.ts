import { prisma } from "@/lib/prisma";
import { POStatus, Prisma } from "@prisma/client";

export const purchaseOrderRepository = {
    async findAll(params?: {
        status?: POStatus;
        page?: number;
        limit?: number;
    }) {
        const { status, page = 1, limit = 20 } = params || {};

        const where: Prisma.PurchaseOrderWhereInput = {};
        if (status) where.status = status;

        const [orders, total] = await Promise.all([
            prisma.purchaseOrder.findMany({
                where,
                include: {
                    customer: true,
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    sku: true,
                                    sellingPrice: true,
                                    imageUrl: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.purchaseOrder.count({ where }),
        ]);

        return {
            orders,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    },

    async findById(id: string) {
        return prisma.purchaseOrder.findUnique({
            where: { id },
            include: {
                customer: true,
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                sku: true,
                                sellingPrice: true,
                                costPrice: true,
                                stock: true,
                                imageUrl: true,
                            },
                        },
                    },
                },
            },
        });
    },

    async create(
        customerData: { name: string; phone: string; address?: string },
        items: { productId: string; quantity: number; price: number }[],
        deliveryMethod: "PICKUP" | "DELIVERY"
    ) {
        const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        return prisma.purchaseOrder.create({
            data: {
                customer: {
                    create: customerData,
                },
                deliveryMethod,
                totalAmount,
                items: {
                    create: items.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price,
                    })),
                },
            },
            include: {
                customer: true,
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                imageUrl: true,
                            },
                        },
                    },
                },
            },
        });
    },

    async updateStatus(id: string, status: POStatus) {
        return prisma.purchaseOrder.update({
            where: { id },
            data: { status },
        });
    },
};
