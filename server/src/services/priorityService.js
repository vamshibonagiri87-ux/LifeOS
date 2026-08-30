export class PriorityService {
  /**
   * Calculate explainable Priority Score:
   * Priority Score = Deadline Urgency + Dependency Impact + Missing Requirements + Importance + Overdue Penalty
   */
  static calculate(responsibility) {
    let score = 30; // Baseline base score
    const breakdown = [];

    // 1. Deadline Urgency calculation
    if (responsibility.deadline) {
      const now = new Date();
      const deadline = new Date(responsibility.deadline);
      const diffDays = (deadline - now) / (1000 * 60 * 60 * 24);

      if (diffDays < 0) {
        // Overdue penalty
        score += 45;
        breakdown.push({ factor: 'Overdue Penalty', points: 45, reason: `Obligation is overdue by ${Math.abs(Math.round(diffDays))} days.` });
      } else if (diffDays <= 1) {
        score += 35;
        breakdown.push({ factor: 'Immediate Deadline', points: 35, reason: 'Due within 24 hours.' });
      } else if (diffDays <= 3) {
        score += 25;
        breakdown.push({ factor: 'Urgent Deadline', points: 25, reason: `Due in ${Math.round(diffDays)} days.` });
      } else if (diffDays <= 7) {
        score += 15;
        breakdown.push({ factor: 'Approaching Deadline', points: 15, reason: `Due in ${Math.round(diffDays)} days.` });
      } else {
        score += 5;
        breakdown.push({ factor: 'Future Deadline', points: 5, reason: `Due in ${Math.round(diffDays)} days.` });
      }
    } else {
      breakdown.push({ factor: 'No Explicit Deadline', points: 0, reason: 'No hard deadline specified.' });
    }

    // 2. Missing Requirements Impact
    const missingCount = (responsibility.missingRequirements || []).length;
    if (missingCount > 0) {
      const pts = Math.min(missingCount * 8, 24);
      score += pts;
      breakdown.push({
        factor: 'Missing Requirements',
        points: pts,
        reason: `${missingCount} required document(s) or prerequisite(s) missing.`,
      });
    }

    // 3. Dependency Impact
    const deps = responsibility.dependencies || [];
    const blocksCount = deps.filter((d) => d.type === 'BLOCKS' || d.type === 'REQUIRED_BEFORE').length;
    if (blocksCount > 0) {
      const pts = Math.min(blocksCount * 10, 30);
      score += pts;
      breakdown.push({
        factor: 'Dependency Blocker',
        points: pts,
        reason: `Blocks ${blocksCount} other downstream obligation(s).`,
      });
    }

    // 4. Blocked Status Check
    if (responsibility.status === 'BLOCKED') {
      score += 10;
      breakdown.push({ factor: 'Blocked State', points: 10, reason: 'Cannot proceed until prerequisites are resolved.' });
    }

    // Normalize score to range [0 - 100]
    const finalScore = Math.min(Math.max(Math.round(score), 0), 100);

    // Determine category level
    let level = 'LOW';
    if (finalScore >= 80) level = 'CRITICAL';
    else if (finalScore >= 60) level = 'HIGH';
    else if (finalScore >= 40) level = 'MEDIUM';

    // Formulate human-readable reason
    const topReason = breakdown.filter((b) => b.points > 0).map((b) => b.reason).join(' ') || 'Standard pending obligation.';

    return {
      priorityScore: finalScore,
      priority: level,
      explanation: {
        reason: topReason,
        breakdown,
        calculatedAt: new Date().toISOString(),
      },
    };
  }
}
