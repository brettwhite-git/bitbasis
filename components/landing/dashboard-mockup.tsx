'use client'

import { Badge } from '@/components/ui/badge'
import { 
  LayoutDashboard,  
  PieChart,
  LineChart,
  History, 
  Calculator, 
  Settings,
} from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  ChartOptions,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler
)

export function DashboardMockup() {
  // Hardcoded chart data - aligned with KPI values
  const chartData = {
    labels: ['Oct \'24', 'Nov \'24', 'Dec \'24', 'Jan \'25', 'Feb \'25', 'Mar \'25'],
    datasets: [
      {
        label: 'Portfolio Value',
        data: [185000, 220000, 280000, 350000, 420000, 502848],
        borderColor: '#F7931A',
        backgroundColor: 'rgba(247, 147, 26, 0.2)',
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: '#F7931A',
        pointBorderColor: '#F7931A',
        borderWidth: 2,
      },
      {
        label: 'Cost Basis',
        data: [120000, 145000, 175000, 210000, 245000, 285341],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#3b82f6',
        borderWidth: 2,
      }
    ],
  }

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: '#9ca3af',
          padding: 8,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 10 }
        },
      },
      tooltip: { enabled: false },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#6b7280', font: { size: 9 } },
      },
      y: {
        display: true,
        beginAtZero: true,
        max: 600000, // Set max to accommodate Portfolio Value ($502,848) with some headroom
        ticks: { 
          color: '#6b7280', 
          font: { size: 9 },
          callback: function(value) {
            return '$' + (Number(value) / 1000).toFixed(0) + 'K'
          },
          stepSize: 100000 // Show ticks at $100K intervals
        },
        grid: { 
          color: 'rgba(255, 255, 255, 0.05)'
        },
        border: {
          display: false
        }
      },
    },
  }

  // Static weekly buy pattern data
  const weeklyData = [
    { day: 'S', height: 48 },
    { day: 'M', height: 32 },
    { day: 'T', height: 60 },
    { day: 'W', height: 88 },
    { day: 'T', height: 72 },
    { day: 'F', height: 100 },
    { day: 'S', height: 80 }
  ]

  // Static Fear & Greed data
  const fearGreedData = [
    { label: 'TODAY', value: 50, color: 'text-yellow-500', sentiment: 'Neutral' },
    { label: 'YESTERDAY', value: 37, color: 'text-orange-500', sentiment: 'Fear' },
    { label: '7D', value: 45, color: 'text-orange-500', sentiment: 'Fear' },
    { label: '1M', value: 39, color: 'text-orange-500', sentiment: 'Fear' }
  ]

  return (
    <div className="hidden lg:block">
      {/* Desktop Only - Hidden on tablet and mobile */}
        {/* Dashboard Mockup Container */}
        <div className="relative bg-gray-900/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-2xl">
          {/* Dashboard Content */}
          <div className="flex flex-row h-[500px] sm:h-[550px] md:h-[650px] lg:h-[700px]">
            {/* Left Sidebar - Static, non-interactive */}
            <aside className="w-14 bg-gray-800/30 flex flex-col items-center py-3 space-y-2">
              {/* Navigation Icons - Static visual representation */}
              <div className="flex flex-col space-y-2">
                {/* Dashboard (active state) */}
                <div className="w-7 h-7 bg-gradient-to-r from-bitcoin-orange to-[#D4A76A] rounded-md flex items-center justify-center shadow-sm">
                  <LayoutDashboard className="w-3.5 h-3.5 text-white" />
                </div>
                
                {/* Other nav items - inactive state */}
                <div className="w-7 h-7 bg-gray-700/40 rounded-md flex items-center justify-center">
                  <PieChart className="w-3.5 h-3.5 text-gray-400" />
                </div>
                
                <div className="w-7 h-7 bg-gray-700/40 rounded-md flex items-center justify-center">
                  <LineChart className="w-3.5 h-3.5 text-gray-400" />
                </div>
                
                <div className="w-7 h-7 bg-gray-700/40 rounded-md flex items-center justify-center">
                  <History className="w-3.5 h-3.5 text-gray-400" />
                </div>
                
                <div className="w-7 h-7 bg-gray-700/40 rounded-md flex items-center justify-center">
                  <Calculator className="w-3.5 h-3.5 text-gray-400" />
                </div>
                
                <div className="w-7 h-7 bg-gray-700/40 rounded-md flex items-center justify-center">
                  <Settings className="w-3.5 h-3.5 text-gray-400" />
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-3 sm:p-3 md:p-4 lg:p-6 overflow-y-auto overflow-x-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 sm:mb-5 lg:mb-6 flex-shrink-0">
                <h1 className="text-2xl sm:text-2xl md:text-3xl lg:text-3xl font-bold tracking-tight text-white">Overview Dashboard</h1>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Badge className="bg-gradient-to-r from-bitcoin-orange to-[#D4A76A] text-white border-none text-xs font-semibold px-2.5 py-0.5">
                    PRO
                  </Badge>
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-medium">B</span>
                  </div>
                </div>
              </div>

              {/* Metrics Grid - Responsive columns */}
              <div className="w-full grid gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 grid-cols-6 mb-2 sm:mb-2 md:mb-3 lg:mb-4 flex-shrink-0">
                <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-2 sm:p-3 md:p-4 lg:p-6 shadow-md backdrop-blur-sm h-[90px] sm:h-[95px] md:h-[105px] lg:h-[110px]">
                  <div className="relative z-10 flex flex-col h-full text-left">
                    <h3 className="text-xs sm:text-xs md:text-sm font-medium text-gray-400 mb-0.5 sm:mb-1 truncate">Portfolio Value</h3>
                    <div className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-bitcoin-orange mb-0.5 truncate">$502,847.65</div>
                    <p className="text-[10px] sm:text-xs md:text-sm lg:text-[10px] text-gray-400 truncate mb-0.5">+12.47% from last month</p>
                    <div className="flex-grow"></div>
                  </div>
                </div>
                
                <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-2 sm:p-3 md:p-4 lg:p-6 shadow-md backdrop-blur-sm h-[90px] sm:h-[95px] md:h-[105px] lg:h-[110px]">
                  <div className="relative z-10 flex flex-col h-full text-left">
                    <h3 className="text-xs sm:text-xs md:text-sm font-medium text-gray-400 mb-0.5 sm:mb-1 truncate">Total Cost Basis</h3>
                    <div className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-bitcoin-orange mb-0.5 truncate">$285,340.50</div>
                    <p className="text-[10px] sm:text-xs md:text-sm lg:text-[10px] text-gray-400 truncate mb-0.5">4.7856 BTC acquired</p>
                    <div className="flex-grow"></div>
                  </div>
                </div>
                
                <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-2 sm:p-3 md:p-4 lg:p-6 shadow-md backdrop-blur-sm h-[90px] sm:h-[95px] md:h-[105px] lg:h-[110px]">
                  <div className="relative z-10 flex flex-col h-full text-left">
                    <h3 className="text-xs sm:text-xs md:text-sm font-medium text-gray-400 mb-0.5 sm:mb-1 truncate">Unrealized Gains</h3>
                    <div className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-bitcoin-orange mb-0.5 truncate">+$217,507.15</div>
                    <p className="text-[10px] sm:text-xs md:text-sm lg:text-[10px] text-gray-400 truncate mb-0.5">+76.19% ROI</p>
                    <div className="flex-grow"></div>
                  </div>
                </div>
                
                <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-2 sm:p-3 md:p-4 lg:p-6 shadow-md backdrop-blur-sm h-[90px] sm:h-[95px] md:h-[105px] lg:h-[110px]">
                  <div className="relative z-10 flex flex-col h-full text-left">
                    <h3 className="text-xs sm:text-xs md:text-sm font-medium text-gray-400 mb-0.5 sm:mb-1 truncate">Average Buy Price</h3>
                    <div className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-bitcoin-orange mb-0.5 truncate">$59,627.84</div>
                    <p className="text-[10px] sm:text-xs md:text-sm lg:text-[10px] text-gray-400 truncate mb-0.5">Per Bitcoin</p>
                    <div className="flex-grow"></div>
                  </div>
                </div>
                
                <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-2 sm:p-3 md:p-4 lg:p-6 shadow-md backdrop-blur-sm h-[90px] sm:h-[95px] md:h-[105px] lg:h-[110px]">
                  <div className="relative z-10 flex flex-col h-full text-left">
                    <h3 className="text-xs sm:text-xs md:text-sm font-medium text-gray-400 mb-0.5 sm:mb-1 truncate">HODL Time</h3>
                    <div className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-bitcoin-orange mb-0.5 truncate">2945 days</div>
                    <p className="text-[10px] sm:text-xs md:text-sm lg:text-[10px] text-gray-400 truncate mb-0.5">Since Last Sell</p>
                    <div className="flex-grow"></div>
                  </div>
                </div>
                
                <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-2 sm:p-3 md:p-4 lg:p-6 shadow-md backdrop-blur-sm h-[90px] sm:h-[95px] md:h-[105px] lg:h-[110px]">
                  <div className="relative z-10 flex flex-col h-full text-left">
                    <h3 className="text-xs sm:text-xs md:text-sm font-medium text-gray-400 mb-0.5 sm:mb-1 truncate">Tax Liability</h3>
                    <div className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-bitcoin-orange mb-0.5 truncate">$43,501.14</div>
                    <p className="text-[10px] sm:text-xs md:text-sm lg:text-[10px] text-gray-400 truncate mb-0.5">FIFO method</p>
                    <div className="flex-grow"></div>
                  </div>
                </div>
              </div>

              {/* Chart and Widgets Section - Responsive layout */}
              <div className="w-full grid gap-2 sm:gap-2 md:gap-3 lg:gap-4 grid-cols-3 flex-1 min-h-0">
                {/* Main Chart - Always 2 columns on desktop, full width on smaller */}
                <div className="col-span-2 flex flex-col relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-1.5 sm:p-2 md:p-3 pb-1 shadow-md backdrop-blur-sm">
                  <div className="flex flex-row items-start justify-between pb-1 flex-shrink-0">
                    <h3 className="text-xs sm:text-sm font-bold text-white">Portfolio Summary</h3>
                    <div className="flex items-center gap-1">
                      <button className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded-md text-xs text-white font-medium transition-colors">6M</button>
                      <button className="px-3 py-1 text-xs text-gray-400 transition-colors">1Y</button>
                    </div>
                  </div>
                  
                  <div className="flex-grow min-h-0 relative">
                    <Line options={chartOptions} data={chartData} />
                  </div>
                </div>

                {/* Right Panel Widgets - Always 1 column */}
                <div className="col-span-1 lg:col-span-1 flex flex-col gap-2 sm:gap-3 md:gap-4">
                  {/* Savings Goal Widget - Static */}
                  <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-1.5 sm:p-2 md:p-3 shadow-md backdrop-blur-sm flex-1 min-h-0">
                    <div className="relative z-10 h-full flex flex-col">
                      <div className="flex flex-row items-center justify-between mb-1 flex-shrink-0">
                        <h3 className="text-xs sm:text-sm font-bold text-white truncate">My Savings Goal</h3>
                      </div>
                      <div className="space-y-1 flex-grow">
                        <div className="flex justify-between items-start gap-1">
                          <div className="flex-shrink">
                            <div className="text-xs sm:text-sm md:text-base font-bold text-bitcoin-orange truncate">$6,757</div>
                            <p className="text-xs text-gray-400 truncate">0.15 BTC</p>
                            <p className="text-xs text-gray-400 truncate">$500/wk</p>
                          </div>
                          
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-bold text-bitcoin-orange whitespace-nowrap">
                              5.9M/15M <span className="text-xs">sats</span>
                            </p>
                            <p className="text-xs sm:text-sm font-bold text-white">39%</p>
                            <p className="text-xs text-gray-400 whitespace-nowrap">1y 5mo</p>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                          <div className="bg-bitcoin-orange h-full rounded-full" style={{ width: '39%' }}></div>
                        </div>
                        
                        <div className="flex justify-between text-xs text-gray-400">
                          <span className="truncate">Aug &apos;25</span>
                          <span className="truncate">Mar &apos;27</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fear & Greed Index - Static */}
                  <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-1.5 sm:p-2 md:p-3 shadow-md backdrop-blur-sm flex-1 min-h-0">
                    <div className="relative z-10 h-full flex flex-col">
                      <div className="flex flex-row items-center justify-between mb-1 flex-shrink-0">
                        <h3 className="text-xs sm:text-sm font-bold text-white truncate">Fear & Greed Index</h3>
                      </div>
                      <div className="flex justify-around items-center gap-1 flex-grow">
                        {fearGreedData.map((item, index) => (
                          <div key={index} className="text-center flex flex-col items-center justify-center">
                            <div className="text-xs text-gray-400 uppercase mb-0.5">{item.label}</div>
                            <div className="relative w-8 h-8 sm:w-10 sm:h-10">
                              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 56 56">
                                <circle
                                  cx="28"
                                  cy="28"
                                  r="20"
                                  stroke="#374151"
                                  strokeWidth="4"
                                  fill="none"
                                />
                                <circle
                                  cx="28"
                                  cy="28"
                                  r="20"
                                  className={item.color.replace('text-', 'stroke-')}
                                  strokeWidth="4"
                                  fill="none"
                                  strokeDasharray="126"
                                  strokeDashoffset={126 - (126 * item.value / 100)}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-medium text-white">{item.value}</span>
                              </div>
                            </div>
                            <div className={`text-xs ${item.color} mt-0.5 truncate`}>{item.sentiment}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Weekly Buy Pattern - Static */}
                  <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-1.5 sm:p-2 md:p-3 shadow-md backdrop-blur-sm flex flex-col flex-1 min-h-0">
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex flex-row items-center justify-between mb-1 flex-shrink-0">
                        <h3 className="text-xs sm:text-sm font-bold text-white truncate">Weekly Buy Pattern</h3>
                      </div>
                      <div className="flex flex-col justify-end flex-grow min-h-0">
                        <div className="flex-grow w-full">
                          <div className="flex items-end justify-between h-full gap-0.5 sm:gap-1">
                            {weeklyData.map((item, index) => (
                              <div key={index} className="flex flex-col items-center flex-1 h-full justify-end">
                                <div
                                  className="bg-bitcoin-orange rounded-t w-1/4 mb-1"
                                  style={{ height: `${item.height}%` }}
                                ></div>
                                <span className="text-xs text-gray-400">{item.day}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
    </div>
  )
}
