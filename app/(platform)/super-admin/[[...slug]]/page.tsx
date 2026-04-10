import { requireSuperAdmin } from "@/lib/auth/session";
import { renderPlatformRoute } from "@/modules/platform/pages";

export default async function PlatformCatchAllPage({
  params
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  await requireSuperAdmin();
  const { slug = ["dashboard"] } = await params;
  return renderPlatformRoute(slug);
}
