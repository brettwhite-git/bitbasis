import React from 'react';

const HeroChart = () => {
  // Generate consistent data points to simulate a stock chart
  const generateChartData = () => {
    // Fixed seed data to ensure consistency
    const baseData = [
      25, 28, 35, 28, 32, 38, 42, 35, 40, 45,
      48, 52, 55, 50, 58, 65, 62, 70, 75, 85
    ];
    
    return baseData;
  };

  const chartData = generateChartData();
  const max = Math.max(...chartData);
  const min = Math.min(...chartData);
  const range = max - min === 0 ? 1 : max - min;
  
  // Define dimensions at component level for reuse
  const width = 600;
  const height = 240;
  const padding = 5;
  const effectiveWidth = width - (padding * 2);
  
  // Convert data to SVG path
  const createPath = () => {
    const pathData = chartData.map((value, index) => {
      const x = padding + (index / (chartData.length - 1)) * effectiveWidth;
      const y = height - ((value - min) / range) * (height - 10);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(' ');
    
    const areaPath = `${pathData} L ${width - padding} ${height} L ${padding} ${height} Z`;
    return { pathData, areaPath };
  };

  const { pathData, areaPath } = createPath();
  
  // Calculate endpoint position
  const endpointY = height - ((chartData[chartData.length - 1]! - min) / range) * (height - 10);

  // CSS for animations as a fallback if Tailwind animations aren't working
  const animationCSS = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes lineGrow {
      from {
        stroke-dasharray: 1000;
        stroke-dashoffset: 1000;
      }
      to {
        stroke-dasharray: 1000;
        stroke-dashoffset: 0;
      }
    }
    
    @keyframes pulseLight {
      0%, 100% {
        opacity: 0.6;
      }
      50% {
        opacity: 1;
      }
    }
  `;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-xl" />
      
      {/* Main chart container */}
      <div className="relative w-full bg-[#1A1F2C]/90 rounded-xl border border-blue-500/10 shadow-lg shadow-blue-500/5 backdrop-blur-sm">
        <style>{animationCSS}</style>
        
        {/* Chart header with value */}
        <div className="px-12 py-10">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-gray-400 text-sm">Portfolio Value</h3>
              <p className="text-white text-3xl font-semibold">$24,895.62</p>
            </div>
            <div className="flex items-center">
              <span className="bg-bitcoin-orange/20 text-bitcoin-orange px-3 py-1 rounded-full text-xs font-medium border border-bitcoin-orange/30">
                +23.5% Growth
              </span>
            </div>
          </div>
        </div>
        
        {/* Chart area */}
        <div className="px-2 pb-8">
          <div className="h-[275px] w-full relative flex items-center justify-center">
            <svg 
              width="100%" 
              height="100%" 
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Grid lines */}
              <g className="grid-lines" transform={`translate(0, 5)`}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <line 
                    key={`grid-${i}`} 
                    x1={padding} 
                    y1={i * 55} 
                    x2={width - padding} 
                    y2={i * 55} 
                    stroke="#2D3748" 
                    strokeDasharray="4 4"
                  />
                ))}
              </g>

              {/* Area fill with gradient */}
              <defs>
                <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="rgba(247, 147, 26, 0.3)" />
                  <stop offset="100%" stopColor="rgba(247, 147, 26, 0)" />
                </linearGradient>
              </defs>
              <path d={areaPath} fill="url(#areaGradient)" />
              
              {/* Line path */}
              <path
                d={pathData}
                fill="none"
                stroke="#F7931A"
                strokeWidth="3"
              />
              
              {/* Enhanced endpoint visualization */}
              <g className="endpoint-indicator">
                <circle 
                  cx={width - padding} 
                  cy={endpointY} 
                  r="12" 
                  fill="rgba(247, 147, 26, 0.15)"
                />
                <circle 
                  cx={width - padding} 
                  cy={endpointY} 
                  r="6" 
                  fill="#F7931A"
                  className="animate-pulse"
                />
                <circle 
                  cx={width - padding} 
                  cy={endpointY} 
                  r="3" 
                  fill="#FFF"
                />
              </g>
            </svg>
          </div>
          
          {/* Month labels */}
          <div className="flex justify-between text-xs text-gray-500">
            <div className="grid grid-cols-6 w-full px-2">
              <span className="text-center">Jan</span>
              <span className="text-center">Feb</span>
              <span className="text-center">Mar</span>
              <span className="text-center">Apr</span>
              <span className="text-center">May</span>
              <span className="text-center">Jun</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroChart; 