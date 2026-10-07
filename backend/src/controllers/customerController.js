import { asyncHandler } from '../utils/asyncHandler.js';
import * as customerService from '../services/customerService.js';

export const list = asyncHandler(async (req, res) => res.json(await customerService.listCustomers(req.validated.query)));
export const get = asyncHandler(async (req, res) => res.json({ data: await customerService.getCustomer(req.params.id) }));
export const create = asyncHandler(async (req, res) => res.status(201).json({ data: await customerService.createCustomer(req.validated.body) }));
export const update = asyncHandler(async (req, res) => res.json({ data: await customerService.updateCustomer(req.params.id, req.validated.body) }));
export const remove = asyncHandler(async (req, res) => {
  await customerService.deleteCustomer(req.params.id);
  res.status(204).end();
});
export const addTransaction = asyncHandler(async (req, res) =>
  res.status(201).json({ data: await customerService.recordTransaction(req.params.id, req.validated.body) })
);
