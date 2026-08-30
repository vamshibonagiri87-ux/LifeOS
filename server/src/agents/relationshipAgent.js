import { RelationshipService } from '../services/relationshipService.js';
import { DataStore } from '../models/dataStore.js';

export class RelationshipAgent {
  static async run({ responsibilities, owner }) {
    const existingResponsibilities = await DataStore.responsibilities.find({
      owner,
      status: { $ne: 'COMPLETED' },
    });

    const enrichedResponsibilities = [];

    for (const item of responsibilities) {
      // 1. Process requirements & calculate completion percentage
      const reqAnalysis = RelationshipService.processRequirements(item.requirements || []);

      // 2. Detect cross-responsibility duplicates and dependencies
      const relAnalysis = RelationshipService.analyzeRelationships(item, existingResponsibilities);

      enrichedResponsibilities.push({
        ...item,
        requirements: reqAnalysis.requirements,
        missingRequirements: reqAnalysis.missingRequirements,
        completionPercentage: reqAnalysis.completionPercentage,
        status: reqAnalysis.isBlocked ? 'BLOCKED' : item.status || 'NOT_STARTED',
        dependencies: relAnalysis.dependencies,
        relatedResponsibilities: relAnalysis.relatedResponsibilities,
        isDuplicate: relAnalysis.isDuplicate,
        duplicateOfId: relAnalysis.duplicateOfId,
      });
    }

    return {
      success: true,
      responsibilities: enrichedResponsibilities,
      totalAnalyzed: enrichedResponsibilities.length,
    };
  }
}
