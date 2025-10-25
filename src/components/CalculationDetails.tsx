import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface YearDetail {
  year: number;
  startBalance: number;
  returnRate: number;
  returnAmount: number;
  withdrawalAmount: number;
  inflation: number;
  endBalance: number;
}

interface CalculationDetailsProps {
  initialAmount: number;
  withdrawalRate: number;
  simulationYears: number;
  portfolio: string;
  dataSource: string;
  yearlyDetails: YearDetail[];
}

const CalculationDetails = ({
  initialAmount,
  withdrawalRate,
  simulationYears,
  portfolio,
  dataSource,
  yearlyDetails
}: CalculationDetailsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const formatCurrency = (value: number) => `${Math.round(value).toLocaleString()}萬`;
  const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;

  const portfolioLabels: Record<string, string> = {
    balanced: '平衡型 (50/50)',
    aggressive: '積極型 (80/20)',
    conservative: '保守型 (20/80)'
  };

  return (
    <Card className="bg-card border-border p-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-3 hover:bg-secondary/50 rounded-lg transition-colors">
            <h3 className="text-base font-bold text-foreground">計算明細</h3>
            <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4">
          {/* 參數摘要 */}
          <div className="mb-4 p-4 bg-background rounded-lg space-y-2">
            <h4 className="font-semibold text-sm text-primary mb-2">模擬參數</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">初始資金：</span>
                <span className="text-foreground font-medium ml-1">{formatCurrency(initialAmount)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">年提領率：</span>
                <span className="text-foreground font-medium ml-1">{formatPercent(withdrawalRate / 100)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">模擬年數：</span>
                <span className="text-foreground font-medium ml-1">{simulationYears} 年</span>
              </div>
              <div>
                <span className="text-muted-foreground">投資組合：</span>
                <span className="text-foreground font-medium ml-1">{portfolioLabels[portfolio] || portfolio}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">數據來源：</span>
                <span className="text-foreground font-medium ml-1">
                  {dataSource === 'historical' ? '真實歷史數據 (1928-2024)' : '簡化模擬數據'}
                </span>
              </div>
            </div>
          </div>

          {/* 年度明細表格 */}
          <div className="overflow-x-auto">
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead className="text-center">年度</TableHead>
                    <TableHead className="text-right">年初餘額</TableHead>
                    <TableHead className="text-right">投資回報</TableHead>
                    <TableHead className="text-right">提領金額</TableHead>
                    <TableHead className="text-right">通膨率</TableHead>
                    <TableHead className="text-right">年末餘額</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {yearlyDetails.map((detail) => (
                    <TableRow key={detail.year}>
                      <TableCell className="text-center font-medium">
                        {detail.year}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(detail.startBalance)}
                      </TableCell>
                      <TableCell className={`text-right ${detail.returnAmount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatCurrency(detail.returnAmount)}
                        <span className="text-xs ml-1">({formatPercent(detail.returnRate)})</span>
                      </TableCell>
                      <TableCell className="text-right text-orange-500">
                        -{formatCurrency(detail.withdrawalAmount)}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {formatPercent(detail.inflation)}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${
                        detail.endBalance > detail.startBalance ? 'text-green-500' :
                        detail.endBalance > 0 ? 'text-foreground' : 'text-red-500'
                      }`}>
                        {formatCurrency(detail.endBalance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* 圖例說明 */}
          <div className="mt-4 p-3 bg-background rounded-lg">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold">說明：</span>
              此表格顯示中位數情境的逐年計算過程。
              <span className="text-green-500 ml-2">綠色</span>表示正回報或餘額增加，
              <span className="text-orange-500 ml-1">橙色</span>表示提領，
              <span className="text-red-500 ml-1">紅色</span>表示負回報或資金耗盡。
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default CalculationDetails;
