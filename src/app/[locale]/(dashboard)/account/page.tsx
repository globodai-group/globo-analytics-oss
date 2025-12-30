import { redirect } from "next/navigation";

// Redirect to profile page
export default function AccountPage() {
  redirect("/account/profile");
}
