import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/campaignService.js';

export const list = asyncHandler(async (req, res) => res.json(await svc.listCampaigns(req.validated.query)));
export const get = asyncHandler(async (req, res) => res.json({ data: await svc.getCampaign(req.params.id) }));

export const generate = asyncHandler(async (req, res) => {
  const result = await svc.generateCampaign(req.validated.body, req.user);
  res.status(result.saved ? 201 : 200).json({ data: result.saved ? result.campaign : { draft: result.draft, meta: result.meta } });
});

export const regenerate = asyncHandler(async (req, res) =>
  res.json({ data: await svc.regenerateCampaign(req.params.id, req.validated.body, req.user) })
);
export const create = asyncHandler(async (req, res) =>
  res.status(201).json({ data: await svc.createManualCampaign(req.validated.body, req.user) })
);
export const update = asyncHandler(async (req, res) =>
  res.json({ data: await svc.updateCampaign(req.params.id, req.validated.body, req.user) })
);
export const setStatus = asyncHandler(async (req, res) =>
  res.json({ data: await svc.changeStatus(req.params.id, req.validated.body, req.user) })
);
export const remove = asyncHandler(async (req, res) => {
  await svc.deleteCampaign(req.params.id, req.user);
  res.status(204).end();
});
