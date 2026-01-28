"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { DollarSign, FileText, Info, TrendingUp, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DashboardStats {
  totalLeads: number;
  totalLeadsChange: number;
  activePolicies: number;
  activePoliciesChange: number;
  monthlyCommission: number;
  monthlyCommissionChange: number;
  conversionRate: number;
  conversionRateChange: number;
}

interface SalesData {
  month: string;
  sales: number;
}

interface PolicyDistribution {
  type: string;
  count: number;
  percentage: number;
}

interface DashboardMainProps {
  stats: DashboardStats;
  salesData: SalesData[];
  policyDistribution: PolicyDistribution[];
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--destructive))",
  "hsl(var(--muted))",
  "hsl(220, 70%, 50%)",
  "hsl(280, 70%, 50%)",
  "hsl(340, 70%, 50%)",
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
  }).format(amount);
}

function formatPercentage(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  formatValue,
  className = "",
}: {
  title: string;
  value: number;
  change: number;
  icon: React.ComponentType<any>;
  formatValue?: (value: number) => string;
  className?: string;
}) {
  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatValue ? formatValue(value) : value.toLocaleString()}
        </div>
        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
          <span
            className={`${
              isPositive
                ? "text-green-600"
                : isNegative
                ? "text-red-600"
                : "text-muted-foreground"
            }`}
          >
            {formatPercentage(change)}
          </span>
          <span>vs last month</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardMain({
  stats,
  salesData,
  policyDistribution,
}: DashboardMainProps) {
  const currentUser = authClient.useSession().data?.user;
  const isAdmin = currentUser?.role === "admin";
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {currentUser?.name} ({currentUser?.role})! Here's your
            performance overview.
          </p>
        </div>
      </div>

      <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-6"
        , isAdmin ? "lg:grid-cols-4" : "lg:grid-cols-3"
      )}>
        <StatCard
          title="Total Leads"
          value={stats.totalLeads}
          change={stats.totalLeadsChange}
          icon={Users}
        />

        <StatCard
          title="Active Policies"
          value={stats.activePolicies}
          change={stats.activePoliciesChange}
          icon={FileText}
        />

        <StatCard
          title="Monthly Commission"
          value={stats.monthlyCommission}
          change={stats.monthlyCommissionChange}
          icon={DollarSign}
          formatValue={formatCurrency}
          // Hide with Tailwind if not admin
          className={!isAdmin ? "hidden" : ""}
        />

        <StatCard
          title="Conversion Rate"
          value={stats.conversionRate}
          change={stats.conversionRateChange}
          icon={TrendingUp}
          formatValue={(value) => `${value.toFixed(1)}%`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg font-semibold">Sales</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [
                    formatCurrency(Number(value)),
                    "Sales",
                  ]}
                />
                <Bar dataKey="sales" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg font-semibold">
              Policy Distribution
            </CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={policyDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {policyDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, "Policies"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex-1 space-y-2">
                {policyDistribution.map((item, index) => (
                  <div
                    key={item.type}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <span className="text-muted-foreground">{item.type}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {item.percentage.toFixed(0)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.count} policies
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
