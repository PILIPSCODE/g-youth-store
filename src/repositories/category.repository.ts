import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const categoryRepository = {
    async findAll() {
        return prisma.category.findMany({
            include: { _count: { select: { products: true } } },
            orderBy: { name: "asc" },
        });
    },

    async findById(id: string) {
        return prisma.category.findUnique({
            where: { id },
            include: { _count: { select: { products: true } } },
        });
    },

    async create(data: Prisma.CategoryCreateInput) {
        return prisma.category.create({ data });
    },

    async update(id: string, data: Prisma.CategoryUpdateInput) {
        return prisma.category.update({ where: { id }, data });
    },

    async delete(id: string) {
        return prisma.category.delete({ where: { id } });
    },
};
