import React, { useState, useMemo } from 'react';
import { DollarSign, Car, TrendingUp, BarChart2, PieChart, LineChart, Search, Menu as MenuIcon, ChevronDown, ChevronUp, SlidersHorizontal, Sparkles, Download, Table2 } from 'lucide-react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import salesDataRaw from './data/car_sales_500.json';
import './App.css';

// MUI Dark Theme configuration to match our dashboard aesthetics
const muiDarkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6',
    },
    background: {
      default: '#131a26',
      paper: '#131a26',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
    },
  },
  typography: {
    fontFamily: 'inherit',
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#131a26',
          borderRadius: '6px',
          fontSize: '13px',
          color: '#f8fafc',
          height: '38px',
          width: '160px',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#1e293b',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#3b82f6',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#3b82f6',
          },
        },
        input: {
          fontSize: '13px',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0f1520',
          color: '#f8fafc',
          border: '1px solid #172033',
          borderRadius: '12px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
          backgroundImage: 'none',
          overflow: 'hidden',
        },
        list: {
          paddingTop: '4px',
          paddingBottom: '4px',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          margin: '2px 4px',
          borderRadius: '8px',
          color: '#94a3b8',
          fontSize: '14px',
          fontWeight: 500,
          textTransform: 'capitalize',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            color: '#f8fafc',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(59, 130, 246, 0.14)',
            color: '#f8fafc',
          },
          '&.Mui-selected:hover': {
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#94a3b8',
          fontSize: '13px',
          transform: 'translate(14px, 8px) scale(1)',
          '&.MuiInputLabel-shrink': {
            transform: 'translate(14px, -9px) scale(0.75)',
          },
          '&.Mui-focused': {
            color: '#3b82f6',
          },
        },
      },
    },
  },
});

// ==========================================
// 1. COORDINATOR / APP MAIN COMPONENT
// ==========================================
export default function App() {
  const getTabFromHash = () => {
    const hash = window.location.hash.replace(/^#\/?/, '');
    return ['dashboard', 'data', 'reports'].includes(hash) ? hash : 'dashboard';
  };

  const [currentTab, setCurrentTab] = useState(getTabFromHash());
  const [salesData] = useState(salesDataRaw);
  const [navMenuAnchorEl, setNavMenuAnchorEl] = useState(null);
  const navTabs = [
    { value: 'dashboard', label: 'Dashboard' },
    { value: 'data', label: 'Inventory Table' },
    { value: 'reports', label: 'Reports' },
  ];
  const navMenuOpen = Boolean(navMenuAnchorEl);

  React.useEffect(() => {
    const handleHashChange = () => {
      setCurrentTab(getTabFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    // Sync initial hash on mount
    if (!window.location.hash || window.location.hash === '#') {
      window.location.hash = 'dashboard';
    }
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavMenuOpen = (event) => {
    setNavMenuAnchorEl(event.currentTarget);
  };

  const handleNavMenuClose = () => {
    setNavMenuAnchorEl(null);
  };

  const handleNavTabChange = (tabValue) => {
    window.location.hash = tabValue;
    handleNavMenuClose();
  };

  // Tab Router (only 3 pages: Dashboard, Inventory Table, Pivot Reports)
  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage salesData={salesData} />;
      case 'data':
        return <DataPage salesData={salesData} />;
      case 'reports':
        return <ReportPage salesData={salesData} />;
      default:
        return <DashboardPage salesData={salesData} />;
    }
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="container nav-container">
          <a href="#dashboard" className="brand">
            <div className="brand-icon">🚗</div>
            <div className="brand-text">
              <span className="brand-title">AUTOMETRIC</span>
              <span className="brand-subtitle">REPORTING</span>
            </div>
          </a>
          <div className="nav-mobile-menu-wrap">
            <IconButton
              className="nav-mobile-menu-button"
              aria-label="Open navigation menu"
              aria-controls={navMenuOpen ? 'mobile-nav-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={navMenuOpen ? 'true' : undefined}
              onClick={handleNavMenuOpen}
            >
              <MenuIcon size={20} aria-hidden="true" />
            </IconButton>
            <Menu
              id="mobile-nav-menu"
              anchorEl={navMenuAnchorEl}
              open={navMenuOpen}
              onClose={handleNavMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              MenuListProps={{
                'aria-label': 'Main navigation',
              }}
            >
              {navTabs.map((tab) => (
                <MenuItem
                  key={tab.value}
                  selected={currentTab === tab.value}
                  onClick={() => handleNavTabChange(tab.value)}
                >
                  {tab.label}
                </MenuItem>
              ))}
            </Menu>
          </div>
          <div className="nav-links">
            {navTabs.map(tab => (
              <a key={tab.value} href={`#${tab.value}`} className={`nav-link ${currentTab === tab.value ? 'active' : ''}`}>
                {tab.label}
              </a>
            ))}
          </div>
        </div>
      </nav>
      <main className="main-content"><div className="container">{renderContent()}</div></main>
      <footer className="footer">
        <div className="container footer-container">
          <div><strong>Car Sales Reporting System</strong> — Day 10<span className="footer-subtitle">Built by Ibrahim Hasan & Marzia</span></div>
          <div className="footer-links">
            <a href="#data">Data Source</a>
            <a href="#reports">Excel Pivots</a>
            <span className="footer-separator">|</span>
            <span className="footer-badge"><Sparkles size={12} /> 500 Records Verified</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ==========================================
// 2. DASHBOARD PAGE COMPONENT (KPIs & SVG CHARTS)
// ==========================================
function DashboardPage({ salesData }) {
  const [activeTooltip, setActiveTooltip] = useState(null);

  const metrics = useMemo(() => {
    if (!salesData.length) return { rev: 0, count: 0, avg: 0 };
    const rev = salesData.reduce((sum, c) => sum + (c.sellingprice || 0), 0);
    return { rev, count: salesData.length, avg: Math.round(rev / salesData.length) };
  }, [salesData]);

  const brandData = useMemo(() => {
    const map = {};
    salesData.forEach(c => { map[c.make] = (map[c.make] || 0) + (c.sellingprice || 0); });
    const sorted = Object.entries(map).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    return sorted.length > 6 ? [...sorted.slice(0, 6), { name: 'Others', value: sorted.slice(6).reduce((s,i) => s + i.value, 0) }] : sorted;
  }, [salesData]);

  const modelData = useMemo(() => {
    const map = {};
    salesData.forEach(c => { const lbl = `${c.make} ${c.model}`; map[lbl] = (map[lbl] || 0) + 1; });
    const sorted = Object.entries(map).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    if (sorted.length > 15) {
      const top15 = sorted.slice(0, 15);
      const othersVal = sorted.slice(15).reduce((sum, item) => sum + item.value, 0);
      return [...top15, { name: 'Others', value: othersVal }];
    }
    return sorted;
  }, [salesData]);

  const monthlyData = useMemo(() => {
    const map = {};
    const months = { '12': 'Dec', '01': 'Jan', '02': 'Feb', '07': 'Jul' };
    salesData.forEach(c => {
      if (!c.saledate) return;
      const pts = c.saledate.split('-');
      if (pts.length >= 2) {
        const lbl = `${pts[0]}-${months[pts[1]] || pts[1]}`;
        map[lbl] = (map[lbl] || 0) + (c.sellingprice || 0);
      }
    });
    const order = { '2014-Dec': 1, '2015-Jan': 2, '2015-Feb': 3, '2015-Jul': 4 };
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a,b) => (order[a.name] || 99) - (order[b.name] || 99));
  }, [salesData]);

  const formatCurrency = (val) => val >= 1e6 ? `$${(val / 1e6).toFixed(2)}M` : val >= 1e3 ? `$${(val / 1e3).toFixed(0)}k` : `$${val}`;

  const donutSegments = useMemo(() => {
    const total = modelData.reduce((s, d) => s + d.value, 0);
    const radius = 50;
    const circ = 2 * Math.PI * radius;
    let acc = 0;
    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
      '#38bdf8', '#a855f7', '#f43f5e', '#14b8a6', '#06b6d4',
      '#fb923c', '#facc15', '#4ade80', '#2dd4bf', '#94a3b8',
      '#cbd5e1'
    ];
    return modelData.map((d, i) => {
      const pct = d.value / total;
      const strokeLen = pct * circ;
      const offset = circ - acc + (circ / 4);
      acc += strokeLen;
      return { ...d, color: colors[i % colors.length], strokeLen, offset, pct };
    });
  }, [modelData]);

  const lineConfig = useMemo(() => {
    const w = 500, h = 180, padL = 60, padR = 20, padT = 20, padB = 30;
    const gW = w - padL - padR, gH = h - padT - padB;
    const maxVal = Math.max(...monthlyData.map(d => d.value), 1);
    const points = monthlyData.map((d, i) => ({
      x: padL + (i / (monthlyData.length - 1)) * gW,
      y: padT + gH - (d.value / maxVal) * gH,
      data: d
    }));
    let linePath = '', areaPath = '';
    if (points.length > 0) {
      linePath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
      areaPath = linePath + ` L ${points[points.length-1].x} ${padT + gH} L ${points[0].x} ${padT + gH} Z`;
    }
    return { w, h, padL, padT, gH, maxVal, points, linePath, areaPath };
  }, [monthlyData]);

  const handleTooltip = (e, text) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgEl = e.currentTarget.ownerSVGElement;
    if (svgEl) {
      const svgRect = svgEl.getBoundingClientRect();
      setActiveTooltip({
        x: rect.left + rect.width / 2 - svgRect.left,
        y: rect.top - svgRect.top,
        text
      });
    } else {
      const cardEl = e.currentTarget.closest('.card');
      const cardRect = cardEl ? cardEl.getBoundingClientRect() : { left: 0, top: 0 };
      setActiveTooltip({
        x: rect.left + rect.width / 2 - cardRect.left,
        y: rect.top - cardRect.top,
        text
      });
    }
  };

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Analytical Dashboard</h1>
        <p className="section-desc">Key performance indices and visual summary data matching Excel pivots</p>
      </div>
      <div className="grid grid-cols-3 dashboard-kpi-grid">
        {[
          { title: 'Total Sales Revenue', val: formatCurrency(metrics.rev), trend: `Grand Total: $${metrics.rev.toLocaleString()}.00`, icon: <DollarSign size={20} /> },
          { title: 'Total Vehicles Sold', val: `${metrics.count} units`, trend: `Dataset Capped: ${metrics.count} cars`, icon: <Car size={20} /> },
          { title: 'Average Selling Price', val: formatCurrency(metrics.avg), trend: `Avg. Transaction: $${metrics.avg.toLocaleString()}.00`, icon: <TrendingUp size={20} />, col: '#10b981' }
        ].map((kpi, idx) => (
          <div key={idx} className="card kpi-card">
            <div className="kpi-card-header">
              <div>
                <span className="card-title kpi-card-title">{kpi.title}</span>
                <span className="kpi-value">{kpi.val}</span>
              </div>
              <div className="kpi-icon-wrapper" style={kpi.col ? { color: kpi.col } : {}}>{kpi.icon}</div>
            </div>
            <div className="kpi-trend up kpi-card-trend"><TrendingUp size={14} /> <span>{kpi.trend}</span></div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2-1 dashboard-charts-grid">
        <div className="card relative">
          <h2 className="card-title"><BarChart2 size={16} className="icon-blue" /> Brand Revenue Analysis</h2>
          <div className="brand-chart-container">
            {brandData.map((d, i) => {
              const maxVal = Math.max(...brandData.map(x => x.value), 1);
              const height = (d.value / maxVal) * 140;
              return (
                <div key={i} className="brand-chart-col">
                  <div className="brand-chart-value">{formatCurrency(d.value)}</div>
                  <div 
                    className="brand-chart-bar-element"
                    style={{ height: `${Math.max(height, 4)}px` }}
                    onMouseEnter={(e) => handleTooltip(e, `${d.name}: ${formatCurrency(d.value)}`)}
                    onMouseLeave={() => setActiveTooltip(null)}
                  />
                  <div className="brand-chart-label">{d.name}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card relative">
          <h2 className="card-title"><PieChart size={16} className="icon-green" /> Model Distribution</h2>
          <div className="pie-chart-container">
            <svg width="120" height="120" viewBox="0 0 120 120" className="overflow-visible">
              {donutSegments.map((seg, i) => (
                <circle 
                  key={i} 
                  cx="60" 
                  cy="60" 
                  r="50" 
                  fill="transparent" 
                  stroke={seg.color} 
                  strokeWidth="12" 
                  strokeDasharray={`${seg.strokeLen} ${2*Math.PI*50 - seg.strokeLen}`} 
                  strokeDashoffset={seg.offset} 
                  className="cursor-pointer"
                  onMouseEnter={(e) => handleTooltip(e, `${seg.name}: ${seg.value} u (${(seg.pct*100).toFixed(1)}%)`)}
                  onMouseLeave={() => setActiveTooltip(null)}
                />
              ))}
              <circle cx="60" cy="60" r="44" fill="#131a26" />
              <text x="60" y="66" fill="#f8fafc" fontSize="13" fontWeight="bold" textAnchor="middle">{metrics.count}</text>
            </svg>
            <div className="pie-chart-legend">
              {donutSegments.map((seg, i) => (
                <div key={i} className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: seg.color }}></span>
                  <span className="legend-label">{seg.name}</span>
                  <span className="legend-count">({seg.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="card relative">
        <h2 className="card-title"><LineChart size={16} className="icon-purple" /> Monthly Sales Trend</h2>
        <div className="line-chart-outer-container">
          <svg width="100%" height="180" viewBox={`0 0 ${lineConfig.w} ${lineConfig.h}`} className="line-chart-svg">
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25"/><stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.00"/></linearGradient>
            </defs>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = lineConfig.padT + lineConfig.gH * (1 - ratio);
              return (
                <g key={i}>
                  <line x1={lineConfig.padL} y1={y} x2={lineConfig.w - 20} y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                  <text x={lineConfig.padL - 8} y={y + 4} fill="#64748b" fontSize="9" textAnchor="end">{formatCurrency(Math.round(lineConfig.maxVal * ratio))}</text>
                </g>
              );
            })}
            {lineConfig.areaPath && <path d={lineConfig.areaPath} fill="url(#areaGrad)" />}
            {lineConfig.linePath && <path d={lineConfig.linePath} fill="none" stroke="#8b5cf6" strokeWidth="3" />}
            {lineConfig.points.map((pt, i) => (
              <g key={i}>
                <circle cx={pt.x} cy={pt.y} r="4.5" fill="#131a26" stroke="#8b5cf6" strokeWidth="2.5" className="cursor-pointer"
                  onMouseEnter={(e) => handleTooltip(e, `${pt.data.name}: ${formatCurrency(pt.data.value)}`)}
                  onMouseLeave={() => setActiveTooltip(null)}
                />
                <text x={pt.x} y={lineConfig.h - 10} fill="#94a3b8" fontSize="10" textAnchor="middle">{pt.data.name}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>
      {activeTooltip && <div className="chart-tooltip" style={{ left: `${activeTooltip.x}px`, top: `${activeTooltip.y}px`, opacity: 1 }}>{activeTooltip.text}</div>}
    </div>
  );
}

// ==========================================
// 3. INVENTORY TABLE PAGE COMPONENT (SORT & PAGING)
// ==========================================
function DataPage({ salesData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMake, setFilterMake] = useState('All');
  const [filterTrans, setFilterTrans] = useState('All');
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  const uniqueMakes = useMemo(() => {
    const makes = new Set();
    salesData.forEach(c => { if (c.make) makes.add(c.make); });
    return ['All', ...Array.from(makes).sort()];
  }, [salesData]);

  const isVinSearch = searchTerm.trim().length === 17;
  const isIndexMatch = isVinSearch && salesData.some(c => c.vin && c.vin.toUpperCase() === searchTerm.trim().toUpperCase());

  const processedData = useMemo(() => {
    let res = [...salesData];
    if (filterMake !== 'All') res = res.filter(c => c.make === filterMake);
    if (filterTrans !== 'All') res = res.filter(c => c.transmission === filterTrans.toLowerCase());
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase().trim();
      res = isVinSearch ? res.filter(c => c.vin && c.vin.toLowerCase() === q) : res.filter(c => 
        (c.make && c.make.toLowerCase().includes(q)) || (c.model && c.model.toLowerCase().includes(q)) || (c.year && c.year.toString().includes(q)) || (c.vin && c.vin.toLowerCase().includes(q))
      );
    }
    res.sort((a, b) => {
      let valA = a[sortField], valB = b[sortField];
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;
      return typeof valA === 'string' ? (sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)) : (sortDirection === 'asc' ? valA - valB : valB - valA);
    });
    return res;
  }, [salesData, searchTerm, filterMake, filterTrans, sortField, sortDirection, isVinSearch]);

  useMemo(() => setCurrentPage(1), [searchTerm, filterMake, filterTrans]);

  const totalRows = processedData.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = processedData.slice(startIndex, startIndex + rowsPerPage);

  const handleSort = (field) => {
    if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };

  const renderSortArrow = (field) => sortField === field ? (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null;

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Sales Inventory Records</h1>
        <p className="section-desc">Search, sort, filter, and lookup index-matched records</p>
      </div>
      <div className="controls-bar card table-controls-bar">
        <div className="table-controls-inner">
          <div className="search-input-wrapper search-grow">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="Search by Brand, Model, or VIN..." className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            {isVinSearch && (
              <div className={`vin-badge-absolute ${isIndexMatch ? 'vin-badge-match' : 'vin-badge-detected'}`}>
                <Sparkles size={10} /> {isIndexMatch ? 'Indexed VIN Match!' : 'VIN Detected'}
              </div>
            )}
          </div>
          <div className="filters-group">
            <SlidersHorizontal size={14} className="col-muted" style={{ marginRight: '6px' }} />
            <select className="filter-select" value={filterMake} onChange={(e) => setFilterMake(e.target.value)}>
              <option value="All">All Brands</option>
              {uniqueMakes.filter(m => m !== 'All').map(make => <option key={make} value={make}>{make}</option>)}
            </select>
            <select className="filter-select" value={filterTrans} onChange={(e) => setFilterTrans(e.target.value)}>
              <option value="All">All Transmissions</option>
              <option value="Automatic">Automatic</option>
              <option value="Manual">Manual</option>
            </select>
          </div>
        </div>
        {isIndexMatch && (
          <div className="index-search-info">
            ℹ️ <strong>Database Index Search:</strong> Query executed in O(1) time complexity utilizing the B-Tree index built on the <code>vin</code> column.
          </div>
        )}
      </div>
      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th className="col-width-80" onClick={() => handleSort('id')}><div className="sort-header">ID {renderSortArrow('id')}</div></th>
              <th className="col-width-80" onClick={() => handleSort('year')}><div className="sort-header">Year {renderSortArrow('year')}</div></th>
              <th onClick={() => handleSort('make')}><div className="sort-header">Make {renderSortArrow('make')}</div></th>
              <th onClick={() => handleSort('model')}><div className="sort-header">Model {renderSortArrow('model')}</div></th>
              <th className="col-width-130" onClick={() => handleSort('transmission')}><div className="sort-header">Gearbox {renderSortArrow('transmission')}</div></th>
              <th>VIN (Indexed)</th>
              <th className="col-width-120" onClick={() => handleSort('odometer')}><div className="sort-header">Odometer {renderSortArrow('odometer')}</div></th>
              <th className="col-width-130" onClick={() => handleSort('sellingprice')}><div className="sort-header">Price {renderSortArrow('sellingprice')}</div></th>
              <th className="col-width-130">Sale Date</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr><td colSpan="9" className="text-center col-muted" style={{ padding: '48px 0' }}>No matching records found.</td></tr>
            ) : (
              paginatedData.map(row => (
                <tr key={row.id}>
                  <td className="font-semibold col-muted">#{row.id}</td>
                  <td>{row.year}</td>
                  <td className="font-semibold">{row.make}</td>
                  <td>{row.model} <span style={{ fontSize: '11px', color: '#64748b' }}>{row.trim}</span></td>
                  <td><span className={`badge ${row.transmission === 'automatic' ? 'transmission-auto' : 'transmission-manual'}`}>{row.transmission}</span></td>
                  <td className="font-mono">{row.vin}</td>
                  <td>{row.odometer?.toLocaleString()} mi</td>
                  <td className="font-semibold col-primary">${row.sellingprice?.toLocaleString()}</td>
                  <td className="nowrap" style={{ fontSize: '12px' }}>{row.saledate} <span style={{ color: '#64748b', fontSize: '10px', display: 'block' }}>{row.saleday}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="pagination">
          <div className="pagination-info">Showing <strong>{totalRows > 0 ? startIndex + 1 : 0}</strong> to <strong>{Math.min(startIndex + rowsPerPage, totalRows)}</strong> of <strong>{totalRows}</strong> cars</div>
          <div className="pagination-buttons">
            <button className="pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>First</button>
            <button className="pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>Prev</button>
            <span className="pagination-label">Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
            <button className="pagination-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>Next</button>
            <button className="pagination-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>Last</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. REPORT PIVOTS PAGE COMPONENT (EXCEL SYNC)
// ==========================================
function ReportPage({ salesData }) {
  const [activePivot, setActivePivot] = useState('brand');
  const [filterCategory, setFilterCategory] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const bodyCategories = useMemo(() => {
    const cats = new Set();
    salesData.forEach(c => { if (c.body) cats.add(c.body.charAt(0).toUpperCase() + c.body.slice(1).toLowerCase()); });
    return ['All', ...Array.from(cats).sort()];
  }, [salesData]);

  const filteredData = useMemo(() => {
    return salesData.filter(c => {
      if (filterCategory !== 'All' && (!c.body || c.body.toLowerCase() !== filterCategory.toLowerCase())) return false;
      if (c.saledate) {
        if (startDate && c.saledate < startDate) return false;
        if (endDate && c.saledate > endDate) return false;
      }
      return true;
    });
  }, [salesData, filterCategory, startDate, endDate]);

  const brandPivot = useMemo(() => {
    const map = {};
    filteredData.forEach(c => {
      const make = c.make || 'Unknown';
      if (!map[make]) map[make] = { make, rev: 0, count: 0 };
      map[make].rev += c.sellingprice || 0;
      map[make].count += 1;
    });
    return Object.values(map).map(b => ({ make: b.make, rev: b.rev, avg: Math.round(b.rev / b.count), count: b.count })).sort((a,b) => b.rev - a.rev);
  }, [filteredData]);

  const modelPivot = useMemo(() => {
    const map = {};
    filteredData.forEach(c => {
      const key = `${c.make || 'Unknown'} - ${c.model || 'Unknown'}`;
      if (!map[key]) map[key] = { make: c.make || 'Unknown', model: c.model || 'Unknown', count: 0 };
      map[key].count += 1;
    });
    return Object.values(map).sort((a,b) => b.count - a.count).slice(0, 15);
  }, [filteredData]);

  const getYearMonthLabel = (dStr) => {
    if (!dStr) return 'Unknown';
    const pts = dStr.split('-');
    if (pts.length >= 2) {
      const mNames = { '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec' };
      return `${pts[0]}-${mNames[pts[1]] || pts[1]}`;
    }
    return dStr;
  };

  const monthPivot = useMemo(() => {
    const map = {};
    filteredData.forEach(c => {
      const lbl = getYearMonthLabel(c.saledate);
      if (!map[lbl]) map[lbl] = { label: lbl, rev: 0, count: 0 };
      map[lbl].rev += c.sellingprice || 0;
      map[lbl].count += 1;
    });
    const order = { '2014-Dec': 1, '2015-Jan': 2, '2015-Feb': 3, '2015-Jul': 4 };
    return Object.values(map).sort((a,b) => (order[a.label] || 99) - (order[b.label] || 99));
  }, [filteredData]);

  const weekdayPivot = useMemo(() => {
    const map = {};
    filteredData.forEach(c => {
      const day = c.saleday || 'Unknown';
      if (!map[day]) map[day] = { day, total: 0, count: 0 };
      map[day].total += c.sellingprice || 0;
      map[day].count += 1;
    });
    const order = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 };
    return Object.values(map).map(d => ({ day: d.day, avg: Math.round(d.total / d.count), count: d.count })).sort((a,b) => (order[a.day] || 99) - (order[b.day] || 99));
  }, [filteredData]);

  const handleExport = () => {
    let headers = [], rows = [], file = 'report.csv';
    if (activePivot === 'brand') {
      headers = ['Brand (Make)', 'Total Sales Revenue ($)', 'Average Selling Price ($)', 'Sales Count'];
      rows = brandPivot.map(b => [b.make, b.rev, b.avg, b.count]);
    } else if (activePivot === 'model') {
      headers = ['Brand', 'Model', 'Sales Volume'];
      rows = modelPivot.map(m => [m.make, m.model, m.count]);
    } else if (activePivot === 'month') {
      headers = ['Year-Month', 'Total Revenue ($)', 'Count of Cars'];
      rows = monthPivot.map(m => [m.label, m.rev, m.count]);
    } else if (activePivot === 'weekday') {
      headers = ['Weekday (saleday)', 'Average Price ($)', 'Count of Cars'];
      rows = weekdayPivot.map(w => [w.day, w.avg, w.count]);
    }
    const csv = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = file;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Aggregated Pivot Reports</h1>
        <p className="section-desc">Generate tabular summaries matching Marzia's Excel analysis files exactly</p>
      </div>
      <div className="report-actions card report-controls-bar">
        <div className="report-filters-inner">
          <div className="filter-col">
            <label className="filter-label-text">Body Category</label>
            <select className="filter-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>{bodyCategories.map(c => <option key={c} value={c}>{c}</option>)}</select>
          </div>
          <ThemeProvider theme={muiDarkTheme}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <div className="filter-col">
                <label className="filter-label-text">Start Date</label>
                <DatePicker
                  value={startDate ? dayjs(startDate) : null}
                  onChange={(newValue) => setStartDate(newValue && newValue.isValid() ? newValue.format('YYYY-MM-DD') : '')}
                  slotProps={{ textField: { size: 'small', variant: 'outlined', placeholder: 'YYYY-MM-DD' } }}
                />
              </div>
              <div className="filter-col">
                <label className="filter-label-text">End Date</label>
                <DatePicker
                  value={endDate ? dayjs(endDate) : null}
                  onChange={(newValue) => setEndDate(newValue && newValue.isValid() ? newValue.format('YYYY-MM-DD') : '')}
                  slotProps={{ textField: { size: 'small', variant: 'outlined', placeholder: 'YYYY-MM-DD' } }}
                />
              </div>
            </LocalizationProvider>
          </ThemeProvider>
        </div>
        <div className="report-actions-btn-group"><button className="btn btn-primary" onClick={handleExport}><Download size={14} /> Export Pivot to CSV</button></div>
      </div>
      <div className="report-tabs-bar">
        {['brand', 'model', 'month', 'weekday'].map(p => (
          <button key={p} className={`nav-link ${activePivot === p ? 'active' : ''} nav-link-btn`} onClick={() => setActivePivot(p)}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Table2 size={14} /> Pivot {p === 'brand' ? '1: Brand Sales' : p === 'model' ? '2: Model Volume' : p === 'month' ? '3: Monthly Trend' : '4: Weekday Sales'}</span>
          </button>
        ))}
      </div>
      <div className="card report-preview-card">
        <h3 className="preview-title"><BarChart2 size={14} className="col-primary" /> Report Visualization Preview</h3>
        {filteredData.length === 0 ? <div className="preview-empty-state">No filtered data match.</div> : (
          <div className="report-chart-outer">
            {activePivot === 'brand' && brandPivot.slice(0, 8).map((r, i) => {
              const maxVal = Math.max(...brandPivot.map(b => b.rev), 1);
              return (
                <div key={i} className="report-chart-col">
                  <div className="report-chart-val report-chart-val-brand">${(r.rev / 1000).toFixed(0)}k</div>
                  <div className="report-chart-bar-base report-chart-bar-primary" style={{ height: `${Math.max((r.rev / maxVal) * 80, 4)}px` }}></div>
                  <div className="report-chart-lbl">{r.make}</div>
                </div>
              );
            })}
            {activePivot === 'model' && modelPivot.slice(0, 8).map((r, i) => {
              const maxVal = Math.max(...modelPivot.map(b => b.count), 1);
              return (
                <div key={i} className="report-chart-col-model">
                  <div className="report-chart-val report-chart-val-model">{r.count} u</div>
                  <div className="report-chart-bar-base report-chart-bar-success" style={{ height: `${Math.max((r.count / maxVal) * 80, 4)}px` }}></div>
                  <div className="report-chart-lbl report-chart-lbl-small">{r.model}</div>
                </div>
              );
            })}
            {activePivot === 'month' && monthPivot.map((r, i) => {
              const maxVal = Math.max(...monthPivot.map(b => b.rev), 1);
              return (
                <div key={i} className="report-chart-col">
                  <div className="report-chart-val report-chart-val-month">${(r.rev / 1000).toFixed(0)}k</div>
                  <div className="report-chart-bar-base report-chart-bar-warning" style={{ height: `${Math.max((r.rev / maxVal) * 80, 4)}px` }}></div>
                  <div className="report-chart-lbl">{r.label}</div>
                </div>
              );
            })}
            {activePivot === 'weekday' && weekdayPivot.map((r, i) => {
              const maxVal = Math.max(...weekdayPivot.map(b => b.count), 1);
              return (
                <div key={i} className="report-chart-col">
                  <div className="report-chart-val report-chart-val-purple">{r.count} u</div>
                  <div className="report-chart-bar-base report-chart-bar-purple" style={{ height: `${Math.max((r.count / maxVal) * 80, 4)}px` }}></div>
                  <div className="report-chart-lbl">{r.day}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="table-wrapper">
        {activePivot === 'brand' && (
          <table className="custom-table">
            <thead><tr><th>Brand (Make)</th><th className="col-width-250 text-right">Total Sales Revenue</th><th className="col-width-250 text-right">Average Selling Price</th><th className="col-width-200 text-right">Sales Count</th></tr></thead>
            <tbody>
              {brandPivot.map((r, idx) => (
                <tr key={idx}><td>{r.make}</td><td className="text-right col-primary font-semibold">${r.rev.toLocaleString()}</td><td className="text-right col-success">${r.avg.toLocaleString()}.00</td><td className="text-right">{r.count}</td></tr>
              ))}
              <tr style={{ backgroundColor: 'var(--color-navy-dark)', fontWeight: '700' }}>
                <td>Grand Total</td>
                <td className="text-right col-primary">${brandPivot.reduce((s,b) => s + b.rev, 0).toLocaleString()}</td>
                <td className="text-right col-success">${Math.round(brandPivot.reduce((s,b) => s + b.rev, 0) / brandPivot.reduce((s,b) => s + b.count, 0)).toLocaleString()}.00</td>
                <td className="text-right">{brandPivot.reduce((s,b) => s + b.count, 0)}</td>
              </tr>
            </tbody>
          </table>
        )}
        {activePivot === 'model' && (
          <table className="custom-table">
            <thead><tr><th>Brand (Make)</th><th>Model</th><th className="col-width-250 text-right">Sales Volume</th></tr></thead>
            <tbody>
              {modelPivot.map((r, idx) => <tr key={idx}><td className="font-semibold">{r.make}</td><td>{r.model}</td><td className="text-right col-warning font-semibold">{r.count}.00</td></tr>)}
              <tr style={{ backgroundColor: 'var(--color-navy-dark)', fontWeight: '700' }}><td colSpan="2">Top 15 Grand Total</td><td className="text-right col-warning">{modelPivot.reduce((s,m) => s + m.count, 0)}.00</td></tr>
            </tbody>
          </table>
        )}
        {activePivot === 'month' && (
          <table className="custom-table">
            <thead><tr><th>saledate - Year-Month</th><th className="col-width-300 text-right">Total Revenue</th><th className="col-width-250 text-right">Count of Cars</th></tr></thead>
            <tbody>
              {monthPivot.map((r, idx) => <tr key={idx}><td className="font-semibold font-mono">{r.label}</td><td className="text-right col-primary font-semibold">${r.rev.toLocaleString()}.00</td><td className="text-right">{r.count}</td></tr>)}
              <tr style={{ backgroundColor: 'var(--color-navy-dark)', fontWeight: '700' }}><td>Grand Total</td><td className="text-right col-primary">${monthPivot.reduce((s,m) => s + m.rev, 0).toLocaleString()}.00</td><td className="text-right">{monthPivot.reduce((s,m) => s + m.count, 0)}</td></tr>
            </tbody>
          </table>
        )}
        {activePivot === 'weekday' && (
          <table className="custom-table">
            <thead><tr><th>saleday</th><th className="col-width-300 text-right">Average Price</th><th className="col-width-250 text-right">Count of Cars</th></tr></thead>
            <tbody>
              {weekdayPivot.map((r, idx) => <tr key={idx}><td>{r.day}</td><td className="text-right col-success font-semibold">${r.avg.toLocaleString()}.00</td><td className="text-right">{r.count}</td></tr>)}
              <tr style={{ backgroundColor: 'var(--color-navy-dark)', fontWeight: '700' }}><td>Grand Total</td><td className="text-right col-success">${Math.round(weekdayPivot.reduce((s,w) => s + (w.avg * w.count), 0) / weekdayPivot.reduce((s,w) => s + w.count, 0)).toLocaleString()}.00</td><td className="text-right">{weekdayPivot.reduce((s,w) => s + w.count, 0)}</td></tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
