import React, { useState, useEffect } from 'react';
import { useLifeOSStore } from '../store/lifeOSStore.js';
import { ResponsibilityList } from '../components/ResponsibilityList/ResponsibilityList.jsx';
import { Plus, X, Sparkles, Loader2 } from 'lucide-react';

export function Responsibilities() {
  const {
    responsibilities,
    loadingResponsibilities,
    filters,
    setFilters,
    fetchResponsibilities,
    createResponsibility,
  } = useLifeOSStore();

  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'WORK',
    priority: 'MEDIUM',
    deadline: '',
    requirements: '',
  });

  useEffect(() => {
    fetchResponsibilities();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setCreating(true);
    const reqList = formData.requirements
      .split('\n')
      .map((r) => r.trim())
      .filter(Boolean)
      .map((r, i) => ({ id: `req-${Date.now()}-${i}`, title: r, completed: false }));

    const res = await createResponsibility({
      title: formData.title,
      description: formData.description,
      category: formData.category,
      priority: formData.priority,
      deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
      requirements: reqList,
    });

    setCreating(false);
    if (res.success) {
      setShowModal(false);
      setFormData({
        title: '',
        description: '',
        category: 'WORK',
        priority: 'MEDIUM',
        deadline: '',
        requirements: '',
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            All Obligations & Tasks
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Complete list of active, blocked, and upcoming responsibilities
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-lg shadow-primary-600/30 flex items-center gap-2 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Obligation</span>
        </button>
      </div>

      {/* Main List */}
      <ResponsibilityList
        items={responsibilities}
        loading={loadingResponsibilities}
        filters={filters}
        onFilterChange={setFilters}
        onOpenCreateModal={() => setShowModal(true)}
      />

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-surface border border-border rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-400" />
                Add New Obligation
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Submit Quarterly Tax Return"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-hover border border-border text-sm text-foreground focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Description</label>
                <textarea
                  rows={2}
                  placeholder="Details, context, or instructions..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-hover border border-border text-sm text-foreground focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border text-xs text-foreground focus:outline-none focus:border-primary-500"
                  >
                    <option value="EDUCATION">Education</option>
                    <option value="WORK">Work</option>
                    <option value="FINANCE">Finance</option>
                    <option value="HEALTH">Health</option>
                    <option value="GOVERNMENT">Government</option>
                    <option value="TRAVEL">Travel</option>
                    <option value="PERSONAL">Personal</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-hover border border-border text-xs text-foreground focus:outline-none focus:border-primary-500"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Deadline</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-hover border border-border text-xs text-foreground focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Requirements (One item per line)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g.&#10;Resume&#10;ID Proof"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-hover border border-border text-xs text-foreground focus:outline-none focus:border-primary-500 resize-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-surface-hover text-muted hover:text-foreground text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-primary-600/20 transition disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Obligation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
