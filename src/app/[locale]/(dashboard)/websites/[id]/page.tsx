import { redirect } from "next/navigation";

interface WebsitePageProps {
  params: Promise<{ id: string }>;
}

export default async function WebsitePage({ params }: WebsitePageProps) {
  const { id } = await params;
  // Redirect to stats page
  redirect(`/websites/${id}/stats`);
}
