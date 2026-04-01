import React from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from "recharts";
import { TrendingUp, Calendar, Wallet, ArrowUpRight, ArrowDownRight, DollarSign } from "lucide-react";
import { Income } from "../types";
import { formatCurrency, cn } from "../lib/utils";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, subMonths, subYears, startOfYear, endOfYear } from "date-fns";

interface DashboardProps {
  incomes: Income[];
}

const COLORS = ["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899"];

export default function Dashboard({ incomes }: DashboardProps) {
  const now = new Date();
  const totalEarnings = incomes.reduce((sum, inc) => sum + inc.convertedAmount, 0);
  
  // Current Period Stats
  const thisMonthEarnings = incomes
    .filter(inc => {
      const date = parseISO(inc.date);
      return isWithinInterval(date, { start: startOfMonth(now), end: endOfMonth(now) });
    })
    .reduce((sum, inc) => sum + inc.convertedAmount, 0);

  const thisYearEarnings = incomes
    .filter(inc => parseISO(inc.date).getFullYear() === now.getFullYear())
    .reduce((sum, inc) => sum + inc.convertedAmount, 0);

  // Previous Period Stats for Growth Calculation
  const lastMonth = subMonths(now, 1);
  const lastMonthEarnings = incomes
    .filter(inc => {
      const date = parseISO(inc.date);
      return isWithinInterval(date, { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) });
    })
    .reduce((sum, inc) => sum + inc.convertedAmount, 0);

  const lastYear = subYears(now, 1);
  const lastYearEarnings = incomes
    .filter(inc => parseISO(inc.date).getFullYear() === lastYear.getFullYear())
    .reduce((sum, inc) => sum + inc.convertedAmount, 0);

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const monthGrowth = calculateGrowth(thisMonthEarnings, lastMonthEarnings);
  const yearGrowth = calculateGrowth(thisYearEarnings, lastYearEarnings);

  // Chart Data: Monthly
  const monthlyData = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const monthStr = format(d, "MMM");
    const amount = incomes
      .filter(inc => format(parseISO(inc.date), "MMM yyyy") === format(d, "MMM yyyy"))
      .reduce((sum, inc) => sum + inc.convertedAmount, 0);
    return { name: monthStr, amount };
  });

  // Chart Data: Type
  const typeData = incomes.reduce((acc: any[], inc) => {
    const existing = acc.find(item => item.name === inc.type);
    if (existing) {
      existing.value += inc.convertedAmount;
    } else {
      acc.push({ name: inc.type, value: inc.convertedAmount });
    }
    return acc;
  }, []);

  const stats = [
    { 
      label: "Total Earnings", 
      value: totalEarnings, 
      icon: Wallet, 
      color: "text-orange-500", 
      bg: "bg-orange-500/10",
      growth: null 
    },
    { 
      label: "This Month", 
      value: thisMonthEarnings, 
      icon: Calendar, 
      color: "text-blue-500", 
      bg: "bg-blue-500/10",
      growth: monthGrowth 
    },
    { 
      label: "This Year", 
      value: thisYearEarnings, 
      icon: TrendingUp, 
      color: "text-emerald-500", 
      bg: "bg-emerald-500/10",
      growth: yearGrowth 
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-white/40 mt-1">Welcome back! Here's your financial overview.</p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-white/70">Live Exchange Rates</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white/5 border border-white/10 p-8 rounded-[32px] relative overflow-hidden group hover:border-white/20 transition-all">
            <div className={cn("absolute top-6 right-6 w-12 h-12 rounded-2xl flex items-center justify-center", stat.bg)}>
              <stat.icon className={cn("w-6 h-6", stat.color)} />
            </div>
            <p className="text-white/40 text-sm font-medium mb-2">{stat.label}</p>
            <h3 className="text-3xl font-bold text-white">{formatCurrency(stat.value)}</h3>
            
            {stat.growth !== null && (
              <div className={cn(
                "mt-4 flex items-center gap-1 text-xs font-bold",
                stat.growth >= 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {stat.growth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                <span>{Math.abs(stat.growth).toFixed(1)}% from last period</span>
              </div>
            )}
            {stat.growth === null && (
              <div className="mt-4 flex items-center gap-1 text-white/20 text-xs font-bold">
                <span>Overall lifetime growth</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 p-8 rounded-[32px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white">Monthly Income</h3>
            <select className="bg-white/5 border border-white/10 text-xs rounded-lg px-2 py-1 text-white/60">
              <option>Last 6 Months</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#ffffff20" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#ffffff20" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `৳${val/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff10', borderRadius: '16px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-8 rounded-[32px]">
          <h3 className="text-xl font-bold text-white mb-8">Income by Type</h3>
          <div className="h-[300px] w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff10', borderRadius: '16px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-white/40 text-xs font-medium uppercase tracking-widest">Total</span>
              <span className="text-2xl font-bold text-white">৳{Math.round(totalEarnings/1000)}k</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {typeData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-xs text-white/60 font-medium">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Monthly Breakdown Table */}
      <div className="bg-white/5 border border-white/10 rounded-[32px] p-8">
        <h3 className="text-xl font-bold text-white mb-6">Monthly Breakdown ({now.getFullYear()})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => {
            const d = new Date(now.getFullYear(), i, 1);
            const monthStr = format(d, "MMMM");
            const monthIncome = incomes
              .filter(inc => {
                const incDate = parseISO(inc.date);
                return incDate.getMonth() === i && incDate.getFullYear() === now.getFullYear();
              })
              .reduce((sum, inc) => sum + inc.convertedAmount, 0);

            return (
              <div key={monthStr} className={cn(
                "p-6 rounded-2xl border transition-all",
                monthIncome > 0 ? "bg-white/5 border-white/10" : "bg-transparent border-white/5 opacity-40"
              )}>
                <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-1">{monthStr}</p>
                <p className={cn(
                  "text-xl font-bold",
                  monthIncome > 0 ? "text-white" : "text-white/20"
                )}>
                  {formatCurrency(monthIncome)}
                </p>
                {monthIncome > 0 && (
                  <div className="mt-2 w-full bg-white/5 h-1 rounded-full overflow-hidden">
                    <div 
                      className="bg-orange-500 h-full rounded-full" 
                      style={{ width: `${Math.min((monthIncome / (totalEarnings || 1)) * 100 * 3, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
