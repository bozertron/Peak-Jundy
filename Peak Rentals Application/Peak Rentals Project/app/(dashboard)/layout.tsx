import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Navigation/Sidebar";
import { authOptions } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const role = session.user.role;

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <Sidebar userRole={role} />
      <div className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}
