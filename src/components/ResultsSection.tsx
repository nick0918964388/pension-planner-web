import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

interface SimulationResult {
  year: number;
  median: number;
  percentile25: number;
  percentile75: number;
  percentile10: number;
  percentile90: number;
}

interface ResultsSectionProps {
  results: SimulationResult[];
  successRate: number;
  finalMedian: number;
  initialAmount: number;
  withdrawalAmount: number;
  dataSource?: 'historical' | 'simulated';
}

const ResultsSection = ({ results, successRate, finalMedian, initialAmount, withdrawalAmount, dataSource }: ResultsSectionProps) => {
  const formatCurrency = (value: number) => `${Math.round(value)}萬`;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Success Rate Card */}
      <Card className="bg-card border-border p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-primary">模擬結果</h2>
          {dataSource && (
            <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
              {dataSource === 'historical' ? '真實數據' : '模擬數據'}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-background rounded-lg">
            <div className="text-2xl font-bold text-primary">{successRate.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground mt-1">成功率</div>
          </div>
          <div className="text-center p-3 bg-background rounded-lg">
            <div className="text-2xl font-bold text-primary">{formatCurrency(finalMedian)}</div>
            <div className="text-xs text-muted-foreground mt-1">最終餘額</div>
          </div>
          <div className="text-center p-3 bg-background rounded-lg">
            <div className="text-xl font-bold text-foreground">{formatCurrency(initialAmount)}</div>
            <div className="text-xs text-muted-foreground mt-1">初始</div>
          </div>
          <div className="text-center p-3 bg-background rounded-lg">
            <div className="text-xl font-bold text-foreground">{formatCurrency(withdrawalAmount)}</div>
            <div className="text-xs text-muted-foreground mt-1">年提領</div>
          </div>
        </div>
      </Card>

      {/* Chart */}
      <Card className="bg-card border-border p-4">
        <h3 className="text-base font-bold text-foreground mb-3">資產變化</h3>
        <div className="h-[250px] -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={results} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorRange" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="year" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 11 }}
                tickLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={formatCurrency}
                tick={{ fontSize: 11 }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px',
                  padding: '8px',
                  color: 'hsl(var(--popover-foreground))'
                }}
                labelStyle={{
                  color: 'hsl(var(--popover-foreground))',
                  fontWeight: 'bold',
                  marginBottom: '4px'
                }}
                itemStyle={{
                  color: 'hsl(var(--popover-foreground))',
                  padding: '2px 0'
                }}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    median: '中位數',
                    percentile90: '90%',
                    percentile75: '75%',
                    percentile25: '25%',
                    percentile10: '10%'
                  };
                  return [formatCurrency(value), labels[name] || name];
                }}
                labelFormatter={(label) => `第 ${label} 年`}
              />
              <Area 
                type="monotone" 
                dataKey="percentile90" 
                stroke="transparent"
                fill="url(#colorRange)"
                fillOpacity={0.3}
              />
              <Area 
                type="monotone" 
                dataKey="percentile75" 
                stroke="transparent"
                fill="url(#colorRange)"
                fillOpacity={0.5}
              />
              <Line 
                type="monotone" 
                dataKey="median" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
              />
              <Area 
                type="monotone" 
                dataKey="percentile25" 
                stroke="transparent"
                fill="url(#colorRange)"
                fillOpacity={0.5}
              />
              <Area 
                type="monotone" 
                dataKey="percentile10" 
                stroke="transparent"
                fill="url(#colorRange)"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-xs text-muted-foreground text-center">
          金線=中位數 陰影=10%-90%區間
        </div>
      </Card>

      {/* Analysis */}
      <Card className="bg-card border-border p-4">
        <h3 className="text-base font-bold text-foreground mb-2">分析</h3>
        <div className="space-y-1.5 text-sm">
          {successRate >= 90 ? (
            <p className="text-primary">✓ 成功率高，資金充足</p>
          ) : successRate >= 75 ? (
            <p className="text-foreground">⚠ 建議降低提領率</p>
          ) : (
            <p className="text-destructive">✗ 成功率偏低，需調整參數</p>
          )}
          {finalMedian > initialAmount * 0.5 && (
            <p className="text-muted-foreground">• 退休期末仍有資產</p>
          )}
          {finalMedian < initialAmount * 0.2 && (
            <p className="text-muted-foreground">• 資產消耗較快</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ResultsSection;
