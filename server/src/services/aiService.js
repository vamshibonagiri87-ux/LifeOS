import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';

export class AIService {
  /**
   * Primary extraction call cascading: OpenRouter -> Gemini -> Rule-based Engine
   */
  static async extractStructuredData(rawText, metadata = {}) {
    if (!rawText || !rawText.trim()) {
      return { provider: 'rule-engine', data: { responsibilities: [] } };
    }

    // 1. Try OpenRouter
    if (config.ai.openRouterApiKey) {
      try {
        const result = await this.extractWithOpenRouter(rawText, metadata);
        if (result && Array.isArray(result.responsibilities) && result.responsibilities.length > 0) {
          return { provider: 'openrouter', data: result };
        }
      } catch (err) {
        console.warn('[AIService] OpenRouter extraction failed:', err.message);
      }
    }

    // 2. Try Gemini
    if (config.ai.geminiApiKey) {
      try {
        const result = await this.extractWithGemini(rawText, metadata);
        if (result && Array.isArray(result.responsibilities) && result.responsibilities.length > 0) {
          return { provider: 'gemini', data: result };
        }
      } catch (err) {
        console.warn('[AIService] Gemini extraction failed:', err.message);
      }
    }

    // 3. Fallback to High-Accuracy Rule-Based Engine
    const ruleResult = this.extractWithRuleEngine(rawText, metadata);
    return { provider: 'rule-engine', data: ruleResult };
  }

  /**
   * Test an AI provider API Key
   */
  static async testApiKey(provider, apiKey) {
    if (!apiKey || !apiKey.trim()) {
      throw new Error('API key is required');
    }
    const cleanKey = apiKey.trim();

    if (provider === 'gemini') {
      const genAI = new GoogleGenerativeAI(cleanKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent('Say "OK" to verify API connection.');
      const responseText = result.response.text();
      return { success: true, message: 'Google Gemini API key verified successfully!' };
    }

    if (provider === 'openrouter') {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'google/gemini-2.0-flash-001',
          messages: [{ role: 'user', content: 'Say OK' }],
          max_tokens: 10,
        },
        {
          headers: {
            Authorization: `Bearer ${cleanKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': config.clientUrl,
            'X-Title': 'LifeOS',
          },
          timeout: 10000,
        }
      );
      if (response.status === 200) {
        return { success: true, message: 'OpenRouter API key verified successfully!' };
      }
      throw new Error('Unexpected response status from OpenRouter');
    }

    throw new Error(`Unsupported provider: ${provider}`);
  }

  /**
   * OpenRouter API caller with robust fallback models
   */
  static async extractWithOpenRouter(rawText, metadata) {
    const prompt = this.buildExtractionPrompt(rawText, metadata);
    const models = ['google/gemini-2.0-flash-001', 'google/gemini-flash-1.5', 'meta-llama/llama-3.3-70b-instruct'];

    for (const model of models) {
      try {
        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model,
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.1,
          },
          {
            headers: {
              Authorization: `Bearer ${config.ai.openRouterApiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': config.clientUrl,
              'X-Title': 'LifeOS',
            },
            timeout: 15000,
          }
        );

        const content = response.data?.choices?.[0]?.message?.content;
        const parsed = this.parseJSONResponse(content);
        if (parsed && Array.isArray(parsed.responsibilities) && parsed.responsibilities.length > 0) {
          return parsed;
        }
      } catch (err) {
        console.warn(`[AIService] OpenRouter model ${model} failed:`, err.message);
      }
    }
    return null;
  }

  /**
   * Google Generative AI (Gemini) SDK caller
   */
  static async extractWithGemini(rawText, metadata) {
    const genAI = new GoogleGenerativeAI(config.ai.geminiApiKey);
    const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const prompt = this.buildExtractionPrompt(rawText, metadata);

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });

        const content = result.response.text();
        const parsed = this.parseJSONResponse(content);
        if (parsed && Array.isArray(parsed.responsibilities) && parsed.responsibilities.length > 0) {
          return parsed;
        }
      } catch (err) {
        console.warn(`[AIService] Gemini model ${modelName} failed:`, err.message);
      }
    }
    return null;
  }

  /**
   * Deterministic Rule-Based Extraction Engine (Intelligent Offline Fallback)
   */
  static extractWithRuleEngine(rawText, metadata = {}) {
    const responsibilities = [];
    const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    // Action verbs and keywords
    const actionKeywords = [
      'submit', 'pay', 'attend', 'bring', 'upload', 'complete', 'review',
      'send', 'due', 'before', 'deadline', 'appointment', 'meeting', 'exam',
      'interview', 'application', 'register', 'schedule', 'prepare', 'file',
      'sign', 'confirm', 'renew', 'verify', 'invoice', 'bill', 'receipt'
    ];

    // Category detection mapping
    const detectCategory = (text) => {
      const lower = text.toLowerCase();
      if (lower.includes('exam') || lower.includes('marks') || lower.includes('course') || lower.includes('assignment') || lower.includes('syllabus') || lower.includes('university') || lower.includes('internship') || lower.includes('class') || lower.includes('grade')) return 'EDUCATION';
      if (lower.includes('pay') || lower.includes('bill') || lower.includes('invoice') || lower.includes('fee') || lower.includes('tax') || lower.includes('bank') || lower.includes('salary') || lower.includes('amount') || lower.includes('$') || lower.includes('₹') || lower.includes('€')) return 'FINANCE';
      if (lower.includes('interview') || lower.includes('job') || lower.includes('client') || lower.includes('project') || lower.includes('presentation') || lower.includes('office') || lower.includes('deploy') || lower.includes('meeting') || lower.includes('sync')) return 'WORK';
      if (lower.includes('doctor') || lower.includes('dentist') || lower.includes('hospital') || lower.includes('prescription') || lower.includes('health') || lower.includes('clinic') || lower.includes('checkup') || lower.includes('medical') || lower.includes('appointment')) return 'HEALTH';
      if (lower.includes('passport') || lower.includes('visa') || lower.includes('license') || lower.includes('government') || lower.includes('id proof') || lower.includes('national id') || lower.includes('tax return')) return 'GOVERNMENT';
      if (lower.includes('flight') || lower.includes('hotel') || lower.includes('ticket') || lower.includes('train') || lower.includes('trip') || lower.includes('boarding')) return 'TRAVEL';
      return 'PERSONAL';
    };

    // Date extraction patterns
    const dateRegexes = [
      /(?:due|before|by|on|deadline:?)\s+([A-Za-z]+ \d{1,2}(?:st|nd|rd|th)?(?:,? \d{4})?)/i,
      /(?:due|before|by|on|deadline:?)\s+(\d{1,2}[/-]\d{1,2}[/-]\d{4})/i,
      /(?:tomorrow|next friday|next monday|next week|within \d+ days)/i,
      /(\b\d{4}-\d{2}-\d{2}\b)/,
      /(?:at|on)\s+([A-Za-z]+ \d{1,2}(?:st|nd|rd|th)?\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
    ];

    // Helper to calculate target deadline date
    const resolveDeadline = (dateStr) => {
      if (!dateStr) return null;
      try {
        const lower = dateStr.toLowerCase();
        const now = new Date();

        if (lower.includes('tomorrow')) {
          const d = new Date();
          d.setDate(d.getDate() + 1);
          d.setHours(17, 0, 0, 0);
          return d.toISOString();
        }
        if (lower.includes('next friday')) {
          const d = new Date();
          d.setDate(d.getDate() + ((7 - d.getDay() + 5) % 7 || 7));
          d.setHours(17, 0, 0, 0);
          return d.toISOString();
        }
        if (lower.includes('next monday')) {
          const d = new Date();
          d.setDate(d.getDate() + ((7 - d.getDay() + 1) % 7 || 7));
          d.setHours(9, 0, 0, 0);
          return d.toISOString();
        }
        if (lower.includes('next week')) {
          const d = new Date();
          d.setDate(d.getDate() + 7);
          d.setHours(17, 0, 0, 0);
          return d.toISOString();
        }
        if (lower.includes('within')) {
          const numMatch = lower.match(/\d+/);
          const days = numMatch ? parseInt(numMatch[0], 10) : 7;
          const d = new Date();
          d.setDate(d.getDate() + days);
          return d.toISOString();
        }

        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          // If year is older than current year or unset, advance to current year
          if (parsed.getFullYear() < now.getFullYear()) {
            parsed.setFullYear(now.getFullYear());
          }
          return parsed.toISOString();
        }
      } catch (e) {}
      return null;
    };

    // Helper to detect missing requirements
    const detectRequirements = (text) => {
      const lower = text.toLowerCase();
      const reqs = [];
      if (lower.includes('resume') || lower.includes('cv')) reqs.push({ title: 'Resume / CV', completed: false });
      if (lower.includes('photo id') || lower.includes('id proof') || lower.includes('passport') || lower.includes('driver license') || lower.includes('student identification') || lower.includes('student id')) reqs.push({ title: 'Government Photo ID Proof', completed: false });
      if (lower.includes('marks memo') || lower.includes('transcript') || lower.includes('academic memo') || lower.includes('grade sheet')) reqs.push({ title: 'Official Marks Memo / Transcript', completed: false });
      if (lower.includes('insurance card') || lower.includes('health card')) reqs.push({ title: 'Health Insurance Card', completed: false });
      if (lower.includes('hall ticket') || lower.includes('admit card')) reqs.push({ title: 'Examination Hall Ticket', completed: false });
      if (lower.includes('calculator') && lower.includes('approved')) reqs.push({ title: 'Approved Scientific Calculator', completed: false });
      if (lower.includes('receipt') || lower.includes('payment proof') || lower.includes('tax invoice')) reqs.push({ title: 'Payment Receipt / Tax Invoice', completed: false });
      if (lower.includes('verification form') || lower.includes('background verification') || lower.includes('bgv form')) reqs.push({ title: 'Completed Background Verification Form', completed: false });
      if (lower.includes('blood work') || lower.includes('diagnostic report') || lower.includes('lab report')) reqs.push({ title: 'Previous Diagnostic / Lab Reports', completed: false });
      return reqs;
    };

    // Helper to detect people
    const detectPeople = (text) => {
      const people = [];
      const match = text.match(/(?:Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
      if (match) people.push(match[0]);
      return people;
    };

    // Scan lines for actionable tasks
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lower = line.toLowerCase();

      const hasAction = actionKeywords.some((kw) => lower.includes(kw));
      if (hasAction && line.length > 8 && line.length < 300) {
        let extractedDate = null;
        for (const regex of dateRegexes) {
          const match = line.match(regex);
          if (match) {
            extractedDate = match[1] || match[0];
            break;
          }
        }

        const deadline = resolveDeadline(extractedDate);
        const reqs = detectRequirements(line);
        const people = detectPeople(line);
        const cat = detectCategory(line);

        let priority = 'MEDIUM';
        if (lower.includes('urgent') || lower.includes('critical') || lower.includes('tomorrow') || lower.includes('immediate')) {
          priority = 'CRITICAL';
        } else if (lower.includes('due') || lower.includes('deadline') || lower.includes('interview') || lower.includes('exam') || lower.includes('payment')) {
          priority = 'HIGH';
        }

        const cleanTitle = line.replace(/^[-*•\d.)\s]+/, '').slice(0, 110).trim();

        responsibilities.push({
          title: cleanTitle,
          description: line,
          category: cat,
          deadline,
          priority,
          requirements: reqs.map((r, idx) => ({ id: `req-${idx + 1}`, ...r })),
          people,
          confidenceScore: 0.88,
        });
      }
    }

    // Default item if no specific pattern matched but text has content
    if (responsibilities.length === 0 && rawText.trim().length > 0) {
      const titleCandidate = metadata.subject || metadata.title || lines[0] || 'Ingested Action Item';
      const d = new Date();
      d.setDate(d.getDate() + 5);

      responsibilities.push({
        title: titleCandidate.slice(0, 90),
        description: rawText.slice(0, 300).trim(),
        category: detectCategory(rawText),
        deadline: d.toISOString(),
        priority: 'MEDIUM',
        requirements: detectRequirements(rawText).map((r, idx) => ({ id: `req-${idx + 1}`, ...r })),
        people: detectPeople(rawText),
        confidenceScore: 0.75,
      });
    }

    return { responsibilities };
  }

  static buildExtractionPrompt(rawText, metadata = {}) {
    return `You are the Extraction Agent for LifeOS, an AI-powered Personal Obligation Intelligence Platform.
Analyze the following unstructured input (emails, calendar appointments, documents) and extract all tasks, obligations, appointments, deadlines, and prerequisites.

Input Metadata: ${JSON.stringify(metadata)}
Input Content:
"""
${rawText.slice(0, 10000)}
"""

Respond strictly with valid JSON with the following exact schema:
{
  "responsibilities": [
    {
      "title": "Clear, concise action title",
      "description": "Comprehensive explanation of what needs to be done and why",
      "category": "EDUCATION" | "WORK" | "FINANCE" | "PERSONAL" | "HEALTH" | "GOVERNMENT" | "TRAVEL" | "SHOPPING" | "OTHER",
      "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
      "deadline": "ISO 8601 Date string or null (e.g. 2026-09-05T17:00:00.000Z)",
      "requirements": [
        { "id": "req-1", "title": "Required prerequisite or document name", "completed": false }
      ],
      "people": ["Name or role mentioned"],
      "confidenceScore": 0.95
    }
  ]
}`;
  }

  static async answerAssistantQuery(query, contextData) {
    const prompt = `You are LifeOS Assistant, an AI obligation triage and personal productivity assistant.
Your goal is to answer the user's questions about their active responsibilities, upcoming deadlines, missing documents, and priorities.
Always ground your answers in the provided user context data. Be concise, actionable, and explain *why* something is prioritized.

User Context Data:
- Responsibilities: ${JSON.stringify(contextData.responsibilities || [])}
- Upcoming Deadlines: ${JSON.stringify(contextData.upcomingDeadlines || [])}
- Missing Requirements: ${JSON.stringify(contextData.missingRequirements || [])}
- Blocked Items: ${JSON.stringify(contextData.blockedItems || [])}
- Connected Accounts: ${JSON.stringify(contextData.integrations || [])}

User Query: "${query}"

Provide a clear, formatted, and encouraging response:`;

    // 1. Try OpenRouter
    if (config.ai.openRouterApiKey) {
      try {
        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: 'google/gemini-2.0-flash-001',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
          },
          {
            headers: {
              Authorization: `Bearer ${config.ai.openRouterApiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': config.clientUrl,
              'X-Title': 'LifeOS',
            },
            timeout: 15000,
          }
        );
        const ans = response.data?.choices?.[0]?.message?.content;
        if (ans && ans.trim()) return ans.trim();
      } catch (err) {
        console.warn('[AIService] Assistant OpenRouter query failed:', err.message);
      }
    }

    // 2. Try Gemini
    if (config.ai.geminiApiKey) {
      try {
        const genAI = new GoogleGenerativeAI(config.ai.geminiApiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const ans = result.response.text();
        if (ans && ans.trim()) return ans.trim();
      } catch (err) {
        console.warn('[AIService] Assistant Gemini query failed:', err.message);
      }
    }

    // 3. Fallback to Grounded Deterministic Intelligence
    return this.deterministicAssistantAnswer(query, contextData);
  }

  static deterministicAssistantAnswer(query, context) {
    const q = query.toLowerCase();
    const responsibilities = context.responsibilities || [];

    if (q.includes('today') || q.includes('now') || q.includes('first') || q.includes('urgent') || q.includes('priority')) {
      const top = [...responsibilities].sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))[0];
      if (!top) return "You have no active obligations at the moment! Your command center is clear.";
      return `### 🎯 Top Priority Action Right Now\n\n**${top.title}**\n- **Category**: \`${top.category}\`\n- **Priority Score**: **${top.priorityScore || 50}/100** (${top.priority})\n${top.deadline ? `- **Deadline**: ${new Date(top.deadline).toLocaleDateString()}` : ''}\n\n**Why is this prioritized?**\n${top.priorityExplanation?.reason || 'Calculated high impact on your digital life graph.'}\n\n*Details*: ${top.description || 'No additional details.'}`;
    }

    if (q.includes('blocked')) {
      const blocked = responsibilities.filter((r) => r.status === 'BLOCKED' || (r.missingRequirements && r.missingRequirements.length > 0));
      if (blocked.length === 0) return "✅ **Great news!** None of your active obligations are currently blocked.";
      return `### ⚠️ Blocked Obligations (${blocked.length})\n\n` + blocked.map((b) => `- **${b.title}** (Score: ${b.priorityScore || 50})\n  *Missing*: ${b.missingRequirements?.join(', ') || 'Prerequisite step'}`).join('\n\n');
    }

    if (q.includes('missing') || q.includes('document') || q.includes('requirement')) {
      const missing = [];
      responsibilities.forEach((r) => {
        if (r.missingRequirements && r.missingRequirements.length > 0) {
          missing.push(`- **${r.title}**: Missing [${r.missingRequirements.join(', ')}]`);
        }
      });
      if (missing.length === 0) return "✅ **All required documents and prerequisites are complete!**";
      return `### 📋 Missing Prerequisites & Documents\n\n${missing.join('\n')}\n\n*Tip: Prepare and upload these to unblock pending obligations.*`;
    }

    if (q.includes('due') || q.includes('week') || q.includes('deadline')) {
      const upcoming = responsibilities.filter((r) => r.deadline && r.status !== 'COMPLETED').sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
      if (upcoming.length === 0) return "You have no upcoming deadlines scheduled.";
      return `### 📅 Upcoming Deadlines\n\n` + upcoming.map((u) => `- **${u.title}**\n  *Due*: **${new Date(u.deadline).toLocaleDateString()}** | Priority: \`${u.priority}\` (Score: ${u.priorityScore})`).join('\n');
    }

    return `### 🧠 LifeOS Intelligence Summary\n\nLifeOS is actively monitoring **${responsibilities.length} obligations** for you.\n\n**Top Items**:\n` +
      responsibilities.slice(0, 3).map((r) => `- **${r.title}** (Priority: \`${r.priority}\`, Score: ${r.priorityScore || 50})`).join('\n') +
      `\n\n💡 *You can ask me:*\n- *"What should I do today?"*\n- *"Which tasks are blocked?"*\n- *"What documents are missing?"*\n- *"What is due this week?"*`;
  }

  /**
   * Robust JSON Extractor & Sanitizer for LLM outputs
   */
  static parseJSONResponse(text) {
    if (!text || typeof text !== 'string') return null;

    // 1. Try direct JSON parse
    try {
      return JSON.parse(text.trim());
    } catch (e) {}

    // 2. Extract content from ```json ... ``` or ``` ... ``` codeblock
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
      try {
        const cleanedBlock = codeBlockMatch[1].trim();
        return JSON.parse(cleanedBlock);
      } catch (e) {}
    }

    // 3. Extract substring between first '{' and last '}'
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const jsonCandidate = text.slice(firstBrace, lastBrace + 1);
      try {
        // Fix common trailing commas before parsing: e.g. { "a": 1, } -> { "a": 1 }
        const fixedTrailingCommas = jsonCandidate
          .replace(/,\s*([}\]])/g, '$1')
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' '); // remove control chars
        return JSON.parse(fixedTrailingCommas);
      } catch (e) {}
    }

    console.warn('[AIService] Failed to parse JSON from AI response. Fallback to rule engine.');
    return null;
  }
}
