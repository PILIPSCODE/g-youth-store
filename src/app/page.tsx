import Link from "next/link";
import { ArrowRight, Store, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full text-center space-y-8">
        <div className="flex justify-center mb-8">
          <div className="h-24 w-24 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-6 transition-transform">
            <Store className="h-12 w-12" />
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 drop-shadow-sm">
          <span className="text-primary">G-YOUTH </span>
          <span className="text-primary">STORE</span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Faith. Community. Good vibes.
          Discover inspiring merch, tasty food, and refreshing drinks made for young people who love to grow and connect together.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
          <Button asChild size="lg" className="h-14 px-8 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <Link href="/order">
              <Store className="mr-2 h-5 w-5" />
              Public Storefront
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg font-semibold rounded-full border-2 hover:bg-gray-50 transition-all hover:-translate-y-1 bg-white">
            <Link href="/auth/login">
              <ShieldCheck className="mr-2 h-5 w-5 text-primary" />
              Staff Login
            </Link>
          </Button>
        </div>
      </div>

      <div className="fixed bottom-8 text-center text-sm text-gray-500 w-full font-medium">
        &copy; {new Date().getFullYear()} G-YOUTH STORE. All rights reserved.
      </div>
    </div>
  );
}
