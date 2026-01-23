import AdminDashboard from "@/components/Admin/AdminDashboard";
import MarketGaps from "@/components/Admin/MarketGaps";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <AdminDashboard />
      <MarketGaps />
    </div>
  );
}
