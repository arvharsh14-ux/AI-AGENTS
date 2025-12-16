import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>Layout shell</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          This route lives under a route group layout to verify App Router
          composition works.
        </CardContent>
      </Card>
    </div>
  );
}
