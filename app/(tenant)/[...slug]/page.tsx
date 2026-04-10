import { requireTenantUser } from "@/lib/auth/session";
import { renderTenantRoute } from "@/modules/tenant/pages";

export default async function TenantCatchAllPage({
  params,
  searchParams
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ search?: string }>;
}) {
  await requireTenantUser();
  const { slug = ["dashboard"] } = await params;
  const { search } = await searchParams;
  return renderTenantRoute(slug, search);
}
