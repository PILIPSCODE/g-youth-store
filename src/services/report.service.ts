import { prisma } from "@/lib/prisma";

export const reportService = {
    async getDailyReport(date?: string) {
        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const transactions = await prisma.transaction.findMany({
            where: {
                createdAt: { gte: startOfDay, lte: endOfDay },
                paymentStatus: "PAID",
            },
            include: { items: true, payments: true },
        });

        const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
        const totalTransactions = transactions.length;
        const totalItems = transactions.reduce(
            (sum, t) => sum + t.items.reduce((s, i) => s + i.quantity, 0),
            0
        );

        const paymentBreakdown: Record<string, number> = {};
        for (const t of transactions) {
            for (const p of t.payments) {
                paymentBreakdown[p.method] = (paymentBreakdown[p.method] || 0) + p.amount;
            }
        }

        return {
            date: targetDate.toISOString().slice(0, 10),
            totalRevenue,
            totalTransactions,
            totalItems,
            paymentBreakdown,
        };
    },

    async getMonthlyReport(year?: number, month?: number) {
        const now = new Date();
        const targetYear = year ?? now.getFullYear();
        const targetMonth = month ?? now.getMonth() + 1;

        const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
        const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

        const transactions = await prisma.transaction.findMany({
            where: {
                createdAt: { gte: startOfMonth, lte: endOfMonth },
                paymentStatus: "PAID",
            },
            include: { items: true },
        });

        const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
        const totalTransactions = transactions.length;
        const totalDiscount = transactions.reduce((sum, t) => sum + t.discount, 0);

        // Daily breakdown
        const dailyData: Record<string, { revenue: number; count: number }> = {};
        for (const t of transactions) {
            const day = t.createdAt.toISOString().slice(0, 10);
            if (!dailyData[day]) dailyData[day] = { revenue: 0, count: 0 };
            dailyData[day].revenue += t.total;
            dailyData[day].count += 1;
        }

        return {
            year: targetYear,
            month: targetMonth,
            totalRevenue,
            totalTransactions,
            totalDiscount,
            dailyBreakdown: dailyData,
        };
    },

    async getTopProducts(limit: number = 10, startDate?: Date, endDate?: Date) {
        const where: Record<string, unknown> = {};
        if (startDate || endDate) {
            const createdAt: Record<string, Date> = {};
            if (startDate) createdAt.gte = startDate;
            if (endDate) createdAt.lte = endDate;
            where.transaction = { createdAt, paymentStatus: "PAID" };
        } else {
            where.transaction = { paymentStatus: "PAID" };
        }

        const items = await prisma.transactionItem.groupBy({
            by: ["productId", "productName"],
            where,
            _sum: { quantity: true, subtotal: true },
            orderBy: { _sum: { quantity: "desc" } },
            take: limit,
        });

        return items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            totalQuantity: item._sum.quantity ?? 0,
            totalRevenue: item._sum.subtotal ?? 0,
        }));
    },

    async getProfitLoss(startDate?: Date, endDate?: Date) {
        const where: Record<string, unknown> = { paymentStatus: "PAID" };
        if (startDate || endDate) {
            const createdAt: Record<string, Date> = {};
            if (startDate) createdAt.gte = startDate;
            if (endDate) createdAt.lte = endDate;
            where.createdAt = createdAt;
        }

        const transactions = await prisma.transaction.findMany({
            where,
            include: { items: true },
        });

        let totalRevenue = 0;
        let totalCost = 0;
        let totalDiscount = 0;

        for (const t of transactions) {
            totalRevenue += t.total;
            totalDiscount += t.discount;
            for (const item of t.items) {
                totalCost += item.costPrice * item.quantity;
            }
        }

        const grossProfit = totalRevenue - totalCost;

        return {
            totalRevenue,
            totalCost,
            totalDiscount,
            grossProfit,
            transactionCount: transactions.length,
        };
    },

    async getCashierPerformance(startDate?: Date, endDate?: Date) {
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
                cashier: { select: { id: true, name: true } },
                items: true,
            },
        });

        const performanceMap: Record<
            string,
            { name: string; totalTransactions: number; totalRevenue: number; totalItemsSold: number }
        > = {};

        for (const t of transactions) {
            const cid = t.cashierId;
            if (!performanceMap[cid]) {
                performanceMap[cid] = {
                    name: t.cashier.name,
                    totalTransactions: 0,
                    totalRevenue: 0,
                    totalItemsSold: 0,
                };
            }
            performanceMap[cid].totalTransactions += 1;
            performanceMap[cid].totalRevenue += t.total;
            performanceMap[cid].totalItemsSold += t.items.reduce((sum, i) => sum + i.quantity, 0);
        }

        return Object.entries(performanceMap).map(([id, data]) => ({
            cashierId: id,
            ...data,
        }));
    },

    async getRevenueChart(days: number = 7) {
        const today = new Date();
        const endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);

        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - (days - 1));
        startDate.setHours(0, 0, 0, 0);

        // Initialize array for the last X days
        const chartData: Record<string, { name: string; date: string; total: number }> = {};
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().slice(0, 10);
            const name = d.toLocaleDateString("en-US", { weekday: "short" });
            chartData[dateStr] = { name, date: dateStr, total: 0 };
        }

        const transactions = await prisma.transaction.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate },
                paymentStatus: "PAID",
            },
            select: {
                createdAt: true,
                total: true,
            }
        });

        for (const t of transactions) {
            const dateStr = t.createdAt.toISOString().slice(0, 10);
            if (chartData[dateStr]) {
                chartData[dateStr].total += t.total;
            }
        }

        return Object.values(chartData);
    },
};
