import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/segmentService.js';

export const list = asyncHandler(async (req, res) => res.json(await svc.listSegments(req.validated.query)));
export const get = asyncHandler(async (req, res) => res.json({ data: await svc.getSegmentWithCount(req.params.id) }));
export const create = asyncHandler(async (req, res) =>
  res.status(201).json({ data: await svc.createSegment(req.validated.body, req.user.id) })
);
export const update = asyncHandler(async (req, res) => res.json({ data: await svc.updateSegment(req.params.id, req.validated.body) }));
export const remove = asyncHandler(async (req, res) => {
  await svc.deleteSegment(req.params.id);
  res.status(204).end();
});
export const members = asyncHandler(async (req, res) => res.json(await svc.listSegmentMembers(req.params.id, req.validated.query)));
export const preview = asyncHandler(async (req, res) => res.json({ data: await svc.previewCriteria(req.validated.body.criteria) }));
