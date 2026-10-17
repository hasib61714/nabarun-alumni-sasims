import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAdminRows } from "@/hooks/useAdminData";
import { SectionHeader } from "../AdminCommon";

const COLORS = ["hsl(185, 75%, 40%)", "hsl(185, 65%, 55%)", "hsl(0, 85%, 55%)", "hsl(40, 90%, 52%)", "hsl(195, 50%, 45%)", "hsl(160, 60%, 40%)", "hsl(280, 50%, 50%)", "hsl(30, 80%, 50%)"];
const tooltipStyle = { borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" };

function ChartCard({ title, className, children, empty }: { title: string; className?: string; children: React.ReactNode; empty: boolean }) {
  return (
    <section className={`rounded-xl border bg-card p-5 shadow-card ${className ?? ""}`}>
      <h3 className="mb-4 font-display text-base font-semibold">{title}</h3>
      {empty ? <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">এখনো পর্যাপ্ত তথ্য নেই</div> : children}
    </section>
  );
}

export default function AnalyticsSection() {
  const { data: students = [] } = useAdminRows("student_profiles", "created_at");
  const { data: memories = [] } = useAdminRows("memories", "created_at");

  const byBatch = useMemo(() => {
    const map = new Map<number, number>();
    students.forEach((s) => s.batch_year && map.set(s.batch_year, (map.get(s.batch_year) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([batch, count]) => ({ batch: String(batch), count }));
  }, [students]);

  const approved = students.filter((s) => s.is_approved).length;
  const statusData = [{ name: "অনুমোদিত", value: approved }, { name: "অপেক্ষমান", value: students.length - approved }].filter((d) => d.value > 0);

  const professions = useMemo(() => {
    const map = new Map<string, number>();
    students.forEach((s) => { const p = s.current_profession?.trim() || "অনির্ধারিত"; map.set(p, (map.get(p) ?? 0) + 1); });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }));
  }, [students]);

  const memoryCategories = useMemo(() => {
    const map = new Map<string, number>();
    memories.filter((m) => m.status === "approved").forEach((m) => map.set(m.category, (map.get(m.category) ?? 0) + 1));
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [memories]);

  return (
    <div>
      <SectionHeader title="পরিসংখ্যান" description="ছাত্র ও স্মৃতির বিশ্লেষণ" />
      <div className="grid gap-5 lg:grid-cols-3">
        <ChartCard title="ব্যাচ অনুযায়ী ছাত্র সংখ্যা" className="lg:col-span-2" empty={byBatch.length === 0}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byBatch}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="batch" fontSize={12} /><YAxis fontSize={12} allowDecimals={false} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="count" name="ছাত্র" fill={COLORS[0]} radius={[6, 6, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="অনুমোদনের অবস্থা" empty={statusData.length === 0}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart><Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>{statusData.map((d) => <Cell key={d.name} fill={d.name === "অনুমোদিত" ? COLORS[0] : COLORS[2]} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="পেশা অনুযায়ী বিভাজন" className="lg:col-span-2" empty={professions.length === 0}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={professions} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis type="number" fontSize={12} allowDecimals={false} /><YAxis type="category" dataKey="name" fontSize={11} width={110} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="value" name="জন" radius={[0, 6, 6, 0]}>{professions.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar></BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="বিভাগ অনুযায়ী প্রকাশিত স্মৃতি" empty={memoryCategories.length === 0}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart><Pie data={memoryCategories} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={false} fontSize={11}>{memoryCategories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
