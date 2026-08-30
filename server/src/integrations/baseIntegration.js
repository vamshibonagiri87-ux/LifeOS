export class BaseIntegration {
  constructor(providerName) {
    this.providerName = providerName;
  }

  async getAuthUrl(owner) {
    throw new Error('getAuthUrl must be implemented');
  }

  async handleCallback(code, owner) {
    throw new Error('handleCallback must be implemented');
  }

  async sync(owner) {
    throw new Error('sync must be implemented');
  }

  async checkStatus(owner) {
    throw new Error('checkStatus must be implemented');
  }

  async disconnect(owner) {
    throw new Error('disconnect must be implemented');
  }
}
