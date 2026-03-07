import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const capitalList = await prisma.capital.findMany({
            orderBy: { createdAt: "desc" },
        });

        // Calculate total capital
        const totalCapital = capitalList.reduce((sum, item) => sum + item.amount, 0);

        return NextResponse.json({
            success: true,
            data: {
                totalCapital,
                history: capitalList,
            },
        });
    } catch (error: any) {
        console.error("Error fetching capital data:", error);
        return NextResponse.json(
            { success: false, error: "Gagal mengambil data modal usaha" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const { amount, description } = await req.json();

        if (!amount || amount <= 0) {
            return NextResponse.json(
                { success: false, error: "Jumlah modal tidak valid" },
                { status: 400 }
            );
        }

        if (!description || description.trim() === "") {
            return NextResponse.json(
                { success: false, error: "Deskripsi harus diisi" },
                { status: 400 }
            );
        }

        const newCapital = await prisma.capital.create({
            data: {
                amount: Number(amount),
                description: description.trim(),
            },
        });

        return NextResponse.json({ success: true, data: newCapital }, { status: 201 });
    } catch (error: any) {
        console.error("Error adding capital:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Gagal menambahkan modal usaha" },
            { status: 500 }
        );
    }
}
