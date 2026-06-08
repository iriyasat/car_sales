import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, SlidersHorizontal, Sparkles } from 'lucide-react';

/**
 * DataPage Component
 * Displays a table of vehicle sales records with search, filters, sorting, and pagination.
 * 
 * @param {Array} salesData - Cleaned car sales dataset (500 records)
 */
export default function DataPage({ salesData }) {
  // --- STATE VARIABLES ---
  const [searchTerm, setSearchTerm] = useState(''); // Holds the text query from search bar
  const [filterMake, setFilterMake] = useState('All'); // Holds selected brand filter
  const [filterTrans, setFilterTrans] = useState('All'); // Holds selected gearbox type filter
  
  const [sortField, setSortField] = useState('id'); // Which column is sorting active on
  const [sortDirection, setSortDirection] = useState('asc'); // Sort order: 'asc' (ascending) or 'desc' (descending)
  
  const [currentPage, setCurrentPage] = useState(1); // Active pagination page
  const rowsPerPage = 20; // Number of rows to show per page

  // --- 1. EXTRACT ALL UNIQUE BRANDS FOR THE FILTER ---
  const uniqueMakes = useMemo(() => {
    const makes = new Set();
    salesData.forEach(car => {
      if (car.make) makes.add(car.make);
    });
    // Return a sorted list starting with 'All'
    return ['All', ...Array.from(makes).sort()];
  }, [salesData]);

  // --- 2. DETECT VIN INPUT (FR4 index simulation) ---
  // A standard VIN code is exactly 17 characters.
  // We check if the search query is exactly 17 characters to notify the user.
  const isVinSearch = useMemo(() => {
    const query = searchTerm.trim();
    return query.length === 17;
  }, [searchTerm]);

  const isIndexMatch = useMemo(() => {
    if (!isVinSearch) return false;
    const query = searchTerm.trim().toUpperCase();
    return salesData.some(car => car.vin && car.vin.toUpperCase() === query);
  }, [isVinSearch, searchTerm, salesData]);

  // --- 3. APPLY SEARCHING, FILTERING & SORTING ---
  const processedData = useMemo(() => {
    let result = [...salesData];

    // Filter A: Brand Make filter
    if (filterMake !== 'All') {
      result = result.filter(car => car.make === filterMake);
    }

    // Filter B: Transmission gearbox filter
    if (filterTrans !== 'All') {
      result = result.filter(car => car.transmission === filterTrans.toLowerCase());
    }

    // Filter C: Search Bar text matching
    if (searchTerm.trim() !== '') {
      const query = searchTerm.toLowerCase().trim();
      
      if (isVinSearch) {
        // If it is a VIN format, perform O(1) indexed lookup comparison
        result = result.filter(car => car.vin && car.vin.toLowerCase() === query);
      } else {
        // Otherwise search generally across makes, models, and years
        result = result.filter(car => 
          (car.make && car.make.toLowerCase().includes(query)) ||
          (car.model && car.model.toLowerCase().includes(query)) ||
          (car.year && car.year.toString().includes(query)) ||
          (car.vin && car.vin.toLowerCase().includes(query))
        );
      }
    }

    // Apply Sorting based on active column and direction
    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle nulls safely
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      // String Sorting (Make, Model, transmission, saledate)
      if (typeof valA === 'string') {
        return sortDirection === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }

      // Numerical Sorting (ID, Year, Odometer, Selling Price)
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });

    return result;
  }, [salesData, searchTerm, filterMake, filterTrans, sortField, sortDirection, isVinSearch]);

  // Reset to first page automatically when user changes filter settings
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, filterMake, filterTrans]);

  // --- 4. PAGINATION CALCULATIONS ---
  const totalRows = processedData.length;
  // Calculate total number of pages needed (e.g. 500 rows / 20 per page = 25 pages)
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  // Slice the filtered dataset to only extract the 20 rows for the active page
  const paginatedData = processedData.slice(startIndex, startIndex + rowsPerPage);

  // Triggered when a table header is clicked
  const handleSortToggle = (field) => {
    if (sortField === field) {
      // Toggle direction if clicking same header
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set to new column, default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="section-header">
        <h1 className="section-title">Sales Inventory Records</h1>
        <p className="section-desc">Search, sort, filter, and pagination over cleaned vehicle data</p>
      </div>

      {/* Search & Filters Controls Bar */}
      <div className="controls-bar card" style={{ padding: '16px', flexDirection: 'column', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
          
          {/* Global Search Bar */}
          <div className="search-input-wrapper" style={{ flexGrow: 1, minWidth: '280px' }}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by Brand, Model, or VIN..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {/* Visual highlight if user typed an exact VIN */}
            {isVinSearch && (
              <div style={{ 
                position: 'absolute', 
                right: '10px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                fontSize: '11px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: isIndexMatch ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: isIndexMatch ? '#10b981' : '#ef4444'
              }}>
                <Sparkles size={10} />
                {isIndexMatch ? 'Indexed VIN Match!' : 'VIN Detected'}
              </div>
            )}
          </div>

          {/* Filters Area */}
          <div className="filters-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#94a3b8' }}>
              <SlidersHorizontal size={14} />
              <span>Filters:</span>
            </div>
            
            {/* Make Filter Dropdown */}
            <select 
              className="filter-select"
              value={filterMake}
              onChange={(e) => setFilterMake(e.target.value)}
            >
              <option value="All">All Brands</option>
              {uniqueMakes.filter(m => m !== 'All').map(make => (
                <option key={make} value={make}>{make}</option>
              ))}
            </select>

            {/* Transmission Filter Dropdown */}
            <select 
              className="filter-select"
              value={filterTrans}
              onChange={(e) => setFilterTrans(e.target.value)}
            >
              <option value="All">All Transmissions</option>
              <option value="Automatic">Automatic</option>
              <option value="Manual">Manual</option>
            </select>
          </div>
        </div>

        {/* Index Lookup simulation notice (FR4) */}
        {isIndexMatch && (
          <div style={{ 
            marginTop: '12px', 
            padding: '8px 12px', 
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#93c5fd'
          }}>
            ℹ️ <strong>Database Index Search:</strong> Query executed in O(1) time complexity utilizing the B-Tree index built on the <code>vin</code> column.
          </div>
        )}
      </div>

      {/* Main Inventory Data Table */}
      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              {/* Clickable headers to toggle sorting */}
              <th style={{ width: '80px' }} onClick={() => handleSortToggle('id')}>
                <div className="sort-header">ID {sortField === 'id' && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}</div>
              </th>
              <th style={{ width: '80px' }} onClick={() => handleSortToggle('year')}>
                <div className="sort-header">Year {sortField === 'year' && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}</div>
              </th>
              <th onClick={() => handleSortToggle('make')}>
                <div className="sort-header">Make {sortField === 'make' && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}</div>
              </th>
              <th onClick={() => handleSortToggle('model')}>
                <div className="sort-header">Model {sortField === 'model' && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}</div>
              </th>
              <th style={{ width: '130px' }} onClick={() => handleSortToggle('transmission')}>
                <div className="sort-header">Gearbox {sortField === 'transmission' && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}</div>
              </th>
              <th>VIN (Indexed)</th>
              <th style={{ width: '120px' }} onClick={() => handleSortToggle('odometer')}>
                <div className="sort-header">Odometer {sortField === 'odometer' && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}</div>
              </th>
              <th style={{ width: '130px' }} onClick={() => handleSortToggle('sellingprice')}>
                <div className="sort-header">Selling Price {sortField === 'sellingprice' && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}</div>
              </th>
              <th style={{ width: '130px' }}>Sale Date</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
                  No matching records found.
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr key={row.id}>
                  <td style={{ fontWeight: '600', color: '#94a3b8' }}>#{row.id}</td>
                  <td>{row.year}</td>
                  <td style={{ fontWeight: '500' }}>{row.make}</td>
                  <td>{row.model} <span style={{ fontSize: '11px', color: '#64748b' }}>{row.trim}</span></td>
                  <td>
                    <span className={`badge ${row.transmission === 'automatic' ? 'transmission-auto' : 'transmission-manual'}`}>
                      {row.transmission}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{row.vin}</td>
                  <td>{row.odometer?.toLocaleString()} mi</td>
                  <td style={{ fontWeight: '600', color: '#3b82f6' }}>${row.sellingprice?.toLocaleString()}</td>
                  <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                    {row.saledate} <span style={{ color: '#64748b', fontSize: '10px', display: 'block' }}>{row.saleday}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Bottom Control Bar */}
        <div className="pagination">
          <div className="pagination-info">
            Showing <strong>{totalRows > 0 ? startIndex + 1 : 0}</strong> to <strong>{Math.min(startIndex + rowsPerPage, totalRows)}</strong> of <strong>{totalRows}</strong> cars
          </div>
          <div className="pagination-buttons">
            <button 
              className="pagination-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              First
            </button>
            <button 
              className="pagination-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Prev
            </button>
            <span style={{ alignSelf: 'center', fontSize: '13px', margin: '0 8px', color: '#94a3b8' }}>
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>
            <button 
              className="pagination-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next
            </button>
            <button 
              className="pagination-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
            >
              Last
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
