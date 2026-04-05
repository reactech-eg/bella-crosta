import "./globals.css";
import { Bricolage_Grotesque } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { getCurrentUser } from "@/lib/auth";
import type { Metadata } from "next";

const BricolageGrotesqueFont = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Bella Crosta — Premium Pizza Delivery",
  description: "Authentic Italian pizzas delivered fresh to your door",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className={`dark ${BricolageGrotesqueFont.className}`}>
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        <AuthProvider initialUser={user}>{children}</AuthProvider>
      </body>
    </html>
  );
}
