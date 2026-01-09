import React, { useState, useMemo } from 'react';
import './StateFilter.css';

export default function StateFilter({ items, onStateSelect, selectedState, getStateFromItem }) {
    const [searchTerm, setSearchTerm] = useState('');

    // Extract unique states from items
    const stateStats = useMemo(() => {
        const stats = {};
        items.forEach(item => {
            const state = getStateFromItem(item);
            if (state && state.trim()) {
                const normalizedState = state.trim();
                stats[normalizedState] = (stats[normalizedState] || 0) + 1;
            }
        });
        return Object.entries(stats)
            .map(([state, count]) => ({ state, count }))
            .sort((a, b) => b.count - a.count);
    }, [items, getStateFromItem]);

    // Filter states based on search
    const filteredStates = useMemo(() => {
        if (!searchTerm.trim()) return stateStats;
        const search = searchTerm.toLowerCase();
        return stateStats.filter(({ state }) =>
            state.toLowerCase().includes(search)
        );
    }, [stateStats, searchTerm]);

    const totalItems = items.length;
    const itemsWithState = stateStats.reduce((sum, { count }) => sum + count, 0);

    return (
        <div className="state-filter-panel">
            <div className="state-filter-header">
                <h3>📍 Locations</h3>
                <span className="state-count">{stateStats.length} states</span>
            </div>

            <div className="state-search-box">
                <input
                    type="text"
                    placeholder="Search states..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="state-search-input"
                />
                {searchTerm && (
                    <button
                        className="clear-search-btn"
                        onClick={() => setSearchTerm('')}
                        title="Clear search"
                    >
                        ✕
                    </button>
                )}
            </div>

            <div className="state-list">
                {/* All States Option */}
                <div
                    className={`state-item ${!selectedState ? 'active' : ''}`}
                    onClick={() => onStateSelect(null)}
                >
                    <div className="state-info">
                        <span className="state-name">All Locations</span>
                        <span className="state-count-badge">{totalItems}</span>
                    </div>
                </div>

                {/* Individual States */}
                {filteredStates.length > 0 ? (
                    filteredStates.map(({ state, count }) => (
                        <div
                            key={state}
                            className={`state-item ${selectedState === state ? 'active' : ''}`}
                            onClick={() => onStateSelect(state)}
                        >
                            <div className="state-info">
                                <span className="state-name">{state}</span>
                                <span className="state-count-badge">{count}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    !searchTerm && (totalItems - itemsWithState) === 0 && (
                        <div className="no-states">
                            <p>No locations added yet</p>
                            <p style={{ fontSize: '0.85em', marginTop: '8px' }}>Add state/location to partners to see them here</p>
                        </div>
                    )
                )}

                {/* No State Items */}
                {(totalItems - itemsWithState) > 0 && (
                    <div
                        className={`state-item ${selectedState === '__NO_STATE__' ? 'active' : ''}`}
                        onClick={() => onStateSelect('__NO_STATE__')}
                    >
                        <div className="state-info">
                            <span className="state-name" style={{ fontStyle: 'italic', color: '#999' }}>
                                No Location
                            </span>
                            <span className="state-count-badge">{totalItems - itemsWithState}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
