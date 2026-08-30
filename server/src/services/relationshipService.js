export class RelationshipService {
  /**
   * Calculate requirements completion percentage and detect missing requirements
   */
  static processRequirements(requirements = []) {
    if (!requirements || requirements.length === 0) {
      return {
        requirements: [],
        missingRequirements: [],
        completionPercentage: 100,
        isBlocked: false,
      };
    }

    const total = requirements.length;
    const completed = requirements.filter((r) => r.completed).length;
    const missing = requirements.filter((r) => !r.completed).map((r) => r.title);
    const completionPercentage = Math.round((completed / total) * 100);

    return {
      requirements,
      missingRequirements: missing,
      completionPercentage,
      isBlocked: missing.length > 0 && completionPercentage < 100,
    };
  }

  /**
   * Analyze new extracted responsibility against existing responsibilities for duplicates and dependencies
   */
  static analyzeRelationships(newResp, existingList = []) {
    const dependencies = [];
    const relatedResponsibilities = [];
    let isDuplicate = false;
    let duplicateOfId = null;

    const newTitleNorm = (newResp.title || '').toLowerCase().trim();

    for (const existing of existingList) {
      const existingTitleNorm = (existing.title || '').toLowerCase().trim();
      const existingId = existing._id || existing.id;

      // Duplicate detection by high similarity
      if (newTitleNorm === existingTitleNorm || (newTitleNorm.length > 10 && existingTitleNorm.includes(newTitleNorm))) {
        isDuplicate = true;
        duplicateOfId = existingId;
        relatedResponsibilities.push({
          responsibilityId: String(existingId),
          relationType: 'DUPLICATE',
          confidenceScore: 0.95,
        });
        continue;
      }

      // Dependency detection: e.g. "Application Submission" vs "Interview" or "Marks Memo" vs "Application"
      if (newTitleNorm.includes('interview') && existingTitleNorm.includes('application')) {
        dependencies.push({
          id: `dep-${Date.now()}`,
          responsibilityId: String(existingId),
          type: 'FOLLOWS',
          title: existing.title,
        });
      } else if (newTitleNorm.includes('application') && (existingTitleNorm.includes('marks') || existingTitleNorm.includes('resume'))) {
        dependencies.push({
          id: `dep-${Date.now()}`,
          responsibilityId: String(existingId),
          type: 'REQUIRES',
          title: existing.title,
        });
      } else if (newResp.category === existing.category && newResp.category !== 'OTHER') {
        relatedResponsibilities.push({
          responsibilityId: String(existingId),
          relationType: 'RELATED',
          confidenceScore: 0.7,
        });
      }
    }

    return {
      isDuplicate,
      duplicateOfId,
      dependencies,
      relatedResponsibilities,
    };
  }
}
