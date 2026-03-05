import { prisma } from "@/lib/prisma";
import { PaymentStatus, Prisma } from "@prisma/client";

export const transactionRepository = {
    async findAll(params?: {
        cashierId?: string;
        status?: PaymentStatus;
        startDate?: Date;
        endDate?: Date;
        page?: number;
        limit?: number;
    }) {
        const { cashierId, status, startDate, endDate, page = 1, limit = 20 } = params || {};

        const where: Prisma.TransactionWhereInput = {};
        if (cashierId) where.cashierId = cashierId;
        if (status) where.paymentStatus = status;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = startDate;
            if (endDate) where.createdAt.lte = endDate;
        }

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                include: {
                    cashier: { select: { id: true, name: true } },
                    items: true,
                    payments: true,
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.transaction.count({ where }),
        ]);

        return {
            transactions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    },

    async findById(id: string) {
        return prisma.transaction.findUnique({
            where: { id },
            include: {
                cashier: { select: { id: true, name: true } },
                items: { include: { product: { select: { id: true, name: true, sku: true } } } },
                payments: true,
            },
        });
    },

    async create(
        data: Prisma.TransactionCreateInput,
        items: { productId: string; productName: string; quantity: number; costPrice: number; sellingPrice: number }[],
        payments: { method: string; amount: number; referenceNumber?: string }[]
    ) {
        return prisma.$transaction(async (tx) => {
            // Validate stock and reduce
            for (const item of items) {
                const product = await tx.product.findUnique({ where: { id: item.productId } });
                if (!product) throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan`);
                if (product.stock < item.quantity) {
                    throw new Error(`Stok ${product.name} tidak mencukupi (tersedia: ${product.stock})`);
                }

                // Reduce stock
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } },
                });

                // Check low stock alert
                const updatedProduct = await tx.product.findUnique({ where: { id: item.productId } });
                if (updatedProduct && updatedProduct.stock <= updatedProduct.minStockAlert) {
                    await tx.notification.create({
                        data: {
                            title: "Stok Rendah",
                            message: `Stok ${updatedProduct.name} tinggal ${updatedProduct.stock} unit`,
                        },
                    });
                }
            }

            // Create transaction with items and payments
            const transaction = await tx.transaction.create({
                data: {
                    ...data,
                    items: {
                        create: items.map((item) => ({
                            productId: item.productId,
                            productName: item.productName,
                            quantity: item.quantity,
                            costPrice: item.costPrice,
                            sellingPrice: item.sellingPrice,
                            subtotal: item.sellingPrice * item.quantity,
                        })),
                    },
                    payments: {
                        create: payments.map((p) => ({
                            method: p.method as "CASH" | "QRIS" | "BANK_TRANSFER" | "E_WALLET",
                            amount: p.amount,
                            referenceNumber: p.referenceNumber,
                        })),
                    },
                },
                include: {
                    cashier: { select: { id: true, name: true } },
                    items: true,
                    payments: true,
                },
            });

            return transaction;
        });
    },

    async updateStatus(id: string, status: PaymentStatus) {
        return prisma.transaction.update({
            where: { id },
            data: { paymentStatus: status },
        });
    },
};
