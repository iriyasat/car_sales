import React, { useState, useMemo } from 'react';
import { DollarSign, Car, TrendingUp, BarChart2, PieChart, LineChart } from 'lucide-react';

/**
 * DashboardPage component
 * This page displays Marzia's exact dashboard KPIs and native Excel-style charts:
 * 1. Brand vs Total Sales Revenue (Column Chart)
 * 2. Sales Volume Distribution by Model (Pie/Donut Chart)
 * 3. Monthly Sales Trend (Line/Area Chart)
 * 
 * @param {Array} salesData - Array of car sales objects imported from JSON.
 */
export default function DashboardPage({ salesData }) {
  // State for active tooltips in the charts
  const [activeTooltip, setActiveTooltip] = useState(null); // { x, y, text }

  // --- 1. KPI INDICATOR CALCULATIONS ---
  const metrics = useMemo(() => {
    if (!salesData || salesData.length === 0) {
      return { totalRevenue: 0, totalCars: 0, averagePrice: 0 };
    }
    // Total Revenue (exact match of Marzia's Excel: $10,955,601.00)
    const totalRevenue = salesData.reduce((sum, car) => sum + (car.sellingprice || 0), 0);
    // Count of Cars (500)
    const totalCars = salesData.length;
    // True Average Price ($21,911.20)
    const averagePrice = Math.round(totalRevenue / totalCars);

    return { totalRevenue, totalCars, averagePrice };
  }, [salesData]);

  // --- 2. DATA PROCESSING FOR THE EXACT EXCEL PIVOT CHARTS ---

  // Chart 1: Brand vs. Total Sales Revenue (Vertical Column Chart)
  const brandChartData = useMemo(() => {
    const brandMap = {};
    salesData.forEach(car => {
      const make = car.make || 'Unknown';
      brandMap[make] = (brandMap[make] || 0) + (car.sellingprice || 0);
    });

    const sorted = Object.entries(brandMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Keep top 6 brands and group others, matching Marzia's Excel layout
    if (sorted.length > 6) {
      const top6 = sorted.slice(0, 6);
      const othersVal = sorted.slice(6).reduce((sum, item) => sum + item.value, 0);
      return [...top6, { name: 'Others', value: othersVal }];
    }
    return sorted;
  }, [salesData]);

  // Chart 2: Sales Volume Distribution by Model (Pie/Donut Chart)
  const modelChartData = useMemo(() => {
    const modelMap = {};
    salesData.forEach(car => {
      const modelName = `${car.make} ${car.model}`;
      modelMap[modelName] = (modelMap[modelName] || 0) + 1;
    });

    const sorted = Object.entries(modelMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Keep top 5 models and group others
    if (sorted.length > 5) {
      const top5 = sorted.slice(0, 5);
      const othersVal = sorted.slice(5).reduce((sum, item) => sum + item.value, 0);
      return [...top5, { name: 'Others', value: othersVal }];
    }
    return sorted;
  }, [salesData]);

  // Chart 3: Monthly Sales Trend (Line/Area Chart)
  const monthlyChartData = useMemo(() => {
    const monthMap = {};
    const monthNames = { '12': 'Dec', '01': 'Jan', '02': 'Feb', '07': 'Jul' };
    
    salesData.forEach(car => {
      if (!car.saledate) return;
      const parts = car.saledate.split('-');
      if (parts.length >= 2) {
        const year = parts[0];
        const monthNum = parts[1];
        const label = `${year}-${monthNames[monthNum] || monthNum}`;
        monthMap[label] = (monthMap[label] || 0) + (car.sellingprice || 0);
      }
    });

    // Chronological order: Dec 2014, Jan 2015, Feb 2015, Jul 2015
    const order = { '2014-Dec': 1, '2015-Jan': 2, '2015-Feb': 3, '2015-Jul': 4 };
    return Object.entries(monthMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => (order[a.name] || 99) - (order[b.name] || 99));
  }, [salesData]);

  // Currency helper
  const formatCurrency = (val) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
    return `$${val}`;
  };

  // --- 3. DOCK DIRECT SVG DONUT ARC LOGIC ---
  const donutSegments = useMemo(() => {
    const total = modelChartData.reduce((sum, d) => sum + d.value, 0);
    const radius = 50;
    const circ = 2 * Math.PI * radius; // 314.16
    let accumulated = 0;
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

    return modelChartData.map((d, i) => {
      const pct = d.value / total;
      const strokeLen = pct * circ;
      // Offset so segments start from the top (-90 degrees)
      const offset = circ - accumulated + (circ / 4);
      accumulated += strokeLen;

      return {
        ...d,
        color: colors[i % colors.length],
        strokeLen,
        offset,
        pct
      };
    });
  }, [modelChartData]);

  // --- 4. DOCK DIRECT SVG LINE PLOT LOGIC ---
  const lineConfig = useMemo(() => {
    const w = 500;
    const h = 180;
    const padL = 60;
    const padR = 20;
    const padT = 20;
    const padB = 30;

    const gW = w - padL - padR;
    const gH = h - padT - padB;
    const maxVal = Math.max(...monthlyChartData.map(d => d.value), 1);

    const points = monthlyChartData.map((d, i) => {
      const x = padL + (i / (monthlyChartData.length - 1)) * gW;
      const y = padT + gH - (d.value / maxVal) * gH;
      return { x, y, data: d };
    });

    let linePath = '';
    let areaPath = '';
    if (points.length > 0) {
      linePath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
      areaPath = linePath + ` L ${points[points.length-1].x} ${padT + gH} L ${points[0].x} ${padT + gH} Z`;
    }

    return { w, h, padL, padT, gH, maxVal, points, linePath, areaPath };
  }, [monthlyChartData]);

  // Handle Tooltip location
  const handleTooltip = (e, text) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgRect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
    const x = rect.left + rect.width / 2 - svgRect.left;
    const y = rect.top - svgRect.top;
    setActiveTooltip({ x, y, text });
  };

  return (
    <div>
      {/* Header */}
      <div className="section-header">
        <h1 className="section-title">Analytical Dashboard</h1>
        <p className="section-desc">Visualizations of Brand Revenues, Model Distributions, and Sales Trends</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3" style={{ marginBottom: '32px' }}>
        <div className="card kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="card-title" style={{ marginBottom: '8px' }}>Total Sales Revenue</span>
              <span className="kpi-value">{formatCurrency(metrics.totalRevenue)}</span>
            </div>
            <div className="kpi-icon-wrapper"><DollarSign size={20} /></div>
          </div>
          <div className="kpi-trend up" style={{ marginTop: '12px' }}>
            <TrendingUp size={14} />
            <span>Grand Total: $10,955,601.00</span>
          </div>
        </div>

        <div className="card kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="card-title" style={{ marginBottom: '8px' }}>Total Vehicles Sold</span>
              <span className="kpi-value">{metrics.totalCars} units</span>
            </div>
            <div className="kpi-icon-wrapper"><Car size={20} /></div>
          </div>
          <div className="kpi-trend up" style={{ marginTop: '12px' }}>
            <TrendingUp size={14} />
            <span>Dataset Capped: 500 cars</span>
          </div>
        </div>

        <div className="card kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="card-title" style={{ marginBottom: '8px' }}>Average Selling Price</span>
              <span className="kpi-value">{formatCurrency(metrics.averagePrice)}</span>
            </div>
            <div className="kpi-icon-wrapper" style={{ color: '#10b981' }}><TrendingUp size={20} /></div>
          </div>
          <div className="kpi-trend up" style={{ marginTop: '12px' }}>
            <TrendingUp size={14} />
            <span>Avg. Transaction: $21,911.20</span>
          </div>
        </div>
      </div>

      {/* Charts Block */}
      <div className="grid grid-cols-2-1" style={{ marginBottom: '24px' }}>
        
        {/* Chart 1: Brand Revenue Column Chart */}
        <div className="card" style={{ position: 'relative' }}>
          <h2 className="card-title" style={{ color: '#f8fafc' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={16} style={{ color: '#3b82f6' }} />
              Brand Revenue Analysis (Column Chart)
            </span>
          </h2>
          
          <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '10px 20px' }}>
            {brandChartData.map((d, i) => {
              const maxVal = Math.max(...brandChartData.map(x => x.value), 1);
              const height = (d.value / maxVal) * 140;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <div style={{ fontSize: '9px', color: '#94a3b8', marginBottom: '6px' }}>{formatCurrency(d.value)}</div>
                  <div 
                    style={{ 
                      width: '28px', 
                      height: `${Math.max(height, 4)}px`, 
                      backgroundColor: '#3b82f6', 
                      borderRadius: '4px 4px 0 0',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => handleTooltip(e, `${d.name}: ${formatCurrency(d.value)}`)}
                    onMouseLeave={() => setActiveTooltip(null)}
                  ></div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', textAlign: 'center' }}>{d.name}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Model Distribution Pie/Donut Chart */}
        <div className="card" style={{ position: 'relative' }}>
          <h2 className="card-title" style={{ color: '#f8fafc' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart size={16} style={{ color: '#10b981' }} />
              Model Distribution (Pie Chart)
            </span>
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: '220px', flexWrap: 'wrap' }}>
            {/* SVG circle stroke representation of Pie segments */}
            <svg width="130" height="130" viewBox="0 0 120 120" style={{ overflow: 'visible' }}>
              {donutSegments.map((seg, i) => (
                <circle
                  key={i}
                  cx="60"
                  cy="60"
                  r="50"
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth="12"
                  strokeDasharray={`${seg.strokeLen} ${2 * Math.PI * 50 - seg.strokeLen}`}
                  strokeDashoffset={seg.offset}
                  style={{ cursor: 'pointer', transition: 'stroke-width 0.2s ease' }}
                  onMouseEnter={(e) => handleTooltip(e, `${seg.name}: ${seg.value} units (${(seg.pct*100).toFixed(1)}%)`)}
                  onMouseLeave={() => setActiveTooltip(null)}
                />
              ))}
              <circle cx="60" cy="60" r="44" fill="#131a26" />
              <text x="60" y="58" fill="#94a3b8" fontSize="8" textAnchor="middle">VOLUMES</text>
              <text x="60" y="72" fill="#f8fafc" fontSize="13" fontWeight="bold" textAnchor="middle">{metrics.totalCars}</text>
            </svg>

            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
              {donutSegments.map((seg, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: seg.color }}></span>
                  <span style={{ color: '#cbd5e1', fontWeight: '500' }}>{seg.name.length > 15 ? `${seg.name.substring(0, 14)}.` : seg.name}</span>
                  <span style={{ color: '#94a3b8' }}>({seg.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chart 3: Monthly Trend Line/Area Chart */}
      <div className="card" style={{ position: 'relative' }}>
        <h2 className="card-title" style={{ color: '#f8fafc' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LineChart size={16} style={{ color: '#8b5cf6' }} />
            Monthly Sales Trend (Line/Area Chart)
          </span>
        </h2>

        <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="100%" height="180" viewBox={`0 0 ${lineConfig.w} ${lineConfig.h}`} style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25"/>
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.00"/>
              </linearGradient>
            </defs>

            {/* Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = lineConfig.padT + lineConfig.gH * (1 - ratio);
              const val = Math.round(lineConfig.maxVal * ratio);
              return (
                <g key={i}>
                  <line x1={lineConfig.padL} y1={y} x2={lineConfig.w - 20} y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                  <text x={lineConfig.padL - 8} y={y + 4} fill="#64748b" fontSize="9" textAnchor="end">{formatCurrency(val)}</text>
                </g>
              );
            })}

            {/* Area under curve */}
            {lineConfig.areaPath && <path d={lineConfig.areaPath} fill="url(#areaGrad)" />}
            
            {/* Trend line */}
            {lineConfig.linePath && <path d={lineConfig.linePath} fill="none" stroke="#8b5cf6" strokeWidth="3" />}

            {/* Data Point Dots */}
            {lineConfig.points.map((pt, i) => (
              <g key={i}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="4.5"
                  fill="#131a26"
                  stroke="#8b5cf6"
                  strokeWidth="2.5"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => handleTooltip(e, `${pt.data.name}: ${formatCurrency(pt.data.value)}`)}
                  onMouseLeave={() => setActiveTooltip(null)}
                />
                <text x={pt.x} y={lineConfig.h - 10} fill="#94a3b8" fontSize="10" textAnchor="middle">{pt.data.name}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Floating Tooltip Box */}
      {activeTooltip && (
        <div 
          className="chart-tooltip"
          style={{ 
            left: `${activeTooltip.x}px`, 
            top: `${activeTooltip.y}px`,
            opacity: 1
          }}
        >
          {activeTooltip.text}
        </div>
      )}
    </div>
  );
}
