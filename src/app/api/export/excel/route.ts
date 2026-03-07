import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/helpers";
import ExcelJS from "exceljs";
import { formatRupiah } from "@/lib/helpers";

export const GET = withAuth(async (req: NextRequest) => {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type") ?? "transactions";
        const startDate = searchParams.get("startDate")
            ? new Date(searchParams.get("startDate")!)
            : undefined;
        const endDate = searchParams.get("endDate")
            ? new Date(searchParams.get("endDate")!)
            : undefined;
        const cashierId = searchParams.get("cashierId");
        const paymentMethod = searchParams.get("paymentMethod");
        const status = searchParams.get("status");

        const workbook = new ExcelJS.Workbook();

        if (type === "transactions") {
            const sheet = workbook.addWorksheet("Transaksi");

            const where: Record<string, unknown> = {};

            if (status && status !== "ALL") {
                where.paymentStatus = status;
            } else if (!status) {
                where.paymentStatus = "PAID"; // Default legacy behavior
            }

            if (cashierId && cashierId !== "ALL") {
                where.cashierId = cashierId;
            }

            if (startDate || endDate) {
                const createdAt: Record<string, Date> = {};
                if (startDate) createdAt.gte = startDate;
                // Add 1 day to end date to include the whole day
                if (endDate) {
                    const end = new Date(endDate);
                    end.setUTCHours(23, 59, 59, 999);
                    createdAt.lte = end;
                }
                where.createdAt = createdAt;
            }

            if (paymentMethod && paymentMethod !== "ALL") {
                where.payments = {
                    some: { method: paymentMethod }
                };
            }

            const transactions = await prisma.transaction.findMany({
                where,
                include: {
                    cashier: { select: { name: true } },
                    items: true,
                    payments: true,
                },
                orderBy: { createdAt: "desc" },
            });

            sheet.columns = [
                { header: "No. Invoice", key: "invoiceNumber", width: 20 },
                { header: "Tanggal", key: "date", width: 15 },
                { header: "Kasir", key: "cashier", width: 20 },
                { header: "Detail Produk", key: "products", width: 40 },
                { header: "Subtotal", key: "subtotal", width: 15 },
                { header: "Diskon", key: "discount", width: 15 },
                { header: "Pajak", key: "tax", width: 15 },
                { header: "Total", key: "total", width: 15 },
                { header: "Metode Bayar", key: "paymentMethod", width: 20 },
            ];

            // Style header
            sheet.getRow(1).font = { bold: true };
            sheet.getRow(1).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF4472C4" },
            };
            sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

            for (const t of transactions) {
                const productDetails = t.items.map((i: any) => `${i.productName} (${i.quantity})`).join(", ");
                sheet.addRow({
                    invoiceNumber: t.invoiceNumber,
                    date: t.createdAt.toISOString().slice(0, 10),
                    cashier: t.cashier.name,
                    products: productDetails,
                    subtotal: formatRupiah(t.subtotal),
                    discount: formatRupiah(t.discount),
                    tax: formatRupiah(t.tax),
                    total: formatRupiah(t.total),
                    paymentMethod: t.payments.map((p: any) => p.method).join(", "),
                });
            }
        } else if (type === "products") {
            const sheet = workbook.addWorksheet("Produk");
            const products = await prisma.product.findMany({
                include: { category: { select: { name: true } } },
                orderBy: { name: "asc" },
            });

            sheet.columns = [
                { header: "SKU", key: "sku", width: 15 },
                { header: "Nama Produk", key: "name", width: 25 },
                { header: "Kategori", key: "category", width: 15 },
                { header: "Harga Modal", key: "costPrice", width: 15 },
                { header: "Harga Jual", key: "sellingPrice", width: 15 },
                { header: "Stok", key: "stock", width: 10 },
            ];

            sheet.getRow(1).font = { bold: true };
            sheet.getRow(1).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF4472C4" },
            };
            sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

            for (const p of products) {
                sheet.addRow({
                    sku: p.sku,
                    name: p.name,
                    category: p.category.name,
                    costPrice: formatRupiah(p.costPrice),
                    sellingPrice: formatRupiah(p.sellingPrice),
                    stock: p.stock,
                });
            }
        }

        const buffer = await workbook.xlsx.writeBuffer();

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="export-${type}-${Date.now()}.xlsx"`,
            },
        });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}, "ADMIN");
