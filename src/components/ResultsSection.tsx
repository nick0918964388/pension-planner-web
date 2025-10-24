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
}

const ResultsSection = ({ results, successRate, finalMedian, initialAmount, withdrawalAmount }: ResultsSectionProps) => {
  const formatCurrency = (value: number) => `${Math.round(value)} 萬`;
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Success Rate Card */}
      <Card className="bg-card border-border p-6">
        <h2 className="text-xl font-bold text-primary mb-4">模擬結果</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-background rounded-lg">
            <div className="text-3xl font-bold text-primary mb-1">{successRate.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">成功率</div>
          </div>
          <div className="text-center p-4 bg-background rounded-lg">
            <div className="text-3xl font-bold text-primary mb-1">{formatCurrency(finalMedian)}</div>
            <div className="text-sm text-muted-foreground">中位數餘額</div>
          </div>
          <div className="text-center p-4 bg-background rounded-lg">
            <div className="text-2xl font-bold text-foreground mb-1">{formatCurrency(initialAmount)}</div>
            <div className="text-sm text-muted-foreground">初始資金</div>
          </div>
          <div className="text-center p-4 bg-background rounded-lg">
            <div className="text-2xl font-bold text-foreground mb-1">{formatCurrency(withdrawalAmount)}</div>
            <div className="text-sm text-muted-foreground">年度提領</div>
          </div>
        </div>
      </Card>

      {/* Chart */}
      <Card className="bg-card border-border p-6">
        <h3 className="text-lg font-bold text-foreground mb-4">資產變化趨勢</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={results}>
              <defs>
                <linearGradient id="colorRange" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="year" 
                stroke="hsl(var(--muted-foreground))"
                label={{ value: '年數', position: 'insideBottom', offset: -5, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={formatCurrency}
                label={{ value: '資產 (萬)', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--popover-foreground))'
                }}
                formatter={(value: number) => [formatCurrency(value), '']}
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
                strokeWidth={3}
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
        <div className="mt-4 text-xs text-muted-foreground text-center">
          陰影區域顯示10%-90%百分位範圍，金線為中位數
        </div>
      </Card>

      {/* Analysis */}
      <Card className="bg-card border-border p-6">
        <h3 className="text-lg font-bold text-foreground mb-3">分析建議</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          {successRate >= 90 ? (
            <p className="text-primary">✓ 您的退休計劃成功率很高，資金充足度良好</p>
          ) : successRate >= 75 ? (
            <p className="text-foreground">⚠ 成功率尚可，建議考慮降低提領率或增加初始資金</p>
          ) : (
            <p className="text-destructive">✗ 成功率偏低，強烈建議調整參數以提高成功率</p>
          )}
          {finalMedian > initialAmount * 0.5 && (
            <p>• 預期在退休期結束時仍保有可觀資產</p>
          )}
          {finalMedian < initialAmount * 0.2 && (
            <p>• 資產消耗較快，可考慮降低年度提領率</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ResultsSection;
