export class RecoveryAgent {
  static classifyFailure(error) {
    const msg = (error.message || '').toLowerCase();
    
    if (msg.includes('rate limit') || msg.includes('429')) {
      return {
        type: 'RATE_LIMIT',
        strategy: 'retry_with_backoff',
        backoffDelayMs: 3000,
        shouldRetry: true,
      };
    }

    if (msg.includes('auth') || msg.includes('token') || msg.includes('401') || msg.includes('403')) {
      return {
        type: 'AUTH_EXPIRED',
        strategy: 'escalate',
        shouldRetry: false,
      };
    }

    if (msg.includes('empty') || msg.includes('missing field') || msg.includes('validation')) {
      return {
        type: 'MISSING_FIELDS',
        strategy: 'escalate',
        shouldRetry: false,
      };
    }

    if (msg.includes('pdf') || msg.includes('parse') || msg.includes('unsupported format')) {
      return {
        type: 'DOCUMENT_PARSE_FAILURE',
        strategy: 'escalate',
        shouldRetry: false,
      };
    }

    if (msg.includes('timeout') || msg.includes('econnrefused') || msg.includes('network')) {
      return {
        type: 'TRANSIENT',
        strategy: 'retry_with_backoff',
        backoffDelayMs: 2000,
        shouldRetry: true,
      };
    }

    return {
      type: 'AI_FAILURE',
      strategy: 'retry_with_backoff',
      backoffDelayMs: 1500,
      shouldRetry: true,
    };
  }

  static async handle(error, retryCount = 0, maxRetries = 3) {
    const classification = this.classifyFailure(error);

    if (classification.shouldRetry && retryCount < maxRetries) {
      return {
        action: 'retry_with_backoff',
        classification: classification.type,
        delayMs: classification.backoffDelayMs * Math.pow(2, retryCount),
        nextRetryCount: retryCount + 1,
      };
    }

    return {
      action: 'escalate',
      classification: classification.type,
      message: `Failed after ${retryCount} attempts: ${error.message}`,
    };
  }
}
