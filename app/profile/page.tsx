import ProfileClient from "./profile-client";
import { getProfile } from "@/app/actions/profile";
import { getCurrentUser } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const data = await getProfile();

  return <ProfileClient customer={data?.customer ?? null} />;
}
