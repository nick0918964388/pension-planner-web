/**
 * 測試市場數據載入功能
 * 執行：node test-market-data.js
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 讀取歷史數據
const dataPath = join(__dirname, 'src', 'data', 'historicalReturns.json');
const rawData = readFileSync(dataPath, 'utf8');
const jsonData = JSON.parse(rawData);

console.log('📊 市場數據測試報告\n');
console.log('=' .repeat(60));

// 基本資訊
console.log('\n1️⃣ 基本資訊:');
console.log(`   描述: ${jsonData.description}`);
console.log(`   來源: ${jsonData.source}`);
console.log(`   數據筆數: ${jsonData.data.length} 年`);

// 年份範圍
const years = jsonData.data.map(d => d.year);
console.log(`   年份範圍: ${Math.min(...years)} - ${Math.max(...years)}`);

// 計算統計資訊
const calculateStats = (values) => {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const min = Math.min(...values);
  const max = Math.max(...values);
  return { mean, stdDev, min, max };
};

const stockReturns = jsonData.data.map(d => d.stockReturn);
const bondReturns = jsonData.data.map(d => d.bondReturn);
const inflations = jsonData.data.map(d => d.inflation);

console.log('\n2️⃣ S&P 500 統計:');
const stockStats = calculateStats(stockReturns);
console.log(`   平均回報率: ${(stockStats.mean * 100).toFixed(2)}%`);
console.log(`   標準差: ${(stockStats.stdDev * 100).toFixed(2)}%`);
console.log(`   最小值: ${(stockStats.min * 100).toFixed(2)}% (${jsonData.data.find(d => d.stockReturn === stockStats.min)?.year})`);
console.log(`   最大值: ${(stockStats.max * 100).toFixed(2)}% (${jsonData.data.find(d => d.stockReturn === stockStats.max)?.year})`);

console.log('\n3️⃣ 10年期公債統計:');
const bondStats = calculateStats(bondReturns);
console.log(`   平均回報率: ${(bondStats.mean * 100).toFixed(2)}%`);
console.log(`   標準差: ${(bondStats.stdDev * 100).toFixed(2)}%`);
console.log(`   最小值: ${(bondStats.min * 100).toFixed(2)}% (${jsonData.data.find(d => d.bondReturn === bondStats.min)?.year})`);
console.log(`   最大值: ${(bondStats.max * 100).toFixed(2)}% (${jsonData.data.find(d => d.bondReturn === bondStats.max)?.year})`);

console.log('\n4️⃣ 通膨統計:');
const inflationStats = calculateStats(inflations);
console.log(`   平均通膨率: ${(inflationStats.mean * 100).toFixed(2)}%`);
console.log(`   標準差: ${(inflationStats.stdDev * 100).toFixed(2)}%`);
console.log(`   最小值: ${(inflationStats.min * 100).toFixed(2)}% (${jsonData.data.find(d => d.inflation === inflationStats.min)?.year})`);
console.log(`   最大值: ${(inflationStats.max * 100).toFixed(2)}% (${jsonData.data.find(d => d.inflation === inflationStats.max)?.year})`);

// 顯示最近10年的數據
console.log('\n5️⃣ 最近10年數據樣本:');
console.log('   年份 | 股票回報 | 債券回報 | 通膨率');
console.log('   ' + '-'.repeat(50));
jsonData.data
  .sort((a, b) => b.year - a.year)
  .slice(0, 10)
  .forEach(d => {
    console.log(`   ${d.year} | ${(d.stockReturn * 100).toFixed(2).padStart(8)}% | ${(d.bondReturn * 100).toFixed(2).padStart(8)}% | ${(d.inflation * 100).toFixed(2).padStart(6)}%`);
  });

// 投資組合模擬示例
console.log('\n6️⃣ 投資組合回報示例 (60/40 股債配置):');
const portfolio6040 = jsonData.data.map(d => ({
  year: d.year,
  return: d.stockReturn * 0.6 + d.bondReturn * 0.4
}));
const portfolioStats = calculateStats(portfolio6040.map(p => p.return));
console.log(`   平均回報率: ${(portfolioStats.mean * 100).toFixed(2)}%`);
console.log(`   標準差: ${(portfolioStats.stdDev * 100).toFixed(2)}%`);
console.log(`   夏普比率: ${(portfolioStats.mean / portfolioStats.stdDev).toFixed(2)}`);

console.log('\n' + '='.repeat(60));
console.log('✅ 測試完成！數據載入正常，可以在應用中使用。\n');
