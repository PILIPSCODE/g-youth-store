import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
    cart: CartItem[];
    addToCart: (product: Product, quantity?: number) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    orderHistoryIds: string[];
    addOrderToHistory: (orderId: string) => void;
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
}

export interface Product {
    id: string;
    name: string;
    sku: string;
    sellingPrice: number;
    stock: number;
    imageUrl?: string;
    categoryId?: string;
    description?: string;
}

export interface CartItem extends Product {
    quantity: number;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            cart: [],
            orderHistoryIds: [],
            addToCart: (product: Product, quantity: number = 1) =>
                set((state: AppState) => {
                    const existing = state.cart.find((item: CartItem) => item.id === product.id);
                    if (existing) {
                        return {
                            cart: state.cart.map((item: CartItem) =>
                                item.id === product.id
                                    ? { ...item, quantity: item.quantity + quantity }
                                    : item
                            ),
                        };
                    }
                    return { cart: [...state.cart, { ...product, quantity }] };
                }),
            removeFromCart: (productId: string) =>
                set((state: AppState) => ({
                    cart: state.cart.filter((item: CartItem) => item.id !== productId),
                })),
            updateQuantity: (productId: string, quantity: number) =>
                set((state: AppState) => ({
                    cart: state.cart.map((item: CartItem) =>
                        item.id === productId ? { ...item, quantity } : item
                    ),
                })),
            clearCart: () => set({ cart: [] }),
            addOrderToHistory: (orderId: string) =>
                set((state: AppState) => ({
                    orderHistoryIds: [orderId, ...state.orderHistoryIds].slice(0, 50),
                })),
            isSidebarOpen: true,
            toggleSidebar: () => set((state: AppState) => ({ isSidebarOpen: !state.isSidebarOpen })),
        }),
        {
            name: "pos-app-storage",
        }
    )
);
