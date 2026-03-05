import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { apiError, formatRupiah } from "@/lib/helpers";
import PDFDocument from "pdfkit";

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

        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on("data", (chunk: Buffer) => chunks.push(chunk));

        const pdfPromise = new Promise<Buffer>((resolve) => {
            doc.on("end", () => resolve(Buffer.concat(chunks)));
        });

        // Header
        doc.fontSize(20).text("POS Gereja", { align: "center" });
        doc.fontSize(12).text(`Laporan ${type === "transactions" ? "Transaksi" : "Produk"}`, {
            align: "center",
        });
        doc.moveDown();

        if (type === "transactions") {
            const where: Record<string, unknown> = { paymentStatus: "PAID" };
            if (startDate || endDate) {
                const createdAt: Record<string, Date> = {};
                if (startDate) createdAt.gte = startDate;
                if (endDate) createdAt.lte = endDate;
                where.createdAt = createdAt;
            }

            const transactions = await prisma.transaction.findMany({
                where,
                include: {
                    cashier: { select: { name: true } },
                    payments: true,
                },
                orderBy: { createdAt: "desc" },
                take: 100,
            });

            // Table header
            doc.fontSize(10).font("Helvetica-Bold");
            doc.text("No. Invoice", 50, doc.y, { width: 120, continued: false });

            let yPos = doc.y + 5;
            doc.font("Helvetica-Bold").fontSize(9);

            // Column headers
            const headerY = yPos;
            doc.text("Invoice", 50, headerY, { width: 110 });
            doc.text("Tanggal", 160, headerY, { width: 70 });
            doc.text("Kasir", 230, headerY, { width: 80 });
            doc.text("Total", 310, headerY, { width: 80 });
            doc.text("Metode", 390, headerY, { width: 100 });

            yPos = headerY + 15;
            doc.moveTo(50, yPos).lineTo(545, yPos).stroke();
            yPos += 5;

            doc.font("Helvetica").fontSize(8);
            for (const t of transactions) {
                if (yPos > 700) {
                    doc.addPage();
                    yPos = 50;
                }
                doc.text(t.invoiceNumber, 50, yPos, { width: 110 });
                doc.text(t.createdAt.toISOString().slice(0, 10), 160, yPos, { width: 70 });
                doc.text(t.cashier.name, 230, yPos, { width: 80 });
                doc.text(formatRupiah(t.total), 310, yPos, { width: 80 });
                doc.text(t.payments.map((p) => p.method).join(", "), 390, yPos, { width: 100 });
                yPos += 15;
            }

            // Summary
            doc.moveDown(2);
            const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
            doc.font("Helvetica-Bold").fontSize(11);
            doc.text(`Total Pendapatan: ${formatRupiah(totalRevenue)}`);
            doc.text(`Jumlah Transaksi: ${transactions.length}`);
        } else if (type === "products") {
            const products = await prisma.product.findMany({
                include: { category: { select: { name: true } } },
                orderBy: { name: "asc" },
            });

            let yPos = doc.y + 5;
            doc.font("Helvetica-Bold").fontSize(9);

            const headerY = yPos;
            doc.text("SKU", 50, headerY, { width: 80 });
            doc.text("Nama", 130, headerY, { width: 120 });
            doc.text("Kategori", 250, headerY, { width: 80 });
            doc.text("Harga Jual", 330, headerY, { width: 80 });
            doc.text("Stok", 410, headerY, { width: 50 });

            yPos = headerY + 15;
            doc.moveTo(50, yPos).lineTo(545, yPos).stroke();
            yPos += 5;

            doc.font("Helvetica").fontSize(8);
            for (const p of products) {
                if (yPos > 700) {
                    doc.addPage();
                    yPos = 50;
                }
                doc.text(p.sku, 50, yPos, { width: 80 });
                doc.text(p.name, 130, yPos, { width: 120 });
                doc.text(p.category.name, 250, yPos, { width: 80 });
                doc.text(formatRupiah(p.sellingPrice), 330, yPos, { width: 80 });
                doc.text(p.stock.toString(), 410, yPos, { width: 50 });
                yPos += 15;
            }
        }

        doc.end();
        const pdfBuffer = await pdfPromise;

        return new NextResponse(new Uint8Array(pdfBuffer), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="export-${type}-${Date.now()}.pdf"`,
            },
        });
    } catch (error) {
        return apiError((error as Error).message, 500);
    }
}, "ADMIN");
