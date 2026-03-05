import Link from "next/link";
import { ArrowRight, Store, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex flex-col items-center justify-center px-4 py-12 sm:p-4">
      <div className="max-w-3xl w-full text-center space-y-6 sm:space-y-8">
        <div className="flex justify-center mb-4 sm:mb-8">
          <div className="h-16 w-16 sm:h-24 sm:w-24 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-6 transition-transform">
            <Store className="h-8 w-8 sm:h-12 sm:w-12" />
          </div>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 drop-shadow-sm">
          <span className="text-primary">G-YOUTH </span>
          <span className="text-primary">STORE</span>
        </h1>

        <p className="text-base sm:text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-2">
          Iman. Komunitas. Semangat Muda.
          Temukan berbagai produk inspiratif dari Komisi Remaja GKJ Gebyok. Setiap pembelianmu adalah dukungan untuk pelayanan kami!
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mt-8 sm:mt-12 px-4 sm:px-0">
          <Button asChild size="lg" className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <Link href="/order">
              <Store className="mr-2 h-5 w-5" />
              Belanja Sekarang
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold rounded-full border-2 hover:bg-gray-50 transition-all hover:-translate-y-1 bg-white">
            <Link href="/auth/login">
              <ShieldCheck className="mr-2 h-5 w-5 text-primary" />
              Login Staf
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-12 sm:mt-16 text-center text-xs sm:text-sm text-gray-500 w-full font-medium px-4">
        &copy; {new Date().getFullYear()} G-YOUTH STORE — Komisi Remaja GKJ Gebyok. Seluruh hak cipta dilindungi.
      </div>
    </div>
  );
}
