import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-muted border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-muted-foreground text-sm">
          <p>&copy; 2024 Bella Crosta. All rights reserved.</p>
          <p className="mt-2">Authentic Italian pizzas delivered fresh</p>
          <p className="mt-2">
            By{" "}
            <Link
              href="https://reactech.vercel.app"
              target="_blank"
              className="text-primary hover:underline"
            >
              Reactech
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
