import UnfulfilledSearches from "@/components/Admin/UnfulfilledSearches";

export default function AdminUnfulfilledPage() {
  return (
    <div className="max-w-6xl space-y-6">
      <h1 className="text-2xl font-bold">Unfulfilled Searches</h1>
      <UnfulfilledSearches />
    </div>
  );
}
