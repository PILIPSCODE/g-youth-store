import { userRepository } from "@/repositories/user.repository";
import { activityLogRepository } from "@/repositories/activityLog.repository";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export const userService = {
    async getAllUsers() {
        return userRepository.findAll();
    },

    async getUserById(id: string) {
        const user = await userRepository.findById(id);
        if (!user) throw new Error("User tidak ditemukan");
        return user;
    },

    async createUser(data: {
        name: string;
        email: string;
        password: string;
        role?: Role;
    }) {
        const existing = await userRepository.findByEmail(data.email);
        if (existing) throw new Error("Email sudah terdaftar");

        const hashedPassword = await bcrypt.hash(data.password, 12);
        return userRepository.create({
            name: data.name,
            email: data.email,
            password: hashedPassword,
            role: data.role || "CASHIER",
        });
    },

    async updateUser(
        id: string,
        data: { name?: string; email?: string; password?: string; role?: Role },
        adminId: string
    ) {
        if (data.email) {
            const existing = await userRepository.findByEmail(data.email);
            if (existing && existing.id !== id) throw new Error("Email sudah digunakan");
        }

        const updateData: { name?: string; email?: string; password?: string; role?: Role } = {};
        if (data.name) updateData.name = data.name;
        if (data.email) updateData.email = data.email;
        if (data.role) updateData.role = data.role;
        if (data.password) updateData.password = await bcrypt.hash(data.password, 12);

        const user = await userRepository.update(id, updateData);

        await activityLogRepository.create(adminId, "UPDATE_USER", {
            targetUserId: id,
            changes: Object.keys(updateData),
        });

        return user;
    },

    async deleteUser(id: string) {
        return userRepository.delete(id);
    },
};
