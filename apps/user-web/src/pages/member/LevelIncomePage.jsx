import { useEffect, useState } from "react";
import Card from "../../components/common/Card";
import DataTable from "../../components/common/DataTable";
import SectionTitle from "../../components/common/SectionTitle";
import { incomeColumns } from "../../config/table.config";
import { incomeService } from "../../services/income.service";

export default function LevelIncomePage() {
  const [stats, setStats] = useState({ today: 0, thisWeek: 0, allTime: 0 });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, logsRes] = await Promise.all([
          incomeService.getMyIncomeStats(),
          incomeService.getMyIncomeLogs({ type: "LEVEL_INCOME" })
        ]);
        
        if (statsRes?.data?.LEVEL_INCOME) {
          setStats(statsRes.data.LEVEL_INCOME);
        }
        
        if (logsRes?.data?.logs) {
          const formattedLogs = logsRes.data.logs.map((log, index) => ({
            serial: index + 1,
            source: `${log.fromUserId?.memberId || "System"} (Level ${log.level || "-"})`,
            amount: `$${log.amount}`,
            status: log.status,
            date: new Date(log.createdAt).toLocaleDateString(),
          }));
          setLogs(formattedLogs);
        }
      } catch (error) {
        console.error("Error fetching level income:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <SectionTitle title="Level Income" subtitle="Team building earning records" />
      <div className="grid gap-4 md:grid-cols-3">
        <Card><p className="text-xs uppercase tracking-[0.14em] text-slate-300">Today</p><p className="mt-2 text-2xl font-bold">$ {stats.today}</p></Card>
        <Card><p className="text-xs uppercase tracking-[0.14em] text-slate-300">This Week</p><p className="mt-2 text-2xl font-bold">$ {stats.thisWeek}</p></Card>
        <Card><p className="text-xs uppercase tracking-[0.14em] text-slate-300">All Time</p><p className="mt-2 text-2xl font-bold">$ {stats.allTime}</p></Card>
      </div>
      <Card>
        <DataTable columns={incomeColumns} rows={logs} emptyText="No level income records" />
      </Card>
    </div>
  );
}
