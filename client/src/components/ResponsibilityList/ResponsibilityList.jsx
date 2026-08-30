import React from 'react';
import { ResponsibilityCard } from '../ResponsibilityCard/ResponsibilityCard.jsx';
import { Search, Filter, Plus, Inbox } from 'lucide-react';

export function ResponsibilityList({
  items = [],
  loading = false,
  filters = {},
  onFilterChange,
  onOpenCreateModal,
}) {
  return (
    <div className="space-y-4">
      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-surface/80 border border-border/80 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search obligations, documents, deadlines..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-hover/70 border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary-500 transition"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Priority */}
          <select
            value={filters.priority || ''}
            onChange={(e) => onFilterChange({ priority: e.target.value })}
            className="px-3 py-2 rounded-xl bg-surface-hover/70 border border-border text-xs text-foreground focus:outline-none focus:border-primary-500"
          >
            <option value="">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Category */}
          <select
            value={filters.category || ''}
            onChange={(e) => onFilterChange({ category: e.target.value })}
            className="px-3 py-2 rounded-xl bg-surface-hover/70 border border-border text-xs text-foreground focus:outline-none focus:border-primary-500"
          >
            <option value="">All Categories</option>
            <option value="EDUCATION">Education</option>
            <option value="WORK">Work</option>
            <option value="FINANCE">Finance</option>
            <option value="HEALTH">Health</option>
            <option value="GOVERNMENT">Government</option>
            <option value="TRAVEL">Travel</option>
            <option value="PERSONAL">Personal</option>
          </select>

          {/* Status */}
          <select
            value={filters.status || ''}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="px-3 py-2 rounded-xl bg-surface-hover/70 border border-border text-xs text-foreground focus:outline-none focus:border-primary-500"
          >
            <option value="">All Statuses</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="BLOCKED">Blocked</option>
            <option value="WAITING">Waiting</option>
            <option value="COMPLETED">Completed</option>
          </select>

          {onOpenCreateModal && (
            <button
              onClick={onOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-primary-600/20 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Responsibilities */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-48 rounded-2xl bg-surface/40 animate-pulse border border-border" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-surface/30 border border-dashed border-border/80 space-y-3">
          <Inbox className="w-12 h-12 mx-auto text-muted/50" />
          <h4 className="font-semibold text-foreground text-base">No obligations found</h4>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Try adjusting your search filters, connect your Gmail or Calendar, or upload a document to extract obligations automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <ResponsibilityCard key={item._id || item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
