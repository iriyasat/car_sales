import React, { useState, useMemo } from 'react';
import { Download, Calendar, Filter, Sparkles, Table2 } from 'lucide-react';

export default function Reports({ salesData }) {
  const [activePivot, setActivePivot] = useState('brand'); // 'brand', 'price', 'category', 'time'
  const [filterCategory, setFilterCategory] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 1. Get Unique Vehicle Categories (Body Types) for filter
  const bodyCategories = useMemo(() => {
    const categories = new Set();
    salesData.forEach(item => {
      if (item.body) {
        // Normalise name (Capitalised)
        const name = item.body.charAt(0).toUpperCase() + item.body.slice(1).toLowerCase();
        categories.add(name);
      }
    });
    return ['All', ...Array.from(categories).sort()];
  }, [salesData]);

  // 2. Filter Data for Summaries based on controls
  const filteredData = useMemo(() => {
    return salesData.filter(item => {
      // Category (Body Type) Filter
      if (filterCategory !== 'All') {
        if (!item.body || item.body.toLowerCase() !== filterCategory.toLowerCase()) {
          return false;
        }
      }
      
      // Date Filters
      if (item.saledate) {
        if (startDate && item.saledate < startDate) return false;
        if (endDate && item.saledate > endDate) return false;
      }
      
      return true;
    });
  }, [salesData, filterCategory, startDate, endDate]);

  // Pivot 1: Brand Analysis (Brand vs Total Sales Revenue & Units Sold)
  const brandPivot = useMemo(() => {
    const brandMap = {};
    filteredData.forEach(item => {
      const make = item.make || 'Unknown Make';
      if (!brandMap[make]) {
        brandMap[make] = { make, totalRevenue: 0, unitsSold: 0 };
      }
      brandMap[make].totalRevenue += item.sellingprice;
      brandMap[make].unitsSold += 1;
    });
    return Object.values(brandMap).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredData]);

  // Pivot 2: Price Analysis (Average Price by Brand)
  const pricePivot = useMemo(() => {
    const brandMap = {};
    filteredData.forEach(item => {
      const make = item.make || 'Unknown Make';
      if (!brandMap[make]) {
        brandMap[make] = { make, totalPrice: 0, unitsSold: 0 };
      }
      brandMap[make].totalPrice += item.sellingprice;
      brandMap[make].unitsSold += 1;
    });
    return Object.values(brandMap)
      .map(item => ({
        make: item.make,
        avgPrice: Math.round(item.totalPrice / item.unitsSold),
        unitsSold: item.unitsSold
      }))
      .sort((a, b) => b.avgPrice - a.avgPrice);
  }, [filteredData]);

  // Pivot 3: Category Analysis (Model/Body Type vs Sales Volume)
  const categoryPivot = useMemo(() => {
    const categoryMap = {};
    filteredData.forEach(item => {
      const body = item.body 
        ? item.body.charAt(0).toUpperCase() + item.body.slice(1).toLowerCase()
        : 'Other';
      if (!categoryMap[body]) {
        categoryMap[body] = { category: body, unitsSold: 0, totalRevenue: 0 };
      }
      categoryMap[body].unitsSold += 1;
      categoryMap[body].totalRevenue += item.sellingprice;
    });
    return Object.values(categoryMap).sort((a, b) => b.unitsSold - a.unitsSold);
  }, [filteredData]);

  // Pivot 4: Time Analysis (Monthly Sales trend & Avg Price)
  const timePivot = useMemo(() => {
    const timeMap = {};
    filteredData.forEach(item => {
      if (!item.saledate) return;
      const parts = item.saledate.split('-');
      if (parts.length >= 2) {
        const monthKey = `${parts[0]}-${parts[1]}`; // YYYY-MM
        if (!timeMap[monthKey]) {
          timeMap[monthKey] = { month: monthKey, unitsSold: 0, totalRevenue: 0 };
        }
        timeMap[monthKey].unitsSold += 1;
        timeMap[monthKey].totalRevenue += item.sellingprice;
      }
    });
    return Object.values(timeMap)
      .map(item => ({
        ...item,
        avgPrice: Math.round(item.totalRevenue / item.unitsSold)
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredData]);

  // Helper: Export active pivot report to CSV
  const handleExportCSV = () => {
    let headers = [];
    let rows = [];
    let filename = '';

    if (activePivot === 'brand') {
      headers = ['Make/Brand', 'Units Sold', 'Total Revenue ($)'];
      rows = brandPivot.map(item => [item.make, item.unitsSold, item.totalRevenue]);
      filename = `brand_sales_report_${filterCategory}.csv`;
    } else if (activePivot === 'price') {
      headers = ['Make/Brand', 'Units Sold', 'Average Selling Price ($)'];
      rows = pricePivot.map(item => [item.make, item.unitsSold, item.avgPrice]);
      filename = `brand_price_report_${filterCategory}.csv`;
    } else if (activePivot === 'category') {
      headers = ['Body Category', 'Units Sold', 'Total Revenue ($)'];
      rows = categoryPivot.map(item => [item.category, item.unitsSold, item.totalRevenue]);
      filename = `category_sales_report_${filterCategory}.csv`;
    } else if (activePivot === 'time') {
      headers = ['Year-Month', 'Units Sold', 'Average Price ($)', 'Total Revenue ($)'];
      rows = timePivot.map(item => [item.month, item.unitsSold, item.avgPrice, item.totalRevenue]);
      filename = `monthly_sales_trend_${filterCategory}.csv`;
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Aggregated Pivot Reports</h1>
        <p className="section-desc">Generate summaries, filter by category or date range, and export data</p>
      </div>

      {/* Filter Options & CSV Downloads */}
      <div className="report-actions card" style={{ padding: '18px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          
          {/* Category Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>Body Category</label>
            <select
              className="filter-select"
              style={{ padding: '8px 12px', fontSize: '13px' }}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {bodyCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Date Picker Start */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>Start Date</label>
            <div style={{ position: 'relative' }}>
              <input
                type="date"
                className="filter-select"
                style={{ padding: '8px 12px 8px 32px', fontSize: '13px' }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Calendar size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            </div>
          </div>

          {/* Date Picker End */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>End Date</label>
            <div style={{ position: 'relative' }}>
              <input
                type="date"
                className="filter-select"
                style={{ padding: '8px 12px 8px 32px', fontSize: '13px' }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <Calendar size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
          <button 
            className="btn btn-primary"
            style={{ padding: '8px 14px', fontSize: '13px' }}
            onClick={handleExportCSV}
          >
            <Download size={14} />
            Export Pivot to CSV
          </button>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        <button 
          className={`nav-link ${activePivot === 'brand' ? 'active' : ''}`}
          onClick={() => setActivePivot('brand')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Table2 size={14} />
          Pivot 1: Brand Analysis
        </button>
        <button 
          className={`nav-link ${activePivot === 'price' ? 'active' : ''}`}
          onClick={() => setActivePivot('price')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Table2 size={14} />
          Pivot 2: Price Analysis
        </button>
        <button 
          className={`nav-link ${activePivot === 'category' ? 'active' : ''}`}
          onClick={() => setActivePivot('category')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Table2 size={14} />
          Pivot 3: Category Volume
        </button>
        <button 
          className={`nav-link ${activePivot === 'time' ? 'active' : ''}`}
          onClick={() => setActivePivot('time')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Table2 size={14} />
          Pivot 4: Monthly Trend
        </button>
      </div>

      {/* Visual Chart Display for Report Page (FR compliance) */}
      <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={14} style={{ color: 'var(--color-primary)' }} />
          Report Visualization (Top Results Preview)
        </h3>
        {filteredData.length === 0 ? (
          <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>
            No visual preview available (no filtered data match)
          </div>
        ) : (
          <div style={{ height: '140px', display: 'flex', alignItems: 'flex-end', gap: '16px', paddingLeft: '16px', paddingRight: '16px', borderBottom: '1px solid var(--color-card-border)', paddingBottom: '10px', overflowX: 'auto' }}>
            {activePivot === 'brand' && brandPivot.slice(0, 10).map((row, i) => {
              const maxVal = Math.max(...brandPivot.map(b => b.totalRevenue), 1);
              const heightPercent = (row.totalRevenue / maxVal) * 100;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1', minWidth: '60px' }}>
                  <div style={{ fontSize: '9px', color: '#94a3b8', marginBottom: '4px' }}>
                    ${(row.totalRevenue / 1000).toFixed(0)}k
                  </div>
                  <div style={{ width: '100%', height: `${Math.max(heightPercent * 0.8, 4)}px`, backgroundColor: 'var(--color-primary)', borderRadius: '4px 4px 0 0', transition: 'all 0.3s ease' }}></div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '6px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                    {row.make}
                  </div>
                </div>
              );
            })}
            
            {activePivot === 'price' && pricePivot.slice(0, 10).map((row, i) => {
              const maxVal = Math.max(...pricePivot.map(b => b.avgPrice), 1);
              const heightPercent = (row.avgPrice / maxVal) * 100;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1', minWidth: '60px' }}>
                  <div style={{ fontSize: '9px', color: '#10b981', marginBottom: '4px' }}>
                    ${(row.avgPrice / 1000).toFixed(1)}k
                  </div>
                  <div style={{ width: '100%', height: `${Math.max(heightPercent * 0.8, 4)}px`, backgroundColor: '#10b981', borderRadius: '4px 4px 0 0', transition: 'all 0.3s ease' }}></div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '6px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                    {row.make}
                  </div>
                </div>
              );
            })}
            
            {activePivot === 'category' && categoryPivot.map((row, i) => {
              const maxVal = Math.max(...categoryPivot.map(b => b.unitsSold), 1);
              const heightPercent = (row.unitsSold / maxVal) * 100;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1', minWidth: '65px' }}>
                  <div style={{ fontSize: '9px', color: '#f59e0b', marginBottom: '4px' }}>
                    {row.unitsSold} units
                  </div>
                  <div style={{ width: '100%', height: `${Math.max(heightPercent * 0.8, 4)}px`, backgroundColor: '#f59e0b', borderRadius: '4px 4px 0 0', transition: 'all 0.3s ease' }}></div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '6px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                    {row.category}
                  </div>
                </div>
              );
            })}
            
            {activePivot === 'time' && timePivot.map((row, i) => {
              const maxVal = Math.max(...timePivot.map(b => b.unitsSold), 1);
              const heightPercent = (row.unitsSold / maxVal) * 100;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1', minWidth: '60px' }}>
                  <div style={{ fontSize: '9px', color: '#a855f7', marginBottom: '4px' }}>
                    {row.unitsSold} units
                  </div>
                  <div style={{ width: '100%', height: `${Math.max(heightPercent * 0.8, 4)}px`, backgroundColor: '#a855f7', borderRadius: '4px 4px 0 0', transition: 'all 0.3s ease' }}></div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '6px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                    {row.month}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Pivot Report Content */}
      <div className="table-wrapper">
        {activePivot === 'brand' && (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Make/Brand Name</th>
                <th style={{ width: '200px' }}>Units Sold</th>
                <th style={{ width: '300px' }}>Total Sales Revenue</th>
                <th style={{ width: '200px' }}>Sales Contribution</th>
              </tr>
            </thead>
            <tbody>
              {brandPivot.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>No records found for active filters</td>
                </tr>
              ) : (
                brandPivot.map((row, idx) => {
                  const totalRev = brandPivot.reduce((sum, item) => sum + item.totalRevenue, 0);
                  const contribution = totalRev > 0 ? ((row.totalRevenue / totalRev) * 100).toFixed(1) : 0;
                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: '600' }}>{row.make}</td>
                      <td>{row.unitsSold} units</td>
                      <td style={{ color: '#3b82f6', fontWeight: '600' }}>${row.totalRevenue.toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '80px', height: '6px', borderRadius: '3px', backgroundColor: 'var(--color-navy-light)', overflow: 'hidden' }}>
                            <div style={{ width: `${contribution}%`, height: '100%', backgroundColor: 'var(--color-primary)' }}></div>
                          </div>
                          <span>{contribution}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}

        {activePivot === 'price' && (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Make/Brand Name</th>
                <th style={{ width: '250px' }}>Units Count</th>
                <th style={{ width: '350px' }}>Average Selling Price</th>
                <th style={{ width: '250px' }}>Price Range Rating</th>
              </tr>
            </thead>
            <tbody>
              {pricePivot.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>No records found for active filters</td>
                </tr>
              ) : (
                pricePivot.map((row, idx) => {
                  const maxPrice = Math.max(...pricePivot.map(p => p.avgPrice), 1);
                  const ratingPercent = ((row.avgPrice / maxPrice) * 100).toFixed(0);
                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: '600' }}>{row.make}</td>
                      <td>{row.unitsSold} cars</td>
                      <td style={{ color: '#10b981', fontWeight: '600' }}>${row.avgPrice.toLocaleString()}</td>
                      <td>
                        <span className="badge" style={{ 
                          backgroundColor: row.avgPrice > 20000 ? 'rgba(239, 68, 68, 0.15)' : row.avgPrice > 12000 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: row.avgPrice > 20000 ? '#ef4444' : row.avgPrice > 12000 ? '#f59e0b' : '#10b981'
                        }}>
                          {row.avgPrice > 20000 ? 'Premium Class' : row.avgPrice > 12000 ? 'Mid Range' : 'Value Class'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}

        {activePivot === 'category' && (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Body Category (Vehicle Segment)</th>
                <th style={{ width: '250px' }}>Volume (Units Sold)</th>
                <th style={{ width: '350px' }}>Accumulated Revenue</th>
                <th style={{ width: '250px' }}>Volume Distribution</th>
              </tr>
            </thead>
            <tbody>
              {categoryPivot.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>No records found for active filters</td>
                </tr>
              ) : (
                categoryPivot.map((row, idx) => {
                  const totalUnits = categoryPivot.reduce((sum, item) => sum + item.unitsSold, 0);
                  const distribution = totalUnits > 0 ? ((row.unitsSold / totalUnits) * 100).toFixed(1) : 0;
                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: '600' }}>{row.category}</td>
                      <td>{row.unitsSold} units</td>
                      <td style={{ color: '#3b82f6', fontWeight: '600' }}>${row.totalRevenue.toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '80px', height: '6px', borderRadius: '3px', backgroundColor: 'var(--color-navy-light)', overflow: 'hidden' }}>
                            <div style={{ width: `${distribution}%`, height: '100%', backgroundColor: '#10b981' }}></div>
                          </div>
                          <span>{distribution}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}

        {activePivot === 'time' && (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Reporting Month</th>
                <th style={{ width: '250px' }}>Units Sold Count</th>
                <th style={{ width: '300px' }}>Average Transaction Value</th>
                <th style={{ width: '300px' }}>Total Sales Value</th>
              </tr>
            </thead>
            <tbody>
              {timePivot.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>No records found for active filters</td>
                </tr>
              ) : (
                timePivot.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: '600', fontFamily: 'monospace' }}>{row.month}</td>
                    <td>{row.unitsSold} units</td>
                    <td style={{ color: '#f59e0b', fontWeight: '600' }}>${row.avgPrice.toLocaleString()}</td>
                    <td style={{ color: '#3b82f6', fontWeight: '600' }}>${row.totalRevenue.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
