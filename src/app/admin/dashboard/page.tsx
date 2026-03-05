"use client";

import { useEffect, useState } from "react";
import { formatRupiah } from "@/lib/currency";
import { AuthLayout } from "@/components/layouts/auth-layout";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
} from "recharts";
import { Package, Receipt, TrendingUp, AlertTriangle } from "lucide-react";

export default function AdminDashboardPage() {
    const [dailyData, setDailyData] = useState<any>(null);
    const [monthlyData, setMonthlyData] = useState<any>(null);
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [lowStockCount, setLowStockCount] = useState(0);
    const [chartData, setChartData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const today = new Date().toISOString().split("T")[0];
                const currentMonth = today.substring(0, 7); // YYYY-MM

                const [dailyRes, monthlyRes, topProductsRes, productsRes, chartRes] = await Promise.all([
                    fetch(`/api/reports/daily?date=${today}`),
                    fetch(`/api/reports/monthly?month=${currentMonth}`),
                    fetch(`/api/reports/top-products`),
                    fetch(`/api/products`),
                    fetch(`/api/reports/revenue-chart?days=7`),
                ]);

                const daily = await dailyRes.json();
                const monthly = await monthlyRes.json();
                const top = await topProductsRes.json();
                const products = await productsRes.json();
                const chart = await chartRes.json();

                setDailyData(daily);
                setMonthlyData(monthly);
                setTopProducts(top.data || []);
                setChartData(chart.data || []);

                const lowStock = (products.data?.products || []).filter((p: any) => p.stock <= 5).length;
                setLowStockCount(lowStock);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) {
        return (
            <AuthLayout>
                <div className="flex h-[80vh] items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout allowedRoles={["ADMIN"]}>
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground mt-2">
                        Overview of your store's performance.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-l-4 border-l-blue-500 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Today's Revenue
                            </CardTitle>
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <TrendingUp className="h-4 w-4 text-blue-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatRupiah(dailyData?.data?.totalRevenue || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 font-medium">
                                <span className="text-blue-600 mr-1">{dailyData?.data?.totalTransactions || 0}</span> transactions today
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Monthly Revenue
                            </CardTitle>
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <Receipt className="h-4 w-4 text-emerald-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatRupiah(monthlyData?.data?.totalRevenue || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 font-medium">
                                <span className="text-emerald-600 mr-1">{monthlyData?.data?.totalTransactions || 0}</span> transactions this month
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-amber-500 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{lowStockCount}</div>
                            <p className="text-xs text-muted-foreground mt-1 font-medium text-amber-600">
                                Requires immediate restock
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Package className="h-4 w-4 text-purple-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {topProducts.length > 0 ? topProducts.length + "+" : "0"}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 font-medium">
                                Active products in catalog
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-4 shadow-sm border-slate-200">
                        <CardHeader>
                            <CardTitle>Revenue Overview</CardTitle>
                            <CardDescription>
                                Daily revenue performance for the past 7 days
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pl-0">
                            <div className="h-[300px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: +40, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis
                                            dataKey="name"
                                            stroke="#64748B"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            dy={10}
                                        />
                                        <YAxis
                                            stroke="#64748B"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `Rp${value / 1000000}M`}
                                            dx={-10}
                                        />
                                        <Tooltip
                                            formatter={(value: any) => [formatRupiah(value as number), 'Revenue']}
                                            cursor={{ fill: '#F1F5F9' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar
                                            dataKey="total"
                                            radius={[6, 6, 0, 0]}
                                            className="fill-blue-600 hover:fill-blue-700 transition-colors"
                                            maxBarSize={50}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="col-span-3 shadow-sm border-slate-200">
                        <CardHeader>
                            <CardTitle>Top Selling Products</CardTitle>
                            <CardDescription>
                                Best performing items by revenue this month
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {topProducts.slice(0, 5).map((product, i) => (
                                    <div key={i} className="flex items-center group">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                            #{i + 1}
                                        </div>
                                        <div className="ml-4 space-y-1 overflow-hidden">
                                            <p className="text-sm font-semibold leading-none truncate pr-4 text-slate-900">
                                                {product.productName || `Product ${i + 1}`}
                                            </p>
                                            <p className="text-xs text-muted-foreground font-medium">
                                                {product.totalQuantity} units sold
                                            </p>
                                        </div>
                                        <div className="ml-auto font-bold text-slate-900">
                                            {formatRupiah(product.totalRevenue)}
                                        </div>
                                    </div>
                                ))}

                                {topProducts.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <Package className="h-10 w-10 text-slate-300 mb-3" />
                                        <p className="text-sm font-medium text-slate-900">No sales data yet</p>
                                        <p className="text-xs text-slate-500 mt-1">Products will appear here once sold</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthLayout>
    );
}
