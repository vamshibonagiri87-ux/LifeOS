import { PriorityService } from '../services/priorityService.js';

export class PriorityAgent {
  static async run({ responsibilities }) {
    const scoredResponsibilities = [];

    for (const item of responsibilities) {
      const { priorityScore, priority, explanation } = PriorityService.calculate(item);

      scoredResponsibilities.push({
        ...item,
        priorityScore,
        priority,
        priorityExplanation: explanation,
      });
    }

    // Sort items by priorityScore descending
    scoredResponsibilities.sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

    return {
      success: true,
      responsibilities: scoredResponsibilities,
      topPriorityTitle: scoredResponsibilities[0]?.title || 'None',
    };
  }
}
