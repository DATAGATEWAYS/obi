import NextDynamic from "next/dynamic";

export const dynamic = "force-dynamic";

const DashboardClient = NextDynamic(() => import("./DashboardClient"), {
  ssr: false,
});

export default function Page() {
  return <DashboardClient />;
}