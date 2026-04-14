import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import type { Stock } from "@/data/mockStocks";
import { useQuery } from "@tanstack/react-query";
import { fetchStockData } from "@/data/td3Results";
import CandlestickChart from "@/components/CandlestickChart";

interface StockChartProps {
  stock: Stock;
}

const timeFilters = [
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
];

const StockChart = ({ stock }: StockChartProps) => {
  const [range, setRange] = useState(90);

  const { data: apiData } = useQuery({
    queryKey: ["stock-api-data", stock.ticker],
    queryFn: () => fetchStockData(stock.ticker),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const data = useMemo(() => {
    // If backend data is available, prefer it
    if (apiData && apiData.length > 0) {
      const sliced = apiData.slice(-range);
      const step = Math.max(1, Math.floor(sliced.length / 80));
      return sliced.filter((_, i) => i % step === 0 || i === sliced.length - 1).map((row) => ({
        date: row.dateStr,
        price: row.close,
      }));
    }

    // Base historical series from mock data
    let hist = stock.historicalData;
    const sliced = hist.slice(-range);
    // Thin out data for performance
    const step = Math.max(1, Math.floor(sliced.length / 80));
    return sliced.filter((_, i) => i % step === 0 || i === sliced.length - 1).map((x) => ({
      date: x.date,
      price: x.price,
    }));
  }, [stock, range, apiData]);

  const candleData = useMemo(() => {
    if (data.length === 0) return [];
    return data.map((row, i) => {
      const prevClose = i > 0 ? data[i - 1].price : row.price;
      const open = prevClose;
      const close = row.price;
      const wickSpread = Math.max(Math.abs(close - open) * 0.25, close * 0.002);
      return {
        date: row.date,
        open,
        high: Math.max(open, close) + wickSpread,
        low: Math.min(open, close) - wickSpread,
        close,
      };
    });
  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-card p-6"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">Price Chart (Candlestick)</h3>
        </div>

        <div className="flex rounded-lg border border-border bg-secondary/50 p-0.5">
          {timeFilters.map((f) => (
            <button
              key={f.label}
              onClick={() => setRange(f.days)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                range === f.days ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[350px] w-full">
        <CandlestickChart data={candleData} height={350} className="w-full" />
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-[#238636]" />
          Bullish candle
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-[#da3633]" />
          Bearish candle
        </div>
      </div>
    </motion.div>
  );
};

export default StockChart;
