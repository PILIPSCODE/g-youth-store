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
            const start = new Date(startDateParam);
            const end = new Date(endDateParam);
            // Ensure end date includes the entire day
            end.setUTCHours(23, 59, 59, 999);

            dateFilter = {
                gte: start,
                lte: end,
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

            // Calculate exact cash sales considering change
            const paymentTotal = tx.payments.reduce((sum, p) => sum + p.amount, 0);
            const change = Math.max(0, paymentTotal - tx.total);
            const cashPayments = tx.payments.filter(p => p.method === "CASH");
            const cashPaid = cashPayments.reduce((sum, p) => sum + p.amount, 0);
            const netCash = Math.max(0, cashPaid - change);

            totalCashSales += netCash;
        });

        const profit = totalSales - totalCOGS;

        // 1.5 Unrealized Profit (Potensi Laba dari Stok)
        const products = await prisma.product.findMany();
        let unrealizedProfit = 0;
        let totalInventoryValue = 0;

        products.forEach(p => {
            if (p.stock > 0) {
                totalInventoryValue += (p.costPrice * p.stock);
                unrealizedProfit += ((p.sellingPrice - p.costPrice) * p.stock);
            }
        });

        // 2. Cash Drawer Status (From closed registers)
        const registers = await prisma.cashRegister.findMany({
            where: Object.keys(dateFilter).length > 0 ? { closedAt: dateFilter } : { closedAt: { not: null } },
            include: {
                expenses: true
            }
        });

        // Group registers to show cumulative shifts
        let totalExpenses = 0;
        let totalOpeningCash = 0;
        let totalClosingCash = 0;
        let totalExpectedCash = 0;
        let totalDifference = 0;

        // If there are multiple registers in a day, summing `openingCash` + `openingCash` is illogical for a physical drawer
        // Instead, the "expected cash" for a day should just be:
        // First shift opening + Total Cash Sales (from all shifts) - Total Expenses (from all shifts)
        // AND "actual cash" should be the closing cash of the LAST shift of the day.

        if (registers.length > 0) {
            // Sort by openedAt ASC to find first opening and last closing
            registers.sort((a, b) => a.openedAt.getTime() - b.openedAt.getTime());

            totalOpeningCash = registers[0].openingCash; // Take only the first shift's opening cash

            // The actual physical money left at the end of the day is the last shift's closing cash
            const lastRegister = registers[registers.length - 1];
            totalClosingCash = lastRegister.closingCash || 0;

            // Sum up expenses from all shifts
            registers.forEach(reg => {
                reg.expenses.forEach(ex => {
                    totalExpenses += ex.amount;
                });
            });

            // Expected cash = Original Starting money + All Income - All Expenses
            totalExpectedCash = totalOpeningCash + totalCashSales - totalExpenses;

            // Total difference = Actual money in drawer at end of day - Expected money
            totalDifference = totalClosingCash - totalExpectedCash;
        }

        // 3. Total Asset Summary (Kas Akhir)
        const totalAssetValue = totalClosingCash + totalInventoryValue + unrealizedProfit;

        return apiResponse({
            salesReport: {
                totalSales,
                totalTransactions: transactions.length,
                totalCOGS,
                profit,
                unrealizedProfit,
                totalInventoryValue,
                totalAssetValue
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
