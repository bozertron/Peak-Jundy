import Link from "next/link";

export default function BookingCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white border rounded-lg p-8 w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-2">Checkout cancelled</h1>
        <p className="text-gray-600 mb-6">
          No payment was taken. You can try again or keep browsing.
        </p>

        <div className="flex gap-3">
          <Link className="btn-primary" href="/browse">Browse equipment</Link>
          <Link className="btn-secondary" href="/dashboard">Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
