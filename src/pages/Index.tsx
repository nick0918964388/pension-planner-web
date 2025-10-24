import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

const Index = () => {
  const [simulationYears, setSimulationYears] = useState([30]);
  const [retirementFund, setRetirementFund] = useState([1000]);
  const [withdrawalRate, setWithdrawalRate] = useState([4.0]);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const formatCurrency = (value: number) => {
    return `${value} 萬`;
  };

  const formatYears = (value: number) => {
    return `${value} 年`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-primary mb-1">參數設定</h1>
        </div>

        {/* Basic Settings */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-primary mb-4">基本設定</h2>
            
            <div className="space-y-6">
              {/* Data Source */}
              <div className="space-y-2">
                <label className="text-sm text-foreground">數據來源</label>
                <Select defaultValue="historical">
                  <SelectTrigger className="w-full bg-card border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="historical">年度資料庫(1928-2024)</SelectItem>
                    <SelectItem value="monthly">月度資料庫(2000-2024)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Simulation Years */}
              <div className="space-y-3">
                <label className="text-sm text-foreground">模擬年數</label>
                <Slider
                  value={simulationYears}
                  onValueChange={setSimulationYears}
                  min={10}
                  max={50}
                  step={1}
                  className="w-full"
                />
                <div className="text-center text-2xl font-semibold text-foreground">
                  {formatYears(simulationYears[0])}
                </div>
              </div>

              {/* Retirement Fund */}
              <div className="space-y-3">
                <label className="text-sm text-foreground">退休資金</label>
                <Slider
                  value={retirementFund}
                  onValueChange={setRetirementFund}
                  min={100}
                  max={5000}
                  step={100}
                  className="w-full"
                />
                <div className="text-center text-2xl font-semibold text-foreground">
                  {formatCurrency(retirementFund[0])}
                </div>
              </div>
            </div>
          </div>

          {/* Investment Portfolio */}
          <div className="space-y-2">
            <label className="text-sm text-foreground">投資組合</label>
            <Select defaultValue="balanced">
              <SelectTrigger className="w-full bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="balanced">
                  <span className="text-foreground">標普500:</span>
                  <span className="text-primary">50%</span>
                  <span className="text-foreground"> 10年期公債:</span>
                  <span className="text-primary">50%</span>
                </SelectItem>
                <SelectItem value="aggressive">
                  <span className="text-foreground">標普500:</span>
                  <span className="text-primary">80%</span>
                  <span className="text-foreground"> 10年期公債:</span>
                  <span className="text-primary">20%</span>
                </SelectItem>
                <SelectItem value="conservative">
                  <span className="text-foreground">標普500:</span>
                  <span className="text-primary">20%</span>
                  <span className="text-foreground"> 10年期公債:</span>
                  <span className="text-primary">80%</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Withdrawal Strategy */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">提領策略</h2>
          
          <div className="space-y-4">
            <Select defaultValue="4percent">
              <SelectTrigger className="w-full bg-card border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="4percent">固定百分比提領 (4% Rule)</SelectItem>
                <SelectItem value="dynamic">動態調整提領</SelectItem>
                <SelectItem value="fixed">固定金額提領</SelectItem>
              </SelectContent>
            </Select>

            <Card className="bg-card border-border p-6">
              <div className="space-y-3">
                <label className="text-sm text-foreground">年度提領率</label>
                <Slider
                  value={withdrawalRate}
                  onValueChange={setWithdrawalRate}
                  min={2}
                  max={8}
                  step={0.1}
                  className="w-full"
                />
                <div className="text-center text-3xl font-bold text-foreground">
                  {formatPercentage(withdrawalRate[0])}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Inflation Settings */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">通膨設定</h2>
          
          <div className="space-y-2">
            <label className="text-sm text-foreground">通膨計算方法</label>
            <Select defaultValue="historical">
              <SelectTrigger className="w-full bg-card border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="historical">歷史通膨數據</SelectItem>
                <SelectItem value="fixed">固定通膨率</SelectItem>
                <SelectItem value="average">平均通膨率</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Settings */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="secondary" 
              className="w-full justify-between h-14 text-base"
            >
              <span>進階設定</span>
              <ChevronDown className={`h-5 w-5 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <Card className="bg-card border-border p-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-foreground">蒙地卡羅模擬次數</label>
                  <Select defaultValue="10000">
                    <SelectTrigger className="w-full bg-input border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="1000">1,000 次</SelectItem>
                      <SelectItem value="10000">10,000 次</SelectItem>
                      <SelectItem value="50000">50,000 次</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm text-foreground">再平衡頻率</label>
                  <Select defaultValue="annual">
                    <SelectTrigger className="w-full bg-input border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="monthly">每月</SelectItem>
                      <SelectItem value="quarterly">每季</SelectItem>
                      <SelectItem value="annual">每年</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Calculate Button */}
        <Button 
          className="w-full h-14 text-lg font-bold bg-primary hover:bg-gold-dark text-primary-foreground"
        >
          開始計算
        </Button>
      </div>
    </div>
  );
};

export default Index;
