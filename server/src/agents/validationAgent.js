export class ValidationAgent {
  static async run({ responsibilities }) {
    const validResponsibilities = [];
    const validationIssues = [];

    const validCategories = ['EDUCATION', 'WORK', 'FINANCE', 'PERSONAL', 'HEALTH', 'GOVERNMENT', 'TRAVEL', 'SHOPPING', 'OTHER'];
    const validStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'WAITING', 'BLOCKED', 'COMPLETED', 'OVERDUE', 'CANCELLED'];

    for (let i = 0; i < responsibilities.length; i++) {
      const item = responsibilities[i];
      const issues = [];

      // Title check
      if (!item.title || item.title.trim().length === 0) {
        issues.push('Title is empty or missing');
      }

      // Category check
      if (!validCategories.includes(item.category)) {
        item.category = 'OTHER';
      }

      // Status check
      if (!validStatuses.includes(item.status)) {
        item.status = 'NOT_STARTED';
      }

      // Deadline validation & normalization
      if (item.deadline) {
        const parsed = new Date(item.deadline);
        if (isNaN(parsed.getTime())) {
          issues.push(`Invalid deadline format: ${item.deadline}`);
          item.deadline = null;
        } else {
          item.deadline = parsed;
          // Calculate deadline status
          const now = new Date();
          const diffDays = (parsed - now) / (1000 * 60 * 60 * 24);
          if (diffDays < 0) item.deadlineStatus = 'OVERDUE';
          else if (diffDays <= 1) item.deadlineStatus = 'URGENT';
          else if (diffDays <= 3) item.deadlineStatus = 'APPROACHING';
          else item.deadlineStatus = 'UPCOMING';
        }
      }

      // Confidence score normalization
      item.confidenceScore = typeof item.confidenceScore === 'number' ? Math.min(Math.max(item.confidenceScore, 0.1), 1.0) : 0.85;

      if (issues.length > 0) {
        validationIssues.push({ itemIndex: i, title: item.title, issues });
      }

      if (item.title && item.title.trim().length > 0) {
        validResponsibilities.push(item);
      }
    }

    return {
      success: true,
      responsibilities: validResponsibilities,
      validationIssues,
      validCount: validResponsibilities.length,
    };
  }
}
