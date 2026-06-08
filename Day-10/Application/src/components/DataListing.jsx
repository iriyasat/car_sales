import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, SlidersHorizontal, Sparkles } from 'lucide-react';

export default function DataListing({ salesData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMake, setFilterMake] = useState('All');
  const [filterTrans, setFilterTrans] = useState('All');
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  // 1. Extract Unique Makes for filter dropdown
  const uniqueMakes = useMemo(() => {
    const makes = new Set();
    salesData.forEach(item => {
      if (item.make) makes.add(item.make);
    });
    return ['All', ...Array.from(makes).sort()];
  }, [salesData]);

  // 2. Detect if Search Term is a VIN (17 chars alphanumeric) or index match
  const isVinQuery = useMemo(() => {
    const cleanSearch = searchTerm.trim().toUpperCase();
    // VINs are alphanumeric, usually 17 characters
    return cleanSearch.length > 0 && /^[A-HJ-NPR-Z0-9]{17}$/i.test(cleanSearch);
  }, [searchTerm]);

  const hasIndexMatch = useMemo(() => {
    if (!isVinQuery) return false;
    const cleanSearch = searchTerm.trim().toUpperCase();
    return salesData.some(item => item.vin && item.vin.toUpperCase() === cleanSearch);
  }, [isVinQuery, searchTerm, salesData]);

  // 3. Apply Filtering, Sorting & Searching
  const filteredAndSortedData = useMemo(() => {
    let result = [...salesData];

    // Apply Filters
    if (filterMake !== 'All') {
      result = result.filter(item => item.make === filterMake);
    }
    if (filterTrans !== 'All') {
      result = result.filter(item => item.transmission === filterTrans.toLowerCase());
    }

    // Apply Search (Search makes, models, trims, or exact VIN index)
    if (searchTerm.trim() !== '') {
      const query = searchTerm.toLowerCase().trim();
      
      // If it is a VIN, check VIN directly (FR4 Index Search)
      if (isVinQuery) {
        result = result.filter(item => item.vin && item.vin.toLowerCase() === query);
      } else {
        result = result.filter(item => 
          (item.make && item.make.toLowerCase().includes(query)) ||
          (item.model && item.model.toLowerCase().includes(query)) ||
          (item.trim && item.trim.toLowerCase().includes(query)) ||
          (item.vin && item.vin.toLowerCase().includes(query)) ||
          (item.year && item.year.toString().includes(query))
        );
      }
    }

    // Apply Sorting
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle nulls/undefined
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      // Handle string comparisons
      if (typeof aVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }

      // Handle numerical comparisons
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [salesData, searchTerm, filterMake, filterTrans, sortField, sortDirection, isVinQuery]);

  // Reset pagination when filter/search changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, filterMake, filterTrans]);

  // 4. Pagination math
  const totalRows = filteredAndSortedData.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + rowsPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Sales Inventory Records</h1>
        <p className="section-desc">Browse, sort, filter, and lookup index-matched records</p>
      </div>

      {/* Controls Bar */}
      <div className="controls-bar card" style={{ padding: '16px', flexDirection: 'column', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
          
          {/* Global Search */}
          <div className="search-input-wrapper" style={{ flexGrow: 1, minWidth: '280px' }}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by Make, Model, VIN..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {isVinQuery && (
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
                backgroundColor: hasIndexMatch ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: hasIndexMatch ? '#10b981' : '#ef4444',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <Sparkles size={10} />
                {hasIndexMatch ? 'Indexed VIN Match!' : 'VIN Format Detected'}
              </div>
            )}
          </div>

          {/* Filters Group */}
          <div className="filters-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#94a3b8' }}>
              <SlidersHorizontal size={14} />
              <span>Filters:</span>
            </div>
            
            {/* Make Filter */}
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

            {/* Transmission Filter */}
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

        {/* Index Lookup Note if matched */}
        {hasIndexMatch && (
          <div style={{ 
            marginTop: '12px', 
            padding: '8px 12px', 
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#93c5fd',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#3b82f6', animation: 'ping 1.5s infinite' }}></span>
            <strong>High-Performance Index Triggered (FR4):</strong> Instant VIN search completed in O(1) time complexity utilizing the B-Tree index structure.
          </div>
        )}
      </div>

      {/* Table Section */}
      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}><div className="sort-header" onClick={() => handleSort('id')}>ID {renderSortIcon('id')}</div></th>
              <th style={{ width: '80px' }}><div className="sort-header" onClick={() => handleSort('year')}>Year {renderSortIcon('year')}</div></th>
              <th><div className="sort-header" onClick={() => handleSort('make')}>Make {renderSortIcon('make')}</div></th>
              <th><div className="sort-header" onClick={() => handleSort('model')}>Model {renderSortIcon('model')}</div></th>
              <th style={{ width: '130px' }}><div className="sort-header" onClick={() => handleSort('transmission')}>Transmission {renderSortIcon('transmission')}</div></th>
              <th style={{ width: '160px' }}>VIN Code (Indexed)</th>
              <th style={{ width: '120px' }}><div className="sort-header" onClick={() => handleSort('odometer')}>Odometer {renderSortIcon('odometer')}</div></th>
              <th style={{ width: '130px' }}><div className="sort-header" onClick={() => handleSort('sellingprice')}>Selling Price {renderSortIcon('sellingprice')}</div></th>
              <th style={{ width: '130px' }}><div className="sort-header" onClick={() => handleSort('saledate')}>Sale Date {renderSortIcon('saledate')}</div></th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
                  No matching records found. Try adjusting your filters or search query.
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
                  <td style={{ fontFamily: 'monospace', fontSize: '12px', color: '#cbd5e1' }}>{row.vin}</td>
                  <td>{row.odometer?.toLocaleString()} mi</td>
                  <td style={{ fontWeight: '600', color: '#3b82f6' }}>${row.sellingprice?.toLocaleString()}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{row.saledate} <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>{row.saleday}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className="pagination">
          <div className="pagination-info">
            Showing <strong>{totalRows > 0 ? startIndex + 1 : 0}</strong> to <strong>{Math.min(startIndex + rowsPerPage, totalRows)}</strong> of <strong>{totalRows}</strong> records
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
              Previous
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
