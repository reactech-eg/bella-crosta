import { Header } from "@/components/header";
import ProfileClient from "./profile-client";
import { getProfile } from "@/app/actions/profile";
import { getCurrentUser } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import ProfileSkeleton from "@/components/profile/profile-skeleton";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const data = await getProfile();

  if (!data?.customer) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <p className="text-lg font-medium text-foreground">
            Customer profile not found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <Header />
          <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
            <ProfileSkeleton />
          </main>
        </div>
      }
    >
      <ProfileClient customer={data?.customer} />;
    </Suspense>
  );
}
