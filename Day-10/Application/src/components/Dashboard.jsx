import React, { useState, useMemo } from 'react';
import { DollarSign, Car, TrendingUp, BarChart3, PieChart as PieIcon, LineChart as LineIcon } from 'lucide-react';

export default function Dashboard({ salesData }) {
  const [activeTooltip, setActiveTooltip] = useState(null); // { x, y, content }

  // 1. Calculate KPI Metrics
  const metrics = useMemo(() => {
    if (!salesData.length) return { revenue: 0, count: 0, avgPrice: 0 };
    const revenue = salesData.reduce((sum, item) => sum + item.sellingprice, 0);
    const count = salesData.length;
    const avgPrice = Math.round(revenue / count);
    return { revenue, count, avgPrice };
  }, [salesData]);

  // 2. Prep data for Brand vs Total Sales Revenue (Column Chart)
  const brandChartData = useMemo(() => {
    const brandMap = {};
    salesData.forEach(item => {
      const brand = item.make || 'Unknown';
      brandMap[brand] = (brandMap[brand] || 0) + item.sellingprice;
    });

    const sortedBrands = Object.entries(brandMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Keep top 6 and group others
    if (sortedBrands.length > 6) {
      const top6 = sortedBrands.slice(0, 6);
      const othersValue = sortedBrands.slice(6).reduce((sum, item) => sum + item.value, 0);
      return [...top6, { name: 'Others', value: othersValue }];
    }
    return sortedBrands;
  }, [salesData]);

  // 3. Prep data for Sales Volume Distribution by Model (Donut Chart)
  const modelChartData = useMemo(() => {
    const modelMap = {};
    salesData.forEach(item => {
      const model = item.model || 'Unknown';
      modelMap[model] = (modelMap[model] || 0) + 1;
    });

    const sortedModels = Object.entries(modelMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Keep top 4 and group others
    if (sortedModels.length > 4) {
      const top4 = sortedModels.slice(0, 4);
      const othersCount = sortedModels.slice(4).reduce((sum, item) => sum + item.value, 0);
      return [...top4, { name: 'Others', value: othersCount }];
    }
    return sortedModels;
  }, [salesData]);

  // 4. Prep data for Monthly Sales Trend (Line/Area Chart)
  const monthlyChartData = useMemo(() => {
    const monthMap = {};
    salesData.forEach(item => {
      if (!item.saledate) return;
      // saledate is "YYYY-MM-DD" or similar
      const parts = item.saledate.split('-');
      if (parts.length >= 2) {
        const monthKey = `${parts[0]}-${parts[1]}`; // YYYY-MM
        monthMap[monthKey] = (monthMap[monthKey] || 0) + item.sellingprice;
      }
    });

    return Object.entries(monthMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [salesData]);

  // Custom Formatter for Dollar Values
  const formatCurrency = (val) => {
    if (val >= 1000000) {
      return `$${(val / 1000000).toFixed(2)}M`;
    }
    if (val >= 1000) {
      return `$${(val / 1000).toFixed(0)}k`;
    }
    return `$${val}`;
  };

  // --- SVG BAR CHART CONSTANTS & CALCULATIONS ---
  const barSvgConfig = useMemo(() => {
    const w = 550;
    const h = 260;
    const paddingLeft = 60;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 40;
    
    const maxVal = Math.max(...brandChartData.map(d => d.value), 1);
    const graphWidth = w - paddingLeft - paddingRight;
    const graphHeight = h - paddingTop - paddingBottom;
    const barWidth = Math.floor(graphWidth / brandChartData.length) - 16;
    
    return { w, h, paddingLeft, paddingTop, paddingBottom, graphWidth, graphHeight, barWidth, maxVal };
  }, [brandChartData]);

  // --- SVG DONUT CHART CALCULATIONS ---
  const donutSvgSegments = useMemo(() => {
    const size = 180;
    const radius = 70;
    const center = size / 2;
    const strokeWidth = 22;
    const circumference = 2 * Math.PI * radius;
    
    const totalCount = modelChartData.reduce((sum, d) => sum + d.value, 0);
    let accumulatedAngle = 0;
    
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#64748b'];
    
    return modelChartData.map((d, index) => {
      const percentage = d.value / totalCount;
      const strokeLength = percentage * circumference;
      const strokeOffset = circumference - accumulatedAngle + (circumference / 4); // Offset so starts at top
      accumulatedAngle += strokeLength;
      
      return {
        ...d,
        color: colors[index % colors.length],
        strokeLength,
        strokeOffset,
        percentage
      };
    });
  }, [modelChartData]);

  // --- SVG LINE CHART CONSTANTS & CALCULATIONS ---
  const lineSvgConfig = useMemo(() => {
    const w = 550;
    const h = 260;
    const paddingLeft = 60;
    const paddingRight = 20;
    const paddingTop = 25;
    const paddingBottom = 40;
    
    const graphWidth = w - paddingLeft - paddingRight;
    const graphHeight = h - paddingTop - paddingBottom;
    const maxVal = Math.max(...monthlyChartData.map(d => d.value), 1);
    
    const points = monthlyChartData.map((d, index) => {
      const x = paddingLeft + (index / Math.max(monthlyChartData.length - 1, 1)) * graphWidth;
      const y = paddingTop + graphHeight - (d.value / maxVal) * graphHeight;
      return { x, y, data: d };
    });
    
    let pathD = '';
    let areaD = '';
    
    if (points.length > 0) {
      pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
      areaD = pathD + ` L ${points[points.length-1].x} ${paddingTop + graphHeight} L ${points[0].x} ${paddingTop + graphHeight} Z`;
    }
    
    return { w, h, paddingLeft, paddingTop, graphWidth, graphHeight, maxVal, points, pathD, areaD };
  }, [monthlyChartData]);

  const handleTooltipMouseMove = (e, content) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgRect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
    
    // Position relative to the parent card container
    const x = rect.left + rect.width / 2 - svgRect.left;
    const y = rect.top - svgRect.top;
    
    setActiveTooltip({ x, y, content });
  };

  const handleTooltipMouseLeave = () => {
    setActiveTooltip(null);
  };

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Analytical Dashboard</h1>
        <p className="section-desc">Real-time performance metrics and high-level inventory insights</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3" style={{ marginBottom: '32px' }}>
        
        {/* Total Revenue KPI */}
        <div className="card kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="card-title" style={{ marginBottom: '8px' }}>Total Revenue</span>
              <span className="kpi-value">{formatCurrency(metrics.revenue)}</span>
            </div>
            <div className="kpi-icon-wrapper">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="kpi-trend up" style={{ marginTop: '12px' }}>
            <TrendingUp size={14} />
            <span>+14.2% from last month</span>
          </div>
        </div>

        {/* Total Cars Sold KPI */}
        <div className="card kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="card-title" style={{ marginBottom: '8px' }}>Cars Sold</span>
              <span className="kpi-value">{metrics.count.toLocaleString()}</span>
            </div>
            <div className="kpi-icon-wrapper">
              <Car size={20} />
            </div>
          </div>
          <div className="kpi-trend up" style={{ marginTop: '12px' }}>
            <TrendingUp size={14} />
            <span>+8.4% from last month</span>
          </div>
        </div>

        {/* Average Selling Price KPI */}
        <div className="card kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="card-title" style={{ marginBottom: '8px' }}>Avg. Selling Price</span>
              <span className="kpi-value">{formatCurrency(metrics.avgPrice)}</span>
            </div>
            <div className="kpi-icon-wrapper" style={{ color: '#10b981' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="kpi-trend up" style={{ marginTop: '12px' }}>
            <TrendingUp size={14} />
            <span>+5.1% price index rise</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-2-1" style={{ marginBottom: '24px' }}>
        
        {/* Brand vs Total Revenue Column Chart */}
        <div className="card" style={{ position: 'relative' }}>
          <div className="card-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc' }}>
              <BarChart3 size={16} className="text-primary" />
              Brand Revenue Analysis
            </span>
            <span style={{ fontSize: '12px', fontWeight: 'normal' }}>Top Brands vs Total Sales</span>
          </div>
          
          <div className="chart-container">
            {brandChartData.length === 0 ? (
              <p className="section-desc">No data available</p>
            ) : (
              <svg width="100%" height="260" viewBox={`0 0 ${barSvgConfig.w} ${barSvgConfig.h}`} style={{ overflow: 'visible' }}>
                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const y = barSvgConfig.paddingTop + barSvgConfig.graphHeight * (1 - ratio);
                  const val = Math.round(barSvgConfig.maxVal * ratio);
                  return (
                    <g key={i}>
                      <line 
                        x1={barSvgConfig.paddingLeft} 
                        y1={y} 
                        x2={barSvgConfig.w - 20} 
                        y2={y} 
                        stroke="#1e293b" 
                        strokeWidth="1" 
                        strokeDasharray="4 4" 
                      />
                      <text 
                        x={barSvgConfig.paddingLeft - 8} 
                        y={y + 4} 
                        fill="#64748b" 
                        fontSize="11" 
                        textAnchor="end"
                      >
                        {formatCurrency(val)}
                      </text>
                    </g>
                  );
                })}

                {/* Bars */}
                {brandChartData.map((d, i) => {
                  const x = barSvgConfig.paddingLeft + i * (barSvgConfig.graphWidth / brandChartData.length) + 8;
                  const barHeight = (d.value / barSvgConfig.maxVal) * barSvgConfig.graphHeight;
                  const y = barSvgConfig.paddingTop + barSvgConfig.graphHeight - barHeight;
                  return (
                    <g key={i}>
                      <rect
                        x={x}
                        y={y}
                        width={barSvgConfig.barWidth}
                        height={Math.max(barHeight, 4)}
                        rx="4"
                        className="svg-chart-bar"
                        onMouseMove={(e) => handleTooltipMouseMove(e, `${d.name}: ${formatCurrency(d.value)}`)}
                        onMouseLeave={handleTooltipMouseLeave}
                      />
                      <text
                        x={x + barSvgConfig.barWidth / 2}
                        y={barSvgConfig.h - 18}
                        fill="#94a3b8"
                        fontSize="11"
                        textAnchor="middle"
                      >
                        {d.name.length > 8 ? `${d.name.substring(0, 7)}.` : d.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
            
            {/* Custom Tooltip */}
            {activeTooltip && (
              <div 
                className="chart-tooltip"
                style={{ 
                  left: `${activeTooltip.x}px`, 
                  top: `${activeTooltip.y}px`,
                  opacity: 1
                }}
              >
                {activeTooltip.content}
              </div>
            )}
          </div>
        </div>

        {/* Model Distribution Donut Chart */}
        <div className="card">
          <div className="card-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc' }}>
              <PieIcon size={16} style={{ color: '#10b981' }} />
              Model Volume Distribution
            </span>
          </div>

          <div className="chart-container" style={{ flexDirection: 'column', gap: '16px' }}>
            {modelChartData.length === 0 ? (
              <p className="section-desc">No data available</p>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-around', flexWrap: 'wrap' }}>
                <svg width="180" height="180" viewBox="0 0 180 180" style={{ overflow: 'visible' }}>
                  <defs>
                    <filter id="shadow">
                      <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.5"/>
                    </filter>
                  </defs>
                  
                  {/* Segment arcs using stroke-dasharray */}
                  {donutSvgSegments.map((seg, i) => (
                    <circle
                      key={i}
                      cx="90"
                      cy="90"
                      r="70"
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth="20"
                      strokeDasharray={`${seg.strokeLength} ${2 * Math.PI * 70 - seg.strokeLength}`}
                      strokeDashoffset={seg.strokeOffset}
                      className="svg-chart-pie-segment"
                      onMouseMove={(e) => handleTooltipMouseMove(e, `${seg.name}: ${seg.value} cars (${Math.round(seg.percentage * 100)}%)`)}
                      onMouseLeave={handleTooltipMouseLeave}
                    />
                  ))}
                  
                  {/* Center hole for donut effect */}
                  <circle cx="90" cy="90" r="54" fill="#131a26" />
                  
                  {/* Center Text */}
                  <text x="90" y="86" fill="#94a3b8" fontSize="11" textAnchor="middle" fontWeight="500">
                    TOTAL SOLD
                  </text>
                  <text x="90" y="106" fill="#f8fafc" fontSize="20" textAnchor="middle" fontWeight="700">
                    {metrics.count}
                  </text>
                </svg>

                {/* Legend */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {donutSvgSegments.map((seg, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: seg.color }}></span>
                      <span style={{ fontWeight: '500', color: '#f8fafc' }}>{seg.name}</span>
                      <span style={{ color: '#94a3b8' }}>({seg.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTooltip && (
              <div 
                className="chart-tooltip"
                style={{ 
                  left: `${activeTooltip.x}px`, 
                  top: `${activeTooltip.y}px`,
                  opacity: 1
                }}
              >
                {activeTooltip.content}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Sales Trend Line Chart */}
      <div className="card">
        <div className="card-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc' }}>
            <LineIcon size={16} style={{ color: '#f59e0b' }} />
            Monthly Sales Trend
          </span>
          <span style={{ fontSize: '12px', fontWeight: 'normal' }}>Chronological revenue flow</span>
        </div>

        <div className="chart-container">
          {monthlyChartData.length === 0 ? (
            <p className="section-desc">No transaction history found</p>
          ) : (
            <svg width="100%" height="260" viewBox={`0 0 ${lineSvgConfig.w} ${lineSvgConfig.h}`} style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25"/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.00"/>
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = lineSvgConfig.paddingTop + lineSvgConfig.graphHeight * (1 - ratio);
                const val = Math.round(lineSvgConfig.maxVal * ratio);
                return (
                  <g key={i}>
                    <line 
                      x1={lineSvgConfig.paddingLeft} 
                      y1={y} 
                      x2={lineSvgConfig.w - 20} 
                      y2={y} 
                      stroke="#1e293b" 
                      strokeWidth="1" 
                    />
                    <text 
                      x={lineSvgConfig.paddingLeft - 8} 
                      y={y + 4} 
                      fill="#64748b" 
                      fontSize="11" 
                      textAnchor="end"
                    >
                      {formatCurrency(val)}
                    </text>
                  </g>
                );
              })}

              {/* Area Under the Line */}
              {lineSvgConfig.areaD && (
                <path d={lineSvgConfig.areaD} className="svg-chart-area" />
              )}

              {/* Trend Line */}
              {lineSvgConfig.pathD && (
                <path d={lineSvgConfig.pathD} className="svg-chart-line" />
              )}

              {/* Points & Labels */}
              {lineSvgConfig.points.map((pt, i) => {
                // Formatting month tag (e.g. 2014-12 -> Dec '14)
                const parts = pt.data.name.split('-');
                let label = pt.data.name;
                if (parts.length === 2) {
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const monthIdx = parseInt(parts[1], 10) - 1;
                  const year = parts[0].substring(2);
                  if (monthIdx >= 0 && monthIdx < 12) {
                    label = `${months[monthIdx]} '${year}`;
                  }
                }

                return (
                  <g key={i}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="5"
                      className="svg-chart-dot"
                      onMouseMove={(e) => handleTooltipMouseMove(e, `${pt.data.name}: ${formatCurrency(pt.data.value)}`)}
                      onMouseLeave={handleTooltipMouseLeave}
                    />
                    <text
                      x={pt.x}
                      y={lineSvgConfig.h - 18}
                      fill="#94a3b8"
                      fontSize="10"
                      textAnchor="middle"
                    >
                      {label}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}

          {activeTooltip && (
            <div 
              className="chart-tooltip"
              style={{ 
                left: `${activeTooltip.x}px`, 
                top: `${activeTooltip.y}px`,
                opacity: 1
              }}
            >
              {activeTooltip.content}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
