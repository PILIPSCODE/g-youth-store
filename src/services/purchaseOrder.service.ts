import { purchaseOrderRepository } from "@/repositories/purchaseOrder.repository";
import { transactionRepository } from "@/repositories/transaction.repository";
import { activityLogRepository } from "@/repositories/activityLog.repository";
import { generateInvoiceNumber } from "@/lib/helpers";
import { POStatus } from "@prisma/client";

export const purchaseOrderService = {
    async getAllOrders(params?: {
        status?: POStatus;
        page?: number;
        limit?: number;
    }) {
        return purchaseOrderRepository.findAll(params);
    },

    async getOrderById(id: string) {
        const order = await purchaseOrderRepository.findById(id);
        if (!order) throw new Error("Purchase Order tidak ditemukan");
        return order;
    },

    async createOrder(data: {
        customer: { name: string; phone: string; address?: string };
        items: { productId: string; quantity: number; price: number }[];
        deliveryMethod: "PICKUP" | "DELIVERY";
    }) {
        return purchaseOrderRepository.create(
            data.customer,
            data.items,
            data.deliveryMethod
        );
    },

    async acceptOrder(id: string, adminId: string) {
        const order = await purchaseOrderRepository.findById(id);
        if (!order) throw new Error("Purchase Order tidak ditemukan");
        if (order.status !== "PENDING") {
            throw new Error("Purchase Order sudah diproses");
        }

        // Validate stock
        for (const item of order.items) {
            if (item.product.stock < item.quantity) {
                throw new Error(
                    `Stok ${item.product.name} tidak mencukupi (tersedia: ${item.product.stock}, dibutuhkan: ${item.quantity})`
                );
            }
        }

        // Convert PO to transaction
        const invoiceNumber = generateInvoiceNumber();
        const items = order.items.map((item) => ({
            productId: item.productId,
            productName: item.product.name,
            quantity: item.quantity,
            costPrice: item.product.costPrice,
            sellingPrice: item.price,
        }));

        const subtotal = items.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);

        await transactionRepository.create(
            {
                invoiceNumber,
                cashier: { connect: { id: adminId } },
                customerId: order.customerId,
                subtotal,
                discount: 0,
                tax: 0,
                total: subtotal,
                paymentStatus: "PENDING",
            },
            items,
            [] // No payments yet for PO conversion
        );

        // Update PO status
        await purchaseOrderRepository.updateStatus(id, "ACCEPTED");

        await activityLogRepository.create(adminId, "ACCEPT_PO", {
            purchaseOrderId: id,
            invoiceNumber,
            totalAmount: order.totalAmount,
        });

        return { message: "Purchase Order diterima dan dikonversi ke transaksi" };
    },

    async declineOrder(id: string, adminId: string) {
        const order = await purchaseOrderRepository.findById(id);
        if (!order) throw new Error("Purchase Order tidak ditemukan");
        if (order.status !== "PENDING") {
            throw new Error("Purchase Order sudah diproses");
        }

        await purchaseOrderRepository.updateStatus(id, "DECLINED");

        await activityLogRepository.create(adminId, "DECLINE_PO", {
            purchaseOrderId: id,
            totalAmount: order.totalAmount,
        });

        return { message: "Purchase Order ditolak" };
    },
};
