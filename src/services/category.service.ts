import { categoryRepository } from "@/repositories/category.repository";

export const categoryService = {
    async getAllCategories() {
        return categoryRepository.findAll();
    },

    async getCategoryById(id: string) {
        const category = await categoryRepository.findById(id);
        if (!category) throw new Error("Kategori tidak ditemukan");
        return category;
    },

    async createCategory(name: string) {
        return categoryRepository.create({ name });
    },

    async updateCategory(id: string, name: string) {
        return categoryRepository.update(id, { name });
    },

    async deleteCategory(id: string) {
        const category = await categoryRepository.findById(id);
        if (!category) throw new Error("Kategori tidak ditemukan");
        if (category._count.products > 0) {
            throw new Error("Tidak bisa menghapus kategori yang masih memiliki produk");
        }
        return categoryRepository.delete(id);
    },
};
