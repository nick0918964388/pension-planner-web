import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle2, Calculator } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { marketDataService, sampleHistoricalReturn, type HistoricalReturn } from "@/services/marketData";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ReverseCalculator = () => {
  const [targetSuccessRate, setTargetSuccessRate] = useState([97]);
  const [simulationYears, setSimulationYears] = useState([30]);
  const [monthlyExpense, setMonthlyExpense] = useState("5"); // 每月支出（萬）
  const [portfolio, setPortfolio] = useState<'balanced' | 'aggressive' | 'conservative'>('balanced');
  const [dataSource, setDataSource] = useState<'historical' | 'simulated'>('historical');
  const [historicalData, setHistoricalData] = useState<HistoricalReturn[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataLoadError, setDataLoadError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [yearRangePreset, setYearRangePreset] = useState<string>('all');
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

  const getPortfolioWeights = () => {
    switch (portfolio) {
      case 'aggressive':
        return { stock: 0.8, bond: 0.2 };
      case 'conservative':
        return { stock: 0.2, bond: 0.8 };
      default:
        return { stock: 0.5, bond: 0.5 };
    }
  };

  // 執行單次模擬，返回成功率
  const runSingleSimulation = (initialAmount: number): number => {
    const years = simulationYears[0];
    const annualWithdrawal = parseFloat(monthlyExpense) * 12;
    const weights = getPortfolioWeights();
    const useHistorical = dataSource === 'historical' && historicalData.length > 0;

    const numSimulations = 1000;
    let successCount = 0;

    for (let sim = 0; sim < numSimulations; sim++) {
      let balance = initialAmount;

      for (let year = 1; year <= years; year++) {
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

        const adjustedWithdrawal = annualWithdrawal * Math.pow(1 + inflation, year - 1);
        balance = balance * (1 + returnRate) - adjustedWithdrawal;

        if (balance <= 0) {
          break;
        }
      }

      if (balance > 0) {
        successCount++;
      }
    }

    return (successCount / numSimulations) * 100;
  };

  // 使用二分搜尋找出最低所需退休金
  const calculateRequiredFunds = () => {
    setIsCalculating(true);
    toast({
      title: "開始計算",
      description: "正在使用二分搜尋法尋找最佳退休金額...",
    });

    setTimeout(() => {
      const targetRate = targetSuccessRate[0];
      const annualExpense = parseFloat(monthlyExpense) * 12;

      // 二分搜尋範圍：最少 100 萬，最多 20000 萬
      let low = 100;
      let high = 20000;
      let bestAmount = high;
      let bestSuccessRate = 0;

      const iterations: { amount: number; successRate: number }[] = [];

      // 二分搜尋，精度到 10 萬
      while (high - low > 10) {
        const mid = Math.floor((low + high) / 2);
        const successRate = runSingleSimulation(mid);

        iterations.push({ amount: mid, successRate });

        if (successRate >= targetRate) {
          bestAmount = mid;
          bestSuccessRate = successRate;
          high = mid;
        } else {
          low = mid;
        }
      }

      // 精確測試最終範圍
      for (let amount = low; amount <= high; amount += 10) {
        const successRate = runSingleSimulation(amount);
        iterations.push({ amount, successRate });

        if (successRate >= targetRate && amount < bestAmount) {
          bestAmount = amount;
          bestSuccessRate = successRate;
        }
      }

      setResult({
        requiredAmount: bestAmount,
        achievedSuccessRate: bestSuccessRate,
        targetSuccessRate: targetRate,
        annualExpense,
        monthlyExpense: parseFloat(monthlyExpense),
        iterations: iterations.sort((a, b) => a.amount - b.amount),
        simulationYears: simulationYears[0],
        portfolio,
        dataSource
      });

      setIsCalculating(false);
      toast({
        title: "計算完成",
        description: `建議退休金：${bestAmount.toLocaleString()}萬，成功率：${bestSuccessRate.toFixed(1)}%`,
      });

      setTimeout(() => {
        document.getElementById('result')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, 500);
  };

  const formatCurrency = (value: number) => `${value.toLocaleString()}萬`;
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-primary mb-1">反向計算器</h1>
          <p className="text-sm text-muted-foreground">
            輸入目標成功率和每月支出，計算所需退休金
          </p>
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

        {/* Settings */}
        <div className="space-y-6">
          {/* Target Success Rate */}
          <Card className="bg-card border-border p-6">
            <div className="space-y-3">
              <Label className="text-sm text-foreground">目標成功率</Label>
              <Slider
                value={targetSuccessRate}
                onValueChange={setTargetSuccessRate}
                min={95}
                max={99}
                step={0.5}
                className="w-full"
              />
              <div className="text-center text-3xl font-bold text-primary">
                {formatPercent(targetSuccessRate[0])}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                退休金在 {simulationYears[0]} 年內不耗盡的機率
              </p>
            </div>
          </Card>

          {/* Monthly Expense */}
          <div className="space-y-2">
            <Label htmlFor="monthlyExpense" className="text-sm text-foreground">
              每月生活支出（萬元）
            </Label>
            <Input
              id="monthlyExpense"
              type="number"
              value={monthlyExpense}
              onChange={(e) => setMonthlyExpense(e.target.value)}
              min="1"
              max="100"
              step="0.5"
              className="text-2xl font-bold text-center"
            />
            <p className="text-xs text-muted-foreground text-center">
              年度支出：{(parseFloat(monthlyExpense) * 12).toFixed(1)} 萬元
            </p>
          </div>

          {/* Simulation Years */}
          <div className="space-y-3">
            <Label className="text-sm text-foreground">退休年數</Label>
            <Slider
              value={simulationYears}
              onValueChange={setSimulationYears}
              min={10}
              max={50}
              step={1}
              className="w-full"
            />
            <div className="text-center text-2xl font-semibold text-foreground">
              {simulationYears[0]} 年
            </div>
          </div>

          {/* Portfolio */}
          <div className="space-y-2">
            <Label className="text-sm text-foreground">投資組合</Label>
            <Select value={portfolio} onValueChange={(value: 'balanced' | 'aggressive' | 'conservative') => setPortfolio(value)}>
              <SelectTrigger className="w-full bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="balanced">平衡型 (50% 股 / 50% 債)</SelectItem>
                <SelectItem value="aggressive">積極型 (80% 股 / 20% 債)</SelectItem>
                <SelectItem value="conservative">保守型 (20% 股 / 80% 債)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data Source */}
          <div className="space-y-2">
            <Label className="text-sm text-foreground">數據來源</Label>
            <Select value={dataSource} onValueChange={(value: 'historical' | 'simulated') => setDataSource(value)}>
              <SelectTrigger className="w-full bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="historical">真實歷史數據 (1928-2024)</SelectItem>
                <SelectItem value="simulated">簡化模擬數據</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Year Range Selection - Only show for historical data */}
          {dataSource === 'historical' && (
            <div className="space-y-2">
              <Label className="text-sm text-foreground">歷史數據年份範圍</Label>
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
        </div>

        {/* Calculate Button */}
        <Button
          className="w-full h-14 text-lg font-bold bg-primary hover:bg-gold-dark text-primary-foreground"
          onClick={calculateRequiredFunds}
          disabled={isCalculating || !monthlyExpense || parseFloat(monthlyExpense) <= 0}
        >
          <Calculator className="mr-2 h-5 w-5" />
          {isCalculating ? "計算中..." : "開始計算所需退休金"}
        </Button>

        {/* Results */}
        {result && (
          <div id="result" className="space-y-4">
            {/* Main Result Card */}
            <Card className="bg-card border-border p-6">
              <h2 className="text-lg font-bold text-primary mb-4">計算結果</h2>

              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-primary mb-2">
                  {formatCurrency(result.requiredAmount)}
                </div>
                <p className="text-muted-foreground">建議退休金</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-3 bg-background rounded-lg">
                  <div className="text-2xl font-bold text-green-500">
                    {formatPercent(result.achievedSuccessRate)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">達成成功率</div>
                </div>
                <div className="text-center p-3 bg-background rounded-lg">
                  <div className="text-2xl font-bold text-foreground">
                    {formatPercent(result.targetSuccessRate)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">目標成功率</div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">每月支出：</span>
                  <span className="text-foreground font-medium">{result.monthlyExpense} 萬</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">年度支出：</span>
                  <span className="text-foreground font-medium">{result.annualExpense} 萬</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">退休年數：</span>
                  <span className="text-foreground font-medium">{result.simulationYears} 年</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">總支出：</span>
                  <span className="text-foreground font-medium">
                    約 {(result.annualExpense * result.simulationYears).toLocaleString()} 萬
                  </span>
                </div>
              </div>
            </Card>

            {/* Analysis Card */}
            <Card className="bg-card border-border p-4">
              <h3 className="text-base font-bold text-foreground mb-3">分析建議</h3>
              <div className="space-y-2 text-sm">
                {result.achievedSuccessRate >= 99 ? (
                  <p className="text-green-500">✓ 退休金非常充足，成功率極高</p>
                ) : result.achievedSuccessRate >= 97 ? (
                  <p className="text-primary">✓ 退休金充足，達成目標成功率</p>
                ) : (
                  <p className="text-orange-500">⚠ 建議增加退休金或降低支出</p>
                )}

                <p className="text-muted-foreground">
                  • 建議實際準備金額可增加 10-20% 作為緩衝
                </p>

                {result.portfolio === 'aggressive' && (
                  <p className="text-muted-foreground">
                    • 積極型投資組合波動較大，建議定期檢視
                  </p>
                )}

                <p className="text-muted-foreground">
                  • 定期檢視並調整投資組合以維持目標成功率
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReverseCalculator;
