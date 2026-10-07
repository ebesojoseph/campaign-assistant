import { Router } from 'express';
import { CUSTOMER_STATUS, ROLES, enumValues } from '../constants/index.js';
import * as controller from '../controllers/customerController.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { idParam, partial, validate } from '../middlewares/validate.js';
import { SORTABLE } from '../services/customerService.js';
import { paginationSchema } from '../utils/pagination.js';

const bodySchema = {
  firstName: { type: 'string', required: true, maxLength: 80 },
  lastName: { type: 'string', required: true, maxLength: 80 },
  email: { type: 'string', required: true, email: true, maxLength: 255, lowercase: true },
  phone: { type: 'string', maxLength: 32 },
  country: { type: 'string', maxLength: 56 },
  city: { type: 'string', maxLength: 80 },
  status: { type: 'string', enum: enumValues(CUSTOMER_STATUS) },
  marketingOptIn: { type: 'boolean' },
};

const querySchema = {
  ...paginationSchema,
  status: { type: 'string', enum: enumValues(CUSTOMER_STATUS) },
  country: { type: 'string', maxLength: 56 },
  search: { type: 'string', maxLength: 100 },
  marketingOptIn: { type: 'boolean' },
  sortBy: { type: 'string', enum: SORTABLE },
  order: { type: 'string', enum: ['asc', 'desc'] },
};

const transactionSchema = {
  amount: { type: 'number', required: true, min: 0.01, max: 10_000_000 },
  currency: { type: 'string', minLength: 3, maxLength: 3, default: 'USD' },
  category: { type: 'string', maxLength: 80 },
  purchasedAt: { type: 'date' },
};

const router = Router();
router.use(authenticate);
router.get('/', validate(querySchema, 'query'), controller.list);
router.post('/', validate(bodySchema), controller.create);
router.get('/:id', idParam, controller.get);
router.put('/:id', idParam, validate(partial(bodySchema)), controller.update);
router.delete('/:id', idParam, authorize(ROLES.ADMIN), controller.remove);
router.post('/:id/transactions', idParam, validate(transactionSchema), controller.addTransaction);
export default router;
