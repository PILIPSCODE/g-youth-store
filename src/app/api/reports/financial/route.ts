import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/rbac";
import { apiResponse, apiError } from "@/lib/helpers";

export const GET = withAuth(async (req: NextRequest) => {
    try {
        const url = new URL(req.url);
        const startDateParam = url.searchParams.get("startDate");
        const endDateParam = url.searchParams.get("endDate");

        let dateFilter: any = {};
        if (startDateParam && endDateParam) {
            dateFilter = {
                gte: new Date(startDateParam),
                lte: new Date(endDateParam),
            };
        }

        // 1. Sales Data
        const transactions = await prisma.transaction.findMany({
            where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : undefined,
            include: {
                items: true,
                payments: true,
                cashier: { select: { id: true, name: true } },
            }
        });

        let totalSales = 0;
        let totalCOGS = 0; // Cost of Goods Sold
        let totalCashSales = 0;

        // Process Sales & COGS
        transactions.forEach(tx => {
            // Only count paid transactions
            if (tx.paymentStatus !== "PAID") return;

            let txTotal = 0;
            let txCOGS = 0;

            tx.items.forEach(item => {
                txTotal += (item.sellingPrice * item.quantity);
                txCOGS += (item.costPrice * item.quantity);
            });

            // Net amount considering tax/discount
            totalSales += tx.total;

            // We'll estimate COGS proportionally if there's a cart-level discount/tax, 
            // but simpler is: total COGS = sum(costPrice * qty)
            totalCOGS += txCOGS;

            // Calculate cash sales
            const cashPayments = tx.payments.filter(p => p.method === "CASH");
            totalCashSales += cashPayments.reduce((sum, p) => sum + p.amount, 0);
        });

        const profit = totalSales - totalCOGS;

        // 2. Cash Drawer Status (From closed registers)
        const registers = await prisma.cashRegister.findMany({
            where: Object.keys(dateFilter).length > 0 ? { closedAt: dateFilter } : { closedAt: { not: null } },
            include: {
                expenses: true
            }
        });

        let totalExpenses = 0;
        let totalOpeningCash = 0;
        let totalClosingCash = 0;
        let totalExpectedCash = 0;
        let totalDifference = 0;

        registers.forEach(reg => {
            totalOpeningCash += reg.openingCash;
            totalClosingCash += (reg.closingCash || 0);
            totalExpectedCash += (reg.expectedCash || 0);
            totalDifference += (reg.difference || 0);

            reg.expenses.forEach(ex => {
                totalExpenses += ex.amount;
            });
        });

        return apiResponse({
            salesReport: {
                totalSales,
                totalTransactions: transactions.length,
                totalCOGS,
                profit,
            },
            cashReport: {
                totalCashSales,
                totalExpenses,
                totalOpeningCash,
                totalClosingCash,
                totalExpectedCash,
                totalDifference
            }
        });
    } catch (error: any) {
        console.error("Error generating financial reports:", error);
        return apiError("Internal Server Error", 500);
    }
}, "ADMIN");
