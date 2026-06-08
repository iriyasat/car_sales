import React, { useState, useMemo } from 'react';
import { Download, Calendar, Sparkles, Table2, BarChart2 } from 'lucide-react';

/**
 * ReportPage Component
 * Generates aggregated analysis tables that match Marzia's Excel/PDF outputs exactly.
 * Includes category & date filters, export actions, and simple bar chart visualizations.
 * 
 * @param {Array} salesData - Array of 500 verified sales records from JSON.
 */
export default function ReportPage({ salesData }) {
  // --- STATE CONTROLS ---
  const [activePivot, setActivePivot] = useState('brand'); // Active report selection: 'brand', 'model', 'month', 'weekday'
  const [filterCategory, setFilterCategory] = useState('All'); // Vehicle segment filter (SUV, Sedan, etc.)
  const [startDate, setStartDate] = useState(''); // Begin date boundary
  const [endDate, setEndDate] = useState(''); // End date boundary

  // --- 1. EXTRACT UNIQUE BODY TYPES FOR FILTER ---
  const bodyCategories = useMemo(() => {
    const categories = new Set();
    salesData.forEach(car => {
      if (car.body) {
        const titleCase = car.body.charAt(0).toUpperCase() + car.body.slice(1).toLowerCase();
        categories.add(titleCase);
      }
    });
    return ['All', ...Array.from(categories).sort()];
  }, [salesData]);

  // --- 2. FILTER DATA BASED ON CONTROLS ---
  const filteredData = useMemo(() => {
    return salesData.filter(car => {
      // Body type segment matching
      if (filterCategory !== 'All') {
        if (!car.body || car.body.toLowerCase() !== filterCategory.toLowerCase()) {
          return false;
        }
      }
      
      // Date range boundary matching
      if (car.saledate) {
        if (startDate && car.saledate < startDate) return false;
        if (endDate && car.saledate > endDate) return false;
      }
      
      return true;
    });
  }, [salesData, filterCategory, startDate, endDate]);

  // --- 3. DYNAMIC PIVOT CALCULATIONS MATCHING MARZIA'S PDF ---

  // Pivot 1: Brand Sales & Average Price Report
  // Columns: Brand (Make), Total Sales Revenue, Average Selling Price, Sales Count
  const brandPivot = useMemo(() => {
    const brandMap = {};
    filteredData.forEach(car => {
      const make = car.make || 'Unknown';
      if (!brandMap[make]) {
        brandMap[make] = { make, totalRevenue: 0, totalSellingPrice: 0, salesCount: 0 };
      }
      brandMap[make].totalRevenue += car.sellingprice || 0;
      brandMap[make].totalSellingPrice += car.sellingprice || 0;
      brandMap[make].salesCount += 1;
    });

    // Map averages and sort descending by total revenue (matches PDF ordering)
    return Object.values(brandMap)
      .map(b => ({
        make: b.make,
        totalRevenue: b.totalRevenue,
        avgPrice: Math.round(b.totalSellingPrice / b.salesCount),
        salesCount: b.salesCount
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredData]);

  // Pivot 2: Model vs Sales Volume (Top 15 Models)
  // Columns: Brand, Model, Sales Volume (Count)
  const modelPivot = useMemo(() => {
    const modelMap = {};
    filteredData.forEach(car => {
      // Create a unique key combining make and model
      const key = `${car.make || 'Unknown'} - ${car.model || 'Unknown'}`;
      if (!modelMap[key]) {
        modelMap[key] = { make: car.make || 'Unknown', model: car.model || 'Unknown', salesVolume: 0 };
      }
      modelMap[key].salesVolume += 1;
    });

    // Sort descending by sales volume and return the top 15
    return Object.values(modelMap)
      .sort((a, b) => b.salesVolume - a.salesVolume)
      .slice(0, 15);
  }, [filteredData]);

  // Helper function to format dates to Marzia's PDF style (e.g. 2014-12-16 -> 2014-Dec)
  const getYearMonthLabel = (dateStr) => {
    if (!dateStr) return 'Unknown';
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
      const year = parts[0];
      const monthNum = parts[1];
      const monthNames = {
        '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
        '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
        '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
      };
      return `${year}-${monthNames[monthNum] || monthNum}`;
    }
    return dateStr;
  };

  // Pivot 3: Monthly Inflow Trend (saledate - Year-Month)
  // Columns: Year-Month, Total Revenue, Count of Cars
  const monthPivot = useMemo(() => {
    const monthMap = {};
    filteredData.forEach(car => {
      const label = getYearMonthLabel(car.saledate);
      if (!monthMap[label]) {
        monthMap[label] = { label, totalRevenue: 0, countOfCars: 0 };
      }
      monthMap[label].totalRevenue += car.sellingprice || 0;
      monthMap[label].countOfCars += 1;
    });

    // Sort chronologically based on labels (e.g., 2014-Dec before 2015-Jan)
    const order = { '2014-Dec': 1, '2015-Jan': 2, '2015-Feb': 3, '2015-Jul': 4 };
    return Object.values(monthMap).sort((a, b) => (order[a.label] || 99) - (order[b.label] || 99));
  }, [filteredData]);

  // Pivot 4: Weekday Sales Analysis
  // Columns: Weekday (saleday), Average Selling Price, Count of Cars
  const weekdayPivot = useMemo(() => {
    const dayMap = {};
    filteredData.forEach(car => {
      const day = car.saleday || 'Unknown';
      if (!dayMap[day]) {
        dayMap[day] = { day, totalSellingPrice: 0, countOfCars: 0 };
      }
      dayMap[day].totalSellingPrice += car.sellingprice || 0;
      dayMap[day].countOfCars += 1;
    });

    // Calculate averages and sort by count of cars descending (or weekday sequence)
    const dayOrder = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 };
    return Object.values(dayMap)
      .map(d => ({
        day: d.day,
        avgPrice: Math.round(d.totalSellingPrice / d.countOfCars),
        countOfCars: d.countOfCars
      }))
      .sort((a, b) => (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99));
  }, [filteredData]);

  // --- 4. EXPORT TO CSV GENERATOR ---
  const handleExportCSV = () => {
    let headers = [];
    let rows = [];
    let filename = '';

    if (activePivot === 'brand') {
      headers = ['Brand (Make)', 'Total Sales Revenue ($)', 'Average Selling Price ($)', 'Sales Count'];
      rows = brandPivot.map(b => [b.make, b.totalRevenue, b.avgPrice, b.salesCount]);
      filename = 'Brand_Sales_Report.csv';
    } else if (activePivot === 'model') {
      headers = ['Brand', 'Model', 'Sales Volume'];
      rows = modelPivot.map(m => [m.make, m.model, m.salesVolume]);
      filename = 'Model_Sales_Volume_Report.csv';
    } else if (activePivot === 'month') {
      headers = ['Year-Month', 'Total Revenue ($)', 'Count of Cars'];
      rows = monthPivot.map(m => [m.label, m.totalRevenue, m.countOfCars]);
      filename = 'Monthly_Revenue_Report.csv';
    } else if (activePivot === 'weekday') {
      headers = ['Weekday (saleday)', 'Average Price ($)', 'Count of Cars'];
      rows = weekdayPivot.map(w => [w.day, w.avgPrice, w.countOfCars]);
      filename = 'Weekday_Sales_Report.csv';
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
      {/* Page Title */}
      <div className="section-header">
        <h1 className="section-title">Aggregated Pivot Reports</h1>
        <p className="section-desc">Generate tabular and visual reports matching Marzia's pivot tables exactly</p>
      </div>

      {/* Filters & Actions card */}
      <div className="report-actions card" style={{ padding: '18px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          
          {/* Segment dropdown filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>Body Style Category</label>
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

          {/* Start Date */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>Start Date</label>
            <input
              type="date"
              className="filter-select"
              style={{ padding: '8px 12px', fontSize: '13px' }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* End Date */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>End Date</label>
            <input
              type="date"
              className="filter-select"
              style={{ padding: '8px 12px', fontSize: '13px' }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Action Button */}
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

      {/* Tab Selectors for the 4 Pivot reports */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        <button 
          className={`nav-link ${activePivot === 'brand' ? 'active' : ''}`}
          onClick={() => setActivePivot('brand')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Table2 size={14} />
          Pivot 1: Brand Sales & Avg Price
        </button>
        <button 
          className={`nav-link ${activePivot === 'model' ? 'active' : ''}`}
          onClick={() => setActivePivot('model')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Table2 size={14} />
          Pivot 2: Model Sales Volume
        </button>
        <button 
          className={`nav-link ${activePivot === 'month' ? 'active' : ''}`}
          onClick={() => setActivePivot('month')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Table2 size={14} />
          Pivot 3: Monthly Trend
        </button>
        <button 
          className={`nav-link ${activePivot === 'weekday' ? 'active' : ''}`}
          onClick={() => setActivePivot('weekday')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Table2 size={14} />
          Pivot 4: Weekday Sales
        </button>
      </div>

      {/* Simple Chart Visualization (Dynamic preview for report page) */}
      <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart2 size={14} style={{ color: 'var(--color-primary)' }} />
          Report Visualization (Top Results Preview)
        </h3>
        
        {filteredData.length === 0 ? (
          <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>
            No visual preview available (no filtered data match)
          </div>
        ) : (
          <div style={{ height: '140px', display: 'flex', alignItems: 'flex-end', gap: '16px', paddingLeft: '16px', paddingRight: '16px', borderBottom: '1px solid var(--color-card-border)', paddingBottom: '10px', overflowX: 'auto' }}>
            
            {/* Visual for Brand revenue */}
            {activePivot === 'brand' && brandPivot.slice(0, 8).map((row, i) => {
              const maxVal = Math.max(...brandPivot.map(b => b.totalRevenue), 1);
              const heightPercent = (row.totalRevenue / maxVal) * 100;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1', minWidth: '60px' }}>
                  <div style={{ fontSize: '9px', color: '#94a3b8', marginBottom: '4px' }}>
                    ${(row.totalRevenue / 1000).toFixed(0)}k
                  </div>
                  <div style={{ width: '100%', height: `${Math.max(heightPercent * 0.8, 4)}px`, backgroundColor: 'var(--color-primary)', borderRadius: '4px 4px 0 0' }}></div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '6px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{row.make}</div>
                </div>
              );
            })}
            
            {/* Visual for Model sales volume */}
            {activePivot === 'model' && modelPivot.slice(0, 8).map((row, i) => {
              const maxVal = Math.max(...modelPivot.map(b => b.salesVolume), 1);
              const heightPercent = (row.salesVolume / maxVal) * 100;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1', minWidth: '70px' }}>
                  <div style={{ fontSize: '9px', color: '#10b981', marginBottom: '4px' }}>
                    {row.salesVolume} u
                  </div>
                  <div style={{ width: '100%', height: `${Math.max(heightPercent * 0.8, 4)}px`, backgroundColor: '#10b981', borderRadius: '4px 4px 0 0' }}></div>
                  <div style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '6px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{row.model}</div>
                </div>
              );
            })}
            
            {/* Visual for Monthly totals */}
            {activePivot === 'month' && monthPivot.map((row, i) => {
              const maxVal = Math.max(...monthPivot.map(b => b.totalRevenue), 1);
              const heightPercent = (row.totalRevenue / maxVal) * 100;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1', minWidth: '60px' }}>
                  <div style={{ fontSize: '9px', color: '#f59e0b', marginBottom: '4px' }}>
                    ${(row.totalRevenue / 1000).toFixed(0)}k
                  </div>
                  <div style={{ width: '100%', height: `${Math.max(heightPercent * 0.8, 4)}px`, backgroundColor: '#f59e0b', borderRadius: '4px 4px 0 0' }}></div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '6px', textAlign: 'center' }}>{row.label}</div>
                </div>
              );
            })}
            
            {/* Visual for Weekday averages */}
            {activePivot === 'weekday' && weekdayPivot.map((row, i) => {
              const maxVal = Math.max(...weekdayPivot.map(b => b.countOfCars), 1);
              const heightPercent = (row.countOfCars / maxVal) * 100;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1', minWidth: '60px' }}>
                  <div style={{ fontSize: '9px', color: '#a855f7', marginBottom: '4px' }}>
                    {row.countOfCars} u
                  </div>
                  <div style={{ width: '100%', height: `${Math.max(heightPercent * 0.8, 4)}px`, backgroundColor: '#a855f7', borderRadius: '4px 4px 0 0' }}></div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '6px', textAlign: 'center' }}>{row.day}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Aggregated Summary Tables */}
      <div className="table-wrapper">
        
        {/* Table A: Brand Sales & Average Price Report */}
        {activePivot === 'brand' && (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Brand (Make)</th>
                <th style={{ width: '250px', textAlign: 'right' }}>Total Sales Revenue</th>
                <th style={{ width: '250px', textAlign: 'right' }}>Average Selling Price</th>
                <th style={{ width: '200px', textAlign: 'right' }}>Sales Count</th>
              </tr>
            </thead>
            <tbody>
              {brandPivot.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: '600' }}>{row.make}</td>
                  <td style={{ textAlign: 'right', color: '#3b82f6', fontWeight: '600' }}>${row.totalRevenue.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', color: '#10b981' }}>${row.avgPrice.toLocaleString()}.00</td>
                  <td style={{ textAlign: 'right', fontWeight: '500', color: '#cbd5e1' }}>{row.salesCount}</td>
                </tr>
              ))}
              {/* Grand Total Footer Row */}
              <tr style={{ backgroundColor: 'var(--color-navy-dark)', fontWeight: '700' }}>
                <td>Grand Total</td>
                <td style={{ textAlign: 'right', color: '#3b82f6' }}>
                  ${brandPivot.reduce((sum, b) => sum + b.totalRevenue, 0).toLocaleString()}
                </td>
                <td style={{ textAlign: 'right', color: '#10b981' }}>
                  ${Math.round(brandPivot.reduce((sum, b) => sum + b.totalRevenue, 0) / brandPivot.reduce((sum, b) => sum + b.salesCount, 0)).toLocaleString()}.00
                </td>
                <td style={{ textAlign: 'right' }}>
                  {brandPivot.reduce((sum, b) => sum + b.salesCount, 0)}
                </td>
              </tr>
            </tbody>
          </table>
        )}

        {/* Table B: Model vs Sales Volume (Top 15) */}
        {activePivot === 'model' && (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Brand (Make)</th>
                <th>Model</th>
                <th style={{ width: '250px', textAlign: 'right' }}>Sales Volume</th>
              </tr>
            </thead>
            <tbody>
              {modelPivot.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: '600' }}>{row.make}</td>
                  <td>{row.model}</td>
                  <td style={{ textAlign: 'right', fontWeight: '600', color: '#f59e0b' }}>{row.salesVolume}.00</td>
                </tr>
              ))}
              {/* Summary Row */}
              <tr style={{ backgroundColor: 'var(--color-navy-dark)', fontWeight: '700' }}>
                <td colSpan="2">Top 15 Grand Total</td>
                <td style={{ textAlign: 'right', color: '#f59e0b' }}>
                  {modelPivot.reduce((sum, m) => sum + m.salesVolume, 0)}.00
                </td>
              </tr>
            </tbody>
          </table>
        )}

        {/* Table C: Monthly Revenue Trend */}
        {activePivot === 'month' && (
          <table className="custom-table">
            <thead>
              <tr>
                <th>saledate - Year-Month</th>
                <th style={{ width: '300px', textAlign: 'right' }}>Total Revenue</th>
                <th style={{ width: '250px', textAlign: 'right' }}>Count of Cars</th>
              </tr>
            </thead>
            <tbody>
              {monthPivot.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: '600', fontFamily: 'monospace' }}>{row.label}</td>
                  <td style={{ textAlign: 'right', color: '#3b82f6', fontWeight: '600' }}>${row.totalRevenue.toLocaleString()}.00</td>
                  <td style={{ textAlign: 'right', fontWeight: '500' }}>{row.countOfCars}</td>
                </tr>
              ))}
              {/* Summary Row */}
              <tr style={{ backgroundColor: 'var(--color-navy-dark)', fontWeight: '700' }}>
                <td>Grand Total</td>
                <td style={{ textAlign: 'right', color: '#3b82f6' }}>
                  ${monthPivot.reduce((sum, m) => sum + m.totalRevenue, 0).toLocaleString()}.00
                </td>
                <td style={{ textAlign: 'right' }}>
                  {monthPivot.reduce((sum, m) => sum + m.countOfCars, 0)}
                </td>
              </tr>
            </tbody>
          </table>
        )}

        {/* Table D: Weekday Sales Analysis */}
        {activePivot === 'weekday' && (
          <table className="custom-table">
            <thead>
              <tr>
                <th>saleday</th>
                <th style={{ width: '300px', textAlign: 'right' }}>Average Price</th>
                <th style={{ width: '250px', textAlign: 'right' }}>Count of Cars</th>
              </tr>
            </thead>
            <tbody>
              {weekdayPivot.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: '600' }}>{row.day}</td>
                  <td style={{ textAlign: 'right', color: '#10b981', fontWeight: '600' }}>${row.avgPrice.toLocaleString()}.00</td>
                  <td style={{ textAlign: 'right', fontWeight: '500' }}>{row.countOfCars}</td>
                </tr>
              ))}
              {/* Summary Row */}
              <tr style={{ backgroundColor: 'var(--color-navy-dark)', fontWeight: '700' }}>
                <td>Grand Total</td>
                <td style={{ textAlign: 'right', color: '#10b981' }}>
                  ${Math.round(weekdayPivot.reduce((sum, w) => sum + (w.avgPrice * w.countOfCars), 0) / weekdayPivot.reduce((sum, w) => sum + w.countOfCars, 0)).toLocaleString()}.00
                </td>
                <td style={{ textAlign: 'right' }}>
                  {weekdayPivot.reduce((sum, w) => sum + w.countOfCars, 0)}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
