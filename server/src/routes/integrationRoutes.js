import express from 'express';
import { IntegrationController } from '../controllers/integrationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// General status & configuration
router.get('/', protect, IntegrationController.getStatus);
router.get('/status', protect, IntegrationController.getStatus);
router.post('/google/config', protect, IntegrationController.saveGoogleConfig);
router.post('/ai-config', protect, IntegrationController.saveAIConfig);
router.post('/ai-test', protect, IntegrationController.testAIKey);
router.post('/purge-demo', protect, IntegrationController.purgeDemoData);
router.post('/test-connection', protect, IntegrationController.testCredentials);

// Gmail routes
router.get('/gmail/start', protect, IntegrationController.startGmailOAuth);
router.get('/gmail/callback', IntegrationController.handleGmailCallback);
router.post('/gmail/sync', protect, IntegrationController.syncGmail);
router.get('/gmail/status', protect, IntegrationController.getGmailStatus);
router.delete('/gmail', protect, IntegrationController.disconnectGmail);

// Calendar routes
router.get('/calendar/start', protect, IntegrationController.startCalendarOAuth);
router.get('/calendar/callback', IntegrationController.handleCalendarCallback);
router.post('/calendar/sync', protect, IntegrationController.syncCalendar);
router.get('/calendar/status', protect, IntegrationController.getCalendarStatus);
router.delete('/calendar', protect, IntegrationController.disconnectCalendar);

// Calendar aliases
router.get('/google-calendar/start', protect, IntegrationController.startCalendarOAuth);
router.get('/google-calendar/callback', IntegrationController.handleCalendarCallback);
router.post('/google-calendar/sync', protect, IntegrationController.syncCalendar);
router.get('/google-calendar/status', protect, IntegrationController.getCalendarStatus);
router.delete('/google-calendar', protect, IntegrationController.disconnectCalendar);

// Direct Account Connection routes
router.post('/:provider/connect-direct', protect, IntegrationController.connectDirect);
router.post('/calendar/connect-direct', protect, IntegrationController.connectDirect);
router.post('/google-calendar/connect-direct', protect, IntegrationController.connectDirect);
router.post('/gmail/connect-direct', protect, IntegrationController.connectDirect);

// General OAuth routes
router.get('/oauth/error', IntegrationController.oauthError);
router.get('/oauth/:provider/start', protect, (req, res, next) => IntegrationController.handleGeneralOAuthStart(req, res, next));
router.get('/oauth/:provider/callback', (req, res, next) => IntegrationController.handleGeneralOAuthCallback(req, res, next));

export const integrationRoutes = router;
