import { Router } from 'express';
import * as ctrl from '../controllers/segmentController.js';
import { authenticate } from '../middlewares/auth.js';
import { idParam, partial, validate } from '../middlewares/validate.js';
import { criteriaSchema, validateCriteriaRanges } from '../services/segmentService.js';
import { paginationSchema } from '../utils/pagination.js';

const criteriaRule = { type: 'object', required: true, schema: criteriaSchema, custom: validateCriteriaRanges };

const bodySchema = {
  name: { type: 'string', required: true, maxLength: 120 },
  description: { type: 'string', maxLength: 2000 },
  criteria: criteriaRule,
};

const router = Router();
router.use(authenticate);
router.get('/', validate(paginationSchema, 'query'), ctrl.list);
router.post('/', validate(bodySchema), ctrl.create);
router.post('/preview', validate({ criteria: criteriaRule }), ctrl.preview); // must precede '/:id'
router.get('/:id', idParam, ctrl.get);
router.put('/:id', idParam, validate(partial(bodySchema)), ctrl.update);
router.delete('/:id', idParam, ctrl.remove);
router.get('/:id/customers', idParam, validate(paginationSchema, 'query'), ctrl.members);
export default router;
