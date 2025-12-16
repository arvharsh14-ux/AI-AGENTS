export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Integrations</h1>
      <p className="text-slate-600">Connect your favorite tools and services.</p>
      <div className="grid gap-4 md:grid-cols-3">
        {['GitHub', 'Slack', 'Discord', 'Stripe', 'SendGrid'].map((tool) => (
          <div key={tool} className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="font-semibold">{tool}</h3>
            <p className="mt-2 text-sm text-slate-500">Connect to {tool} to automate workflows.</p>
            <button className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800">
              Connect
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
