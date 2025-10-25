import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, AlertCircle, CheckCircle2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import ResultsSection from "@/components/ResultsSection";
import CalculationDetails from "@/components/CalculationDetails";
import { useToast } from "@/hooks/use-toast";
import { marketDataService, sampleHistoricalReturn, type HistoricalReturn } from "@/services/marketData";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Index = () => {
  const [simulationYears, setSimulationYears] = useState([30]);
  const [retirementFund, setRetirementFund] = useState([1000]);
  const [withdrawalRate, setWithdrawalRate] = useState([4.0]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [dataSource, setDataSource] = useState<'historical' | 'simulated'>('historical');
  const [historicalData, setHistoricalData] = useState<HistoricalReturn[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataLoadError, setDataLoadError] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<'balanced' | 'aggressive' | 'conservative'>('balanced');
  const [yearRangePreset, setYearRangePreset] = useState<string>('all');
  const [customYearRange, setCustomYearRange] = useState({ startYear: 1928, endYear: 2024 });
  const { toast } = useToast();

  // 年份範圍預設選項
  const yearRangePresets = {
    all: { startYear: 1928, endYear: 2024, label: '全部數據 (1928-2024)' },
    postwar: { startYear: 1945, endYear: 2024, label: '戰後時期 (1945-2024)' },
    modern: { startYear: 1980, endYear: 2024, label: '現代時期 (1980-2024)' },
    recent30: { startYear: 1994, endYear: 2024, label: '最近30年 (1994-2024)' },
    recent20: { startYear: 2004, endYear: 2024, label: '最近20年 (2004-2024)' },
    century21: { startYear: 2000, endYear: 2024, label: '21世紀 (2000-2024)' },
  };

  // 獲取當前使用的年份範圍
  const getActiveYearRange = () => {
    if (yearRangePreset === 'custom') {
      return customYearRange;
    }
    return yearRangePresets[yearRangePreset as keyof typeof yearRangePresets];
  };

  // 載入歷史數據
  useEffect(() => {
    if (dataSource === 'historical' && historicalData.length === 0) {
      loadHistoricalData();
    }
  }, [dataSource]);

  const loadHistoricalData = async () => {
    setIsLoadingData(true);
    setDataLoadError(null);

    try {
      const data = await marketDataService.getHistoricalReturns();
      setHistoricalData(data);

      toast({
        title: "數據載入成功",
        description: `已載入 ${data.length} 年的真實歷史市場數據 (${data[data.length - 1]?.year}-${data[0]?.year})`,
      });
    } catch (error) {
      console.error('載入歷史數據失敗:', error);
      setDataLoadError('數據載入失敗');

      toast({
        title: "載入失敗",
        description: "無法載入歷史數據，請重新整理頁面",
        variant: "destructive",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  // 獲取投資組合權重
  const getPortfolioWeights = () => {
    switch (portfolio) {
      case 'aggressive':
        return { stock: 0.8, bond: 0.2 };
      case 'conservative':
        return { stock: 0.2, bond: 0.8 };
      default: // balanced
        return { stock: 0.5, bond: 0.5 };
    }
  };

  const runSimulation = () => {
    setIsCalculating(true);
    const useHistorical = dataSource === 'historical' && historicalData.length > 0;

    toast({
      title: "開始計算",
      description: useHistorical
        ? "使用真實歷史數據進行蒙地卡羅模擬..."
        : "使用模擬數據進行蒙地卡羅模擬...",
    });

    // Simulate calculation delay
    setTimeout(() => {
      const years = simulationYears[0];
      const initialAmount = retirementFund[0];
      const rate = withdrawalRate[0] / 100;
      const withdrawalAmount = initialAmount * rate;
      const weights = getPortfolioWeights();

      // Monte Carlo simulation
      const numSimulations = 1000;
      const results: number[][] = [];

      for (let sim = 0; sim < numSimulations; sim++) {
        const yearlyBalances = [initialAmount];
        let balance = initialAmount;

        for (let year = 1; year <= years; year++) {
          let returnRate: number;
          let inflation: number;

          if (useHistorical) {
            // 使用真實歷史數據取樣（包含年份範圍）
            const yearRange = getActiveYearRange();
            const sample = sampleHistoricalReturn(historicalData, weights.stock, weights.bond, yearRange);
            returnRate = sample.portfolioReturn;
            inflation = sample.inflation;
          } else {
            // 使用簡化的隨機模擬
            returnRate = (Math.random() - 0.5) * 0.3 + 0.07;
            inflation = 0.03;
          }

          balance = balance * (1 + returnRate) - withdrawalAmount * Math.pow(1 + inflation, year - 1);
          yearlyBalances.push(Math.max(0, balance));
        }
        results.push(yearlyBalances);
      }

      // Calculate percentiles for each year
      const chartData = [];
      for (let year = 0; year <= years; year++) {
        const yearBalances = results.map(sim => sim[year]).sort((a, b) => a - b);
        chartData.push({
          year,
          median: yearBalances[Math.floor(numSimulations * 0.5)],
          percentile25: yearBalances[Math.floor(numSimulations * 0.25)],
          percentile75: yearBalances[Math.floor(numSimulations * 0.75)],
          percentile10: yearBalances[Math.floor(numSimulations * 0.1)],
          percentile90: yearBalances[Math.floor(numSimulations * 0.9)],
        });
      }

      // Calculate success rate (balance > 0 at end)
      const successCount = results.filter(sim => sim[years] > 0).length;
      const successRate = (successCount / numSimulations) * 100;

      // 生成中位數情境的計算明細
      const yearlyDetails = [];
      let balance = initialAmount;
      let cumulativeInflation = 1;

      for (let year = 1; year <= years; year++) {
        const startBalance = balance;

        let returnRate: number;
        let inflation: number;

        if (useHistorical) {
          const yearRange = getActiveYearRange();
          const sample = sampleHistoricalReturn(historicalData, weights.stock, weights.bond, yearRange);
          returnRate = sample.portfolioReturn;
          inflation = sample.inflation;
        } else {
          returnRate = (Math.random() - 0.5) * 0.3 + 0.07;
          inflation = 0.03;
        }

        const returnAmount = balance * returnRate;
        cumulativeInflation *= (1 + inflation);
        const adjustedWithdrawal = withdrawalAmount * cumulativeInflation;

        balance = balance + returnAmount - adjustedWithdrawal;
        const endBalance = Math.max(0, balance);

        yearlyDetails.push({
          year,
          startBalance,
          returnRate,
          returnAmount,
          withdrawalAmount: adjustedWithdrawal,
          inflation,
          endBalance
        });

        balance = endBalance;
      }

      setSimulationResults({
        results: chartData,
        successRate,
        finalMedian: chartData[years].median,
        initialAmount,
        withdrawalAmount,
        dataSource: useHistorical ? 'historical' : 'simulated',
        yearlyDetails,
        simulationYears: years,
        withdrawalRate: rate * 100,
        portfolio,
      });

      setIsCalculating(false);
      toast({
        title: "計算完成",
        description: `成功率: ${successRate.toFixed(1)}% ${useHistorical ? '(使用真實歷史數據)' : '(使用模擬數據)'}`,
      });

      // Scroll to results
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, 800);
  };

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
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-primary mb-1">參數設定</h1>
        </div>

        {/* Data Source Status Alert */}
        {dataSource === 'historical' && (
          <Alert className={dataLoadError ? "border-red-500" : isLoadingData ? "border-blue-500" : "border-green-500"}>
            {dataLoadError ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : isLoadingData ? (
              <AlertCircle className="h-4 w-4 text-blue-500" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
            <AlertTitle>
              {isLoadingData ? "載入中..." : dataLoadError ? "載入失敗" : "✓ 真實歷史數據"}
            </AlertTitle>
            <AlertDescription>
              {isLoadingData
                ? "正在載入真實市場數據..."
                : dataLoadError
                ? dataLoadError
                : `已載入 ${historicalData.length} 年的真實 S&P 500 和 10年期公債數據 (${historicalData[historicalData.length - 1]?.year || 1928}-${historicalData[0]?.year || 2024})`}
            </AlertDescription>
          </Alert>
        )}

        {/* Basic Settings */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-primary mb-4">基本設定</h2>

            <div className="space-y-6">
              {/* Data Source */}
              <div className="space-y-2">
                <label className="text-sm text-foreground">數據來源</label>
                <Select value={dataSource} onValueChange={(value: 'historical' | 'simulated') => setDataSource(value)}>
                  <SelectTrigger className="w-full bg-card border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="historical">真實歷史數據 (1928-2024)</SelectItem>
                    <SelectItem value="simulated">簡化模擬數據</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {dataSource === 'historical'
                    ? "使用 S&P 500 和 10年期公債的真實歷史回報率"
                    : "使用統計分佈生成的模擬數據"}
                </p>
              </div>

              {/* Year Range Selection - Only show for historical data */}
              {dataSource === 'historical' && (
                <div className="space-y-2">
                  <label className="text-sm text-foreground">歷史數據年份範圍</label>
                  <Select value={yearRangePreset} onValueChange={setYearRangePreset}>
                    <SelectTrigger className="w-full bg-card border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="all">{yearRangePresets.all.label}</SelectItem>
                      <SelectItem value="postwar">{yearRangePresets.postwar.label}</SelectItem>
                      <SelectItem value="modern">{yearRangePresets.modern.label}</SelectItem>
                      <SelectItem value="recent30">{yearRangePresets.recent30.label}</SelectItem>
                      <SelectItem value="recent20">{yearRangePresets.recent20.label}</SelectItem>
                      <SelectItem value="century21">{yearRangePresets.century21.label}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    選擇要使用的歷史數據區間，可排除特定時期（如大蕭條）
                  </p>
                </div>
              )}

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
            <Select value={portfolio} onValueChange={(value: 'balanced' | 'aggressive' | 'conservative') => setPortfolio(value)}>
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
          onClick={runSimulation}
          disabled={isCalculating}
        >
          {isCalculating ? "計算中..." : "開始計算"}
        </Button>

        {/* Results Section */}
        {simulationResults && (
          <div id="results" className="space-y-4">
            <ResultsSection {...simulationResults} />
            {simulationResults.yearlyDetails && (
              <CalculationDetails
                initialAmount={simulationResults.initialAmount}
                withdrawalRate={simulationResults.withdrawalRate}
                simulationYears={simulationResults.simulationYears}
                portfolio={simulationResults.portfolio}
                dataSource={simulationResults.dataSource}
                yearlyDetails={simulationResults.yearlyDetails}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
