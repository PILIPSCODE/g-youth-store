import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function CheckoutSuccessPage() {
    return (
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
            <div className="flex justify-center mb-6">
                <CheckCircle className="h-24 w-24 text-green-500" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-green-700">Order Placed Successfully!</h1>
            <p className="text-xl text-muted-foreground mb-8">
                Your purchase order is waiting for confirmation.
                <br /> We will contact you shortly regarding the status of your order.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button asChild size="lg" className="font-semibold">
                    <Link href="/order">
                        Continue Shopping
                    </Link>
                </Button>
            </div>
        </div>
    );
}
