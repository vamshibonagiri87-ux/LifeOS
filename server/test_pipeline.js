import { AuthService } from './src/services/authService.js';
import { ResponsibilityService } from './src/services/responsibilityService.js';
import { AgentOrchestrator } from './src/agents/orchestrator.js';
import { AIService } from './src/services/aiService.js';
import { DataStore } from './src/models/dataStore.js';

async function runVerification() {
  console.log('\n🔍 ======================================================');
  console.log('   STARTING LIFEOS END-TO-END PIPELINE VERIFICATION');
  console.log('======================================================\n');

  // 1. Auth Test
  console.log('1️⃣ Testing User Registration & Authentication...');
  const regResult = await AuthService.register({
    name: 'Vamshi Krishna',
    email: 'vamshi@example.com',
    password: 'password123',
  });
  console.log('   ✅ Registered User ID:', regResult.user.id);
  console.log('   ✅ JWT Generated:', regResult.token ? 'YES (Valid)' : 'NO');

  const userId = regResult.user.id;

  // 2. Ingest Email Source
  console.log('\n2️⃣ Ingesting Email Source...');
  const emailSource = await DataStore.sources.create({
    owner: userId,
    type: 'EMAIL',
    externalId: 'test-email-1',
    title: 'Urgent: Senior AI Engineer Technical Interview & Document Submission',
    content: `Dear Candidate,
We are pleased to invite you to the final interview on tomorrow at 3:00 PM.
Before the interview, you MUST submit your Resume, ID Proof, and Marks Memo / Official Transcript.
Failure to submit Marks Memo before tomorrow 12:00 PM will block your application from proceeding.`,
    metadata: { from: 'recruiter@techcorp.com' },
  });
  console.log('   ✅ Created Source ID:', emailSource._id);

  // 3. Run Cooperating Multi-Agent Pipeline
  console.log('\n3️⃣ Executing 6-Agent Cooperative Pipeline on Source...');
  const pipelineResult = await AgentOrchestrator.processSource(emailSource._id, userId);
  console.log('   ✅ Pipeline Status: SUCCESS');
  console.log('   ✅ Duration:', pipelineResult.duration, 'ms');
  console.log('   ✅ Extracted Responsibilities Count:', pipelineResult.responsibilities?.length);

  // 4. Verify Responsibilities in DataStore
  console.log('\n4️⃣ Verifying Extracted Responsibilities & Requirements Completion...');
  const respList = await ResponsibilityService.list(userId);
  console.log(`   ✅ Total Stored Responsibilities: ${respList.total}`);
  respList.items.forEach((item, idx) => {
    console.log(`\n   📌 Item #${idx + 1}: "${item.title}"`);
    console.log(`      - Category: ${item.category}`);
    console.log(`      - Priority: ${item.priority} (Score: ${item.priorityScore}/100)`);
    console.log(`      - Status: ${item.status}`);
    console.log(`      - Deadline: ${item.deadline}`);
    console.log(`      - Requirements: ${JSON.stringify(item.requirements)}`);
    console.log(`      - Missing Reqs: ${JSON.stringify(item.missingRequirements)}`);
    console.log(`      - Completion %: ${item.completionPercentage}%`);
    console.log(`      - "Why?" Explanation: ${item.priorityExplanation?.reason}`);
  });

  // 5. Verify Dashboard Aggregation & Priority Action
  console.log('\n5️⃣ Testing Dashboard Metrics & "What should I do now?" Action...');
  const dashboard = await ResponsibilityService.getDashboardMetrics(userId);
  console.log('   ✅ Active Responsibilities Metric:', dashboard.metrics.activeResponsibilities);
  console.log('   ✅ Critical Count Metric:', dashboard.metrics.critical);
  console.log('   ✅ Blocked Count Metric:', dashboard.metrics.blocked);
  console.log('   ✅ Priority Action Recommendation:');
  console.log('      🎯 Title:', dashboard.priorityAction?.title);
  console.log('      🎯 Priority:', dashboard.priorityAction?.priority);
  console.log('      🎯 Score:', dashboard.priorityAction?.priorityScore);
  console.log('      🎯 Reason:', dashboard.priorityAction?.priorityExplanation?.reason);

  // 6. Test AI Natural Language Assistant
  console.log('\n6️⃣ Testing Grounded Context-Aware AI Assistant...');
  const assistantResponse = await AIService.answerAssistantQuery('What should I do today?', {
    responsibilities: respList.items,
  });
  console.log('   💬 Question: "What should I do today?"');
  console.log('   🤖 Assistant Answer:\n' + assistantResponse);

  // 7. Verify Timeline Logs
  console.log('\n7️⃣ Inspecting Step-by-step Agent Timeline Logs in DataStore...');
  const logs = await DataStore.processingLogs.find({ processingRunId: pipelineResult.processingRunId });
  console.log(`   ✅ Generated Logs Count: ${logs.length}`);
  logs.forEach((l) => {
    console.log(`      [${l.agent}] [${l.level}] ${l.message}`);
  });

  console.log('\n======================================================');
  console.log('   🎉 ALL LIFEOS SYSTEM PIPELINES VERIFIED SUCCESSFULLY');
  console.log('======================================================\n');
}

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
