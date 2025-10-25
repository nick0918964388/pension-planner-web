/**
 * 市場數據服務
 * 使用真實的歷史市場數據 (1928-2024)
 */

import historicalDataJson from '@/data/historicalReturns.json';

export interface HistoricalReturn {
  year: number;
  stockReturn: number;  // S&P 500 年度回報率
  bondReturn: number;   // 10年期公債年度回報率
  inflation: number;    // 通膨率
}

/**
 * 市場數據服務
 * 數據來源：NYU Stern (Aswath Damodaran) 和 Federal Reserve 歷史數據
 */
export class MarketDataService {
  private historicalData: HistoricalReturn[];

  constructor() {
    // 載入本地歷史數據
    this.historicalData = historicalDataJson.data as HistoricalReturn[];
  }

  /**
   * 獲取歷史年度回報率數據（從本地 JSON 文件）
   */
  async getHistoricalReturns(): Promise<HistoricalReturn[]> {
    // 模擬異步載入以保持 API 一致性
    return new Promise((resolve) => {
      setTimeout(() => {
        // 返回最新排序的數據（最新年份在前）
        const sortedData = [...this.historicalData].sort((a, b) => b.year - a.year);
        resolve(sortedData);
      }, 100);
    });
  }

  /**
   * 獲取特定年份範圍的數據
   */
  getDataByYearRange(startYear: number, endYear: number): HistoricalReturn[] {
    return this.historicalData.filter(
      (data) => data.year >= startYear && data.year <= endYear
    );
  }

  /**
   * 獲取數據統計資訊
   */
  getStatistics(): {
    stockReturn: { mean: number; stdDev: number };
    bondReturn: { mean: number; stdDev: number };
    inflation: { mean: number; stdDev: number };
  } {
    const calculate = (values: number[]) => {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance =
        values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      return { mean, stdDev: Math.sqrt(variance) };
    };

    return {
      stockReturn: calculate(this.historicalData.map((d) => d.stockReturn)),
      bondReturn: calculate(this.historicalData.map((d) => d.bondReturn)),
      inflation: calculate(this.historicalData.map((d) => d.inflation)),
    };
  }
}

/**
 * 預設的市場數據服務實例
 */
export const marketDataService = new MarketDataService();

/**
 * 使用歷史數據進行蒙地卡羅模擬的取樣函數
 */
export function sampleHistoricalReturn(
  historicalData: HistoricalReturn[],
  stockWeight: number,
  bondWeight: number
): { portfolioReturn: number; inflation: number } {
  // 從歷史數據中隨機選擇一年
  const randomYear = historicalData[Math.floor(Math.random() * historicalData.length)];

  // 計算組合回報率
  const portfolioReturn =
    randomYear.stockReturn * stockWeight +
    randomYear.bondReturn * bondWeight;

  return {
    portfolioReturn,
    inflation: randomYear.inflation
  };
}
