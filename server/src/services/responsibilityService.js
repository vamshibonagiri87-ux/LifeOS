import { DataStore } from '../models/dataStore.js';
import { PriorityService } from './priorityService.js';
import { RelationshipService } from './relationshipService.js';
import { AppError } from '../middleware/errorMiddleware.js';

export class ResponsibilityService {
  static async list(owner, filters = {}) {
    const query = { owner };

    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.priority) {
      query.priority = filters.priority;
    }
    if (filters.category) {
      query.category = filters.category;
    }
    if (filters.search) {
      query.title = { $regex: filters.search, $options: 'i' };
    }

    const sort = filters.sort === 'priority' ? { priorityScore: -1 } : filters.sort === 'deadline' ? { deadline: 1 } : { createdAt: -1 };
    const limit = parseInt(filters.limit || '100', 10);
    const skip = parseInt(filters.skip || '0', 10);

    const items = await DataStore.responsibilities.find(query, sort, limit, skip);
    const total = await DataStore.responsibilities.countDocuments(query);

    return { items, total, limit, skip };
  }

  static async getById(id, owner) {
    const item = await DataStore.responsibilities.findById(id);
    if (!item || String(item.owner) !== String(owner)) {
      throw new AppError('Responsibility not found', 404, 'NOT_FOUND');
    }
    return item;
  }

  static async create(owner, data) {
    // Process requirements
    const reqAnalysis = RelationshipService.processRequirements(data.requirements || []);
    
    // Calculate priority & explainability
    const tempItem = {
      ...data,
      requirements: reqAnalysis.requirements,
      missingRequirements: reqAnalysis.missingRequirements,
      completionPercentage: reqAnalysis.completionPercentage,
    };
    const { priorityScore, priority, explanation } = PriorityService.calculate(tempItem);

    return await DataStore.responsibilities.create({
      ...data,
      owner,
      requirements: reqAnalysis.requirements,
      missingRequirements: reqAnalysis.missingRequirements,
      completionPercentage: reqAnalysis.completionPercentage,
      status: reqAnalysis.isBlocked ? 'BLOCKED' : data.status || 'NOT_STARTED',
      priority,
      priorityScore,
      priorityExplanation: explanation,
      createdAt: new Date(),
    });
  }

  static async update(id, owner, updates) {
    await this.getById(id, owner);

    // Recalculate requirements if updated
    if (updates.requirements) {
      const reqAnalysis = RelationshipService.processRequirements(updates.requirements);
      updates.requirements = reqAnalysis.requirements;
      updates.missingRequirements = reqAnalysis.missingRequirements;
      updates.completionPercentage = reqAnalysis.completionPercentage;
      if (reqAnalysis.isBlocked && updates.status !== 'COMPLETED') {
        updates.status = 'BLOCKED';
      }
    }

    // Recalculate priority
    const current = await DataStore.responsibilities.findById(id);
    const merged = { ...current, ...updates };
    const { priorityScore, priority, explanation } = PriorityService.calculate(merged);

    updates.priorityScore = priorityScore;
    updates.priority = priority;
    updates.priorityExplanation = explanation;

    return await DataStore.responsibilities.findByIdAndUpdate(id, updates);
  }

  static async updateStatus(id, owner, status) {
    await this.getById(id, owner);
    const updates = { status };
    if (status === 'COMPLETED') {
      updates.completionPercentage = 100;
    }
    return await this.update(id, owner, updates);
  }

  static async duplicate(id, owner) {
    const existing = await this.getById(id, owner);
    return await this.create(owner, {
      title: `${existing.title} (Copy)`,
      description: existing.description,
      category: existing.category,
      priority: existing.priority,
      deadline: existing.deadline,
      requirements: existing.requirements,
      people: existing.people,
    });
  }

  static async delete(id, owner) {
    await this.getById(id, owner);
    return await DataStore.responsibilities.findByIdAndDelete(id);
  }

  static async explainPriority(id, owner) {
    const item = await this.getById(id, owner);
    const calculation = PriorityService.calculate(item);
    return {
      id: item._id || item.id,
      title: item.title,
      priority: item.priority,
      priorityScore: item.priorityScore,
      explanation: calculation.explanation,
    };
  }

  static async getDashboardMetrics(owner) {
    const all = await DataStore.responsibilities.find({ owner });
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

    const active = all.filter((r) => r.status !== 'COMPLETED' && r.status !== 'CANCELLED');
    const critical = active.filter((r) => r.priority === 'CRITICAL');
    const dueThisWeek = active.filter((r) => r.deadline && new Date(r.deadline) <= weekFromNow && new Date(r.deadline) >= now);
    const blocked = active.filter((r) => r.status === 'BLOCKED' || (r.missingRequirements && r.missingRequirements.length > 0));
    const completedThisWeek = all.filter((r) => r.status === 'COMPLETED' && new Date(r.updatedAt || r.createdAt) >= weekAgo);

    let totalMissingReqs = 0;
    active.forEach((r) => {
      totalMissingReqs += (r.missingRequirements || []).length;
    });

    // Determine Single Priority Action ("What should I do now?")
    const sortedByPriority = [...active].sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
    const priorityAction = sortedByPriority[0] || null;

    const urgent = active.filter((r) => r.priority === 'CRITICAL' || r.priority === 'HIGH').slice(0, 5);
    const today = active.filter((r) => {
      if (!r.deadline) return false;
      const d = new Date(r.deadline);
      return d.toDateString() === now.toDateString();
    });
    const upcoming = active.filter((r) => r.deadline && new Date(r.deadline) > now).slice(0, 6);

    const recentLogs = await DataStore.processingLogs.find({}, { createdAt: -1 }, 10);

    return {
      metrics: {
        activeResponsibilities: active.length,
        critical: critical.length,
        dueThisWeek: dueThisWeek.length,
        blocked: blocked.length,
        missingRequirements: totalMissingReqs,
        completedThisWeek: completedThisWeek.length,
      },
      priorityAction,
      sections: {
        urgent,
        today,
        upcoming,
        blocked: blocked.slice(0, 5),
        recentActivity: recentLogs,
      },
    };
  }
}
