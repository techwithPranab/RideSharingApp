import express from 'express';
import {
  getSystemConfigs,
  getSystemConfig,
  createSystemConfig,
  updateSystemConfig,
  deleteSystemConfig,
  bulkUpdateSystemConfigs,
  getPublicSystemConfigs,
  getConfigCategories,
  initializeDefaultConfigs
} from '../../controllers/admin/systemConfigController';
import { requireAdmin } from '../../middleware/adminAuth';

const router = express.Router();

// Public configurations (no admin auth required for this endpoint)
router.get('/public/configs', getPublicSystemConfigs);

// All routes below require admin authentication
router.use(requireAdmin);

// System configuration CRUD routes
router.route('/')
  .get(getSystemConfigs)
  .post(createSystemConfig);

router.route('/:key')
  .get(getSystemConfig)
  .put(updateSystemConfig)
  .delete(deleteSystemConfig);

// Bulk operations
router.route('/bulk/update').put(bulkUpdateSystemConfigs);

// Configuration categories
router.get('/categories', getConfigCategories);

// Initialize default configurations
router.post('/initialize-defaults', initializeDefaultConfigs);

// Configuration categories
router.get('/categories', getConfigCategories);

// Initialize default configurations
router.post('/initialize-defaults', initializeDefaultConfigs);

export default router;
