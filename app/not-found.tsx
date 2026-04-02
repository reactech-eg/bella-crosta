import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Pizza } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-6">
          <Pizza className="w-12 h-12 text-primary animate-pulse" />
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          Page Not Found
        </h1>
        <p className="text-muted-foreground text-lg mb-8 max-w-md">
          Oops! It seems this slice is missing. The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-full hover:bg-primary/90 transition-all shadow-lg active:scale-95"
        >
          Back to Menu
        </Link>
      </main>
      <Footer />
    </div>
  );
}
