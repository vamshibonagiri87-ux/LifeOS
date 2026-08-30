import { DataStore } from '../models/dataStore.js';
import { emitUserEvent } from '../config/socket.js';
import { ExtractionAgent } from './extractionAgent.js';
import { RelationshipAgent } from './relationshipAgent.js';
import { ValidationAgent } from './validationAgent.js';
import { PriorityAgent } from './priorityAgent.js';
import { RecoveryAgent } from './recoveryAgent.js';
import { MonitoringAgent } from './monitoringAgent.js';

export class AgentOrchestrator {
  /**
   * Run the fixed 6-agent cooperative pipeline on an ingested Source
   */
  static async processSource(sourceId, owner) {
    const startTime = Date.now();
    const source = await DataStore.sources.findById(sourceId);
    if (!source) {
      throw new Error(`Source with ID ${sourceId} not found`);
    }

    // 1. Initialize Processing Run
    const run = await DataStore.processingRuns.create({
      sourceId,
      owner,
      status: 'RUNNING',
      currentAgent: 'EXTRACTION',
      input: { title: source.title, type: source.type },
      retryCount: 0,
      startTime: new Date(),
    });

    const runId = run._id || run.id;
    emitUserEvent(owner, 'SOURCE_RECEIVED', { sourceId, runId });

    try {
      // ----------------------------------------------------
      // STEP 1: EXTRACTION AGENT
      // ----------------------------------------------------
      await MonitoringAgent.logStep({
        processingRunId: runId,
        sourceId,
        owner,
        agent: 'EXTRACTION',
        level: 'INFO',
        message: 'Extraction Agent started parsing unstructured input...',
      });
      emitUserEvent(owner, 'EXTRACTION_STARTED', { runId, sourceId });

      const extractResult = await ExtractionAgent.run({
        content: source.content || source.title,
        metadata: source.metadata || {},
      });

      await MonitoringAgent.logStep({
        processingRunId: runId,
        sourceId,
        owner,
        agent: 'EXTRACTION',
        level: 'SUCCESS',
        message: `Extraction Agent extracted ${extractResult.responsibilities?.length || 0} items using ${extractResult.provider || 'AI'}.`,
        metadata: { extractedCount: extractResult.responsibilities?.length, provider: extractResult.provider },
      });
      emitUserEvent(owner, 'TASKS_EXTRACTED', { count: extractResult.responsibilities?.length || 0 });

      // ----------------------------------------------------
      // STEP 2: RELATIONSHIP AGENT
      // ----------------------------------------------------
      await DataStore.processingRuns.findByIdAndUpdate(runId, { currentAgent: 'RELATIONSHIP' });
      await MonitoringAgent.logStep({
        processingRunId: runId,
        sourceId,
        owner,
        agent: 'RELATIONSHIP',
        level: 'INFO',
        message: 'Relationship Agent analyzing dependencies, duplicates, and requirements completion...',
      });
      emitUserEvent(owner, 'RELATIONSHIP_ANALYSIS_STARTED', { runId });

      const relResult = await RelationshipAgent.run({
        responsibilities: extractResult.responsibilities || [],
        owner,
      });

      await MonitoringAgent.logStep({
        processingRunId: runId,
        sourceId,
        owner,
        agent: 'RELATIONSHIP',
        level: 'SUCCESS',
        message: `Relationship Agent completed graph analysis for ${relResult.responsibilities.length} items.`,
      });

      // ----------------------------------------------------
      // STEP 3: VALIDATION AGENT
      // ----------------------------------------------------
      await DataStore.processingRuns.findByIdAndUpdate(runId, { currentAgent: 'VALIDATION' });
      await MonitoringAgent.logStep({
        processingRunId: runId,
        sourceId,
        owner,
        agent: 'VALIDATION',
        level: 'INFO',
        message: 'Validation Agent checking date integrity, required schemas, and confidence scores...',
      });

      const validResult = await ValidationAgent.run({
        responsibilities: relResult.responsibilities,
      });

      await MonitoringAgent.logStep({
        processingRunId: runId,
        sourceId,
        owner,
        agent: 'VALIDATION',
        level: 'SUCCESS',
        message: `Validation Agent verified ${validResult.validCount} valid obligations.`,
      });
      emitUserEvent(owner, 'DEADLINES_DETECTED', { validCount: validResult.validCount });

      // ----------------------------------------------------
      // STEP 4: PRIORITY AGENT
      // ----------------------------------------------------
      await DataStore.processingRuns.findByIdAndUpdate(runId, { currentAgent: 'PRIORITY' });
      await MonitoringAgent.logStep({
        processingRunId: runId,
        sourceId,
        owner,
        agent: 'PRIORITY',
        level: 'INFO',
        message: 'Priority Agent calculating explainable urgency, dependency risk, and penalty scores...',
      });

      const priorityResult = await PriorityAgent.run({
        responsibilities: validResult.responsibilities,
      });

      await MonitoringAgent.logStep({
        processingRunId: runId,
        sourceId,
        owner,
        agent: 'PRIORITY',
        level: 'SUCCESS',
        message: `Priority Agent scored obligations. Highest: "${priorityResult.topPriorityTitle}".`,
      });
      emitUserEvent(owner, 'PRIORITY_CALCULATED', { topTitle: priorityResult.topPriorityTitle });

      // ----------------------------------------------------
      // SAVE RESPONSIBILITIES TO DATASTORE
      // ----------------------------------------------------
      const savedResponsibilities = [];
      for (const item of priorityResult.responsibilities) {
        const saved = await DataStore.responsibilities.create({
          owner,
          title: item.title,
          description: item.description || '',
          category: item.category || 'OTHER',
          status: item.status || 'NOT_STARTED',
          priority: item.priority || 'MEDIUM',
          priorityScore: item.priorityScore || 50,
          priorityExplanation: item.priorityExplanation,
          deadline: item.deadline || null,
          deadlineStatus: item.deadlineStatus || null,
          requirements: item.requirements || [],
          missingRequirements: item.missingRequirements || [],
          completionPercentage: item.completionPercentage || 0,
          dependencies: item.dependencies || [],
          relatedResponsibilities: item.relatedResponsibilities || [],
          sourceIds: [source._id || source.id],
          people: item.people || [],
          confidenceScore: item.confidenceScore || 0.9,
          createdAt: new Date(),
        });
        savedResponsibilities.push(saved);
      }

      // Update Source status
      await DataStore.sources.findByIdAndUpdate(source._id || source.id, {
        processingStatus: 'COMPLETED',
        processingConfidence: 0.92,
        aiProcessed: true,
      });

      // Duration & Completion
      const duration = Date.now() - startTime;
      await DataStore.processingRuns.findByIdAndUpdate(runId, {
        status: 'COMPLETED',
        currentAgent: 'MONITORING',
        endTime: new Date(),
        duration,
        output: {
          responsibilitiesCount: savedResponsibilities.length,
          langGraph: 'available',
        },
      });

      // ----------------------------------------------------
      // STEP 6: MONITORING AGENT NOTIFICATION & EVENT STREAM
      // ----------------------------------------------------
      await MonitoringAgent.logStep({
        processingRunId: runId,
        sourceId,
        owner,
        agent: 'MONITORING',
        level: 'SUCCESS',
        message: `LifeOS Pipeline completed successfully in ${duration}ms. ${savedResponsibilities.length} responsibilities active.`,
        metadata: { duration, langGraph: 'available' },
      });

      await MonitoringAgent.notifyCompletion({
        owner,
        sourceId,
        processingRunId: runId,
        responsibilities: savedResponsibilities,
      });

      emitUserEvent(owner, 'PROCESSING_COMPLETED', {
        runId,
        sourceId,
        count: savedResponsibilities.length,
        duration,
        langGraph: 'available',
      });

      return {
        success: true,
        processingRunId: runId,
        responsibilities: savedResponsibilities,
        duration,
        langGraph: 'available',
      };
    } catch (err) {
      console.error('[AgentOrchestrator] Pipeline error:', err);
      const recoveryAction = await RecoveryAgent.handle(err, 0);

      await MonitoringAgent.logStep({
        processingRunId: runId,
        sourceId,
        owner,
        agent: 'RECOVERY',
        level: 'ERROR',
        message: `Error encountered: ${err.message}. Triage: ${recoveryAction.classification} (${recoveryAction.action}).`,
        metadata: { error: err.message, recovery: recoveryAction },
      });

      await DataStore.processingRuns.findByIdAndUpdate(runId, {
        status: 'FAILED',
        error: { message: err.message, classification: recoveryAction.classification },
        endTime: new Date(),
      });

      await DataStore.sources.findByIdAndUpdate(source._id || source.id, {
        processingStatus: 'FAILED',
      });

      emitUserEvent(owner, 'PROCESSING_FAILED', {
        runId,
        sourceId,
        error: err.message,
        classification: recoveryAction.classification,
      });

      return {
        success: false,
        processingRunId: runId,
        error: err.message,
        classification: recoveryAction.classification,
      };
    }
  }
}
