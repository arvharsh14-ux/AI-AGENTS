export default function BillingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
      <p className="text-slate-600">Manage your subscription and billing details.</p>
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Current Plan</h2>
        <p className="mt-2 text-slate-600">You are currently on the <span className="font-bold">Free Plan</span>.</p>
        <button className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          Upgrade to Pro
        </button>
      </div>
    </div>
  );
}
