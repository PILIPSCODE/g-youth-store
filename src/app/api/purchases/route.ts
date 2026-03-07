import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const purchases = await prisma.inventoryPurchase.findMany({
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ success: true, data: purchases });
    } catch (error: any) {
        console.error("Error fetching purchases:", error);
        return NextResponse.json(
            { success: false, error: "Gagal mengambil riwayat pembelian stok" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const { supplier, totalCost, items } = await req.json();

        if (!supplier || !totalCost || !items || !items.length) {
            return NextResponse.json(
                { success: false, error: "Data pembelian tidak lengkap" },
                { status: 400 }
            );
        }

        // Process the purchase inside a transaction to ensure consistency
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the Purchase record
            const purchase = await tx.inventoryPurchase.create({
                data: {
                    supplier,
                    totalCost: Number(totalCost),
                    items: {
                        create: items.map((item: any) => ({
                            productId: item.productId,
                            quantity: Number(item.quantity),
                            costPrice: Number(item.costPrice),
                        })),
                    },
                },
            });

            // 2. Update the stock for each product
            for (const item of items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            increment: Number(item.quantity),
                        },
                        // Optionally update the product's costPrice to the latest
                        costPrice: Number(item.costPrice),
                    },
                });
            }

            return purchase;
        }, { maxWait: 10000, timeout: 20000 });

        return NextResponse.json({ success: true, data: result }, { status: 201 });
    } catch (error: any) {
        console.error("Error processing inventory purchase:", error);
        return NextResponse.json(
            { success: false, error: "Gagal menyimpan pembelian stok" },
            { status: 500 }
        );
    }
}
