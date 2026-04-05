import Link from "next/link";
import { Header } from "@/components/header";
import { ArrowRight, Clock, Truck, Shield, Pizza, Star } from "lucide-react";
import FeaturedSection from "@/components/home/featured-section";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Bella Crosta - Premium Pizza Delivery",
  description: "Authentic Italian pizzas delivered fresh to your door",
};

export default async function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-br from-primary/15 via-background to-background border-b border-border">
        {/* Decorative Background Element */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 blur-3xl opacity-20 pointer-events-none">
          <Pizza className="w-96 h-96 text-primary rotate-12" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="flex flex-col items-center text-center">
            {/* Social Proof Badge */}
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full mb-8 animate-fade-in">
              {/* <div className="flex -space-x-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full border-2 border-background bg-muted"
                  />
                ))}
              </div> */}
              <span className="text-sm font-medium text-primary">
                Loved by 10,000+ pizza enthusiasts
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground mb-6">
              Experience <span className="text-primary italic">Authentic</span>{" "}
              <br />
              Italian Perfection
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed">
              Hand-tossed dough, San Marzano tomatoes, and fresh buffalo
              mozzarella. Straight from our wood-fired oven to your doorstep.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <Link
                href="/menu"
                className="group inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
              >
                Order Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#featured"
                className="inline-flex items-center justify-center gap-2 bg-background/50 backdrop-blur-sm border border-border px-8 py-4 rounded-xl font-bold hover:bg-muted/50 transition-all"
              >
                View Featured
              </Link>
            </div>

            {/* Ratings Summary */}
            <div className="mt-12 flex items-center gap-4">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <span className="text-sm font-semibold">
                4.9/5 Average Rating
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-background py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: Clock,
                title: "30-Minute Delivery",
                desc: "We prioritize speed without compromising the temperature of your crust.",
                color: "text-orange-500",
                bg: "bg-orange-500/10",
              },
              {
                icon: Truck,
                title: "Free for Locals",
                desc: "Enjoy free delivery on all orders over $50 within the metropolitan area.",
                color: "text-blue-500",
                bg: "bg-blue-500/10",
              },
              {
                icon: Shield,
                title: "Quality First",
                desc: "If your pizza isn't perfect, we'll remake it or refund you instantly.",
                color: "text-green-500",
                bg: "bg-green-500/10",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="relative group p-8 rounded-2xl border border-transparent hover:border-border hover:bg-muted/30 transition-all"
              >
                <div
                  className={`w-16 h-16 ${feature.bg} ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-xl mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <FeaturedSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
