import { transactionRepository } from "@/repositories/transaction.repository";
import { productRepository } from "@/repositories/product.repository";
import { activityLogRepository } from "@/repositories/activityLog.repository";
import { generateInvoiceNumber } from "@/lib/helpers";
import { PaymentStatus } from "@prisma/client";

interface CreateTransactionInput {
    cashierId: string;
    customerId?: string;
    discount?: number;
    tax?: number;
    items: {
        productId: string;
        quantity: number;
    }[];
    payments: {
        method: string;
        amount: number;
        referenceNumber?: string;
    }[];
}

export const transactionService = {
    async getAllTransactions(params?: {
        cashierId?: string;
        status?: PaymentStatus;
        startDate?: Date;
        endDate?: Date;
        page?: number;
        limit?: number;
    }) {
        return transactionRepository.findAll(params);
    },

    async getTransactionById(id: string) {
        const transaction = await transactionRepository.findById(id);
        if (!transaction) throw new Error("Transaksi tidak ditemukan");
        return transaction;
    },

    async createTransaction(input: CreateTransactionInput) {
        // Fetch product data for items
        const itemsWithProduct = await Promise.all(
            input.items.map(async (item) => {
                const product = await productRepository.findById(item.productId);
                if (!product) throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan`);
                if (product.stock < item.quantity) {
                    throw new Error(`Stok ${product.name} tidak mencukupi (tersedia: ${product.stock})`);
                }
                return {
                    productId: product.id,
                    productName: product.name,
                    quantity: item.quantity,
                    costPrice: product.costPrice,
                    sellingPrice: product.sellingPrice,
                };
            })
        );

        // Calculate totals
        const subtotal = itemsWithProduct.reduce(
            (sum, item) => sum + item.sellingPrice * item.quantity,
            0
        );
        const discount = input.discount ?? 0;
        const tax = input.tax ?? 0;
        const total = subtotal - discount + tax;

        // Validate payment total
        const paymentTotal = input.payments.reduce((sum, p) => sum + p.amount, 0);
        if (paymentTotal < total) {
            throw new Error(
                `Total pembayaran (${paymentTotal}) kurang dari total transaksi (${total})`
            );
        }

        const invoiceNumber = generateInvoiceNumber();

        const transaction = await transactionRepository.create(
            {
                invoiceNumber,
                cashier: { connect: { id: input.cashierId } },
                subtotal,
                discount,
                tax,
                total,
                paymentStatus: "PAID",
                ...(input.customerId ? { customerId: input.customerId } : {}),
            },
            itemsWithProduct,
            input.payments
        );

        // Log activity
        await activityLogRepository.create(input.cashierId, "CREATE_TRANSACTION", {
            transactionId: transaction.id,
            invoiceNumber,
            total,
            itemCount: input.items.length,
        });

        return transaction;
    },

    async cancelTransaction(id: string, userId: string) {
        const transaction = await transactionRepository.findById(id);
        if (!transaction) throw new Error("Transaksi tidak ditemukan");
        if (transaction.paymentStatus === "CANCELLED") {
            throw new Error("Transaksi sudah dibatalkan");
        }

        // Restore stock
        for (const item of transaction.items) {
            await productRepository.update(item.productId, {
                stock: { increment: item.quantity },
            });
        }

        const updated = await transactionRepository.updateStatus(id, "CANCELLED");

        await activityLogRepository.create(userId, "CANCEL_TRANSACTION", {
            transactionId: id,
            invoiceNumber: transaction.invoiceNumber,
        });

        return updated;
    },
};
