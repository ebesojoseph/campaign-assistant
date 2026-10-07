import { Router } from 'express';
import { CAMPAIGN_STATUS, CHANNELS, TONES, enumValues } from '../constants/index.js';
import * as ctrl from '../controllers/campaignController.js';
import { authenticate } from '../middlewares/auth.js';
import { aiLimiter } from '../middlewares/rateLimiter.js';
import { idParam, partial, validate } from '../middlewares/validate.js';
import { paginationSchema } from '../utils/pagination.js';

const channel = { type: 'string', required: true, enum: enumValues(CHANNELS) };
const tone = { type: 'string', required: true, enum: enumValues(TONES) };

const generateSchema = {
  objective: { type: 'string', required: true, minLength: 10, maxLength: 1000 },
  channel,
  tone,
  segmentId: { type: 'string', uuid: true },
  name: { type: 'string', maxLength: 150 },
  productOrOffer: { type: 'string', maxLength: 500 },
  additionalInstructions: { type: 'string', maxLength: 1000 },
  save: { type: 'boolean', default: true },
};

const manualSchema = {
  name: { type: 'string', required: true, maxLength: 150 },
  objective: { type: 'string', required: true, maxLength: 1000 },
  channel,
  tone,
  subject: { type: 'string', maxLength: 255 },
  preheader: { type: 'string', maxLength: 255 },
  content: { type: 'string', required: true, maxLength: 10000 },
  callToAction: { type: 'string', maxLength: 120 },
  segmentId: { type: 'string', uuid: true },
};

const querySchema = {
  ...paginationSchema,
  status: { type: 'string', enum: enumValues(CAMPAIGN_STATUS) },
  channel: { type: 'string', enum: enumValues(CHANNELS) },
  segmentId: { type: 'string', uuid: true },
  search: { type: 'string', maxLength: 100 },
};

const statusSchema = {
  status: { type: 'string', required: true, enum: enumValues(CAMPAIGN_STATUS) },
  scheduledAt: { type: 'date' },
};

const router = Router();
router.use(authenticate);
router.get('/', validate(querySchema, 'query'), ctrl.list);
router.post('/', validate(manualSchema), ctrl.create);
router.post('/generate', aiLimiter, validate(generateSchema), ctrl.generate);
router.get('/:id', idParam, ctrl.get);
router.put('/:id', idParam, validate(partial(manualSchema)), ctrl.update);
router.patch('/:id/status', idParam, validate(statusSchema), ctrl.setStatus);
router.post('/:id/regenerate', idParam, aiLimiter, validate({ feedback: { type: 'string', maxLength: 1000 } }), ctrl.regenerate);
router.delete('/:id', idParam, ctrl.remove);
export default router;
