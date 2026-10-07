import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Op } = require('sequelize');
import { CAMPAIGN_STATUS, CAMPAIGN_TRANSITIONS, ROLES } from '../constants/index.js';
import { Campaign, Segment, User } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { getChannelViolations } from '../utils/channelRules.js';
import { paginated, parsePagination } from '../utils/pagination.js';
import { generateCampaignContent } from './aiService.js';
import { getSegment, summarizeAudience } from './segmentService.js';

const include = [
  { model: Segment, as: 'segment', attributes: ['id', 'name'] },
  { model: User, as: 'creator', attributes: ['id', 'name'] },
];

const LOCKED = [CAMPAIGN_STATUS.SCHEDULED, CAMPAIGN_STATUS.SENT, CAMPAIGN_STATUS.ARCHIVED];

function assertCanModify(campaign, user) {
  if (user.role !== ROLES.ADMIN && campaign.createdBy !== user.id) {
    throw new AppError(403, 'You can only modify your own campaigns', 'FORBIDDEN');
  }
}

export async function getCampaign(id) {
  const campaign = await Campaign.findByPk(id, { include });
  if (!campaign) throw new AppError(404, 'Campaign not found', 'NOT_FOUND');
  return campaign;
}

export async function listCampaigns(q) {
  const pg = parsePagination(q);
  const where = {};
  if (q.status) where.status = q.status;
  if (q.channel) where.channel = q.channel;
  if (q.segmentId) where.segmentId = q.segmentId;
  if (q.search) where.name = { [Op.like]: `%${q.search.replace(/[%_\\]/g, '\\$&')}%` };
  const { rows, count } = await Campaign.findAndCountAll({
    where,
    include,
    limit: pg.limit,
    offset: pg.offset,
    order: [['createdAt', 'DESC']],
    distinct: true,
  });
  return paginated(rows, count, pg);
}

async function loadAudience(segmentId) {
  if (!segmentId) return { segment: null, audience: await summarizeAudience({}) };
  const segment = await getSegment(segmentId);
  return { segment, audience: await summarizeAudience(segment.criteria) };
}

/** Generate copy with AI. With `save: false` the draft is returned without persisting. */
export async function generateCampaign(input, user) {
  const { segment, audience } = await loadAudience(input.segmentId);
  if (audience.size === 0) {
    throw new AppError(422, 'The selected audience has no opted-in customers', 'EMPTY_AUDIENCE');
  }

  const ai = await generateCampaignContent({
    objective: input.objective,
    channel: input.channel,
    tone: input.tone,
    audience,
    productOrOffer: input.productOrOffer,
    additionalInstructions: input.additionalInstructions,
  });

  const fields = {
    name: input.name || ai.name || `${input.channel} campaign`,
    objective: input.objective,
    channel: input.channel,
    tone: input.tone,
    subject: ai.subject,
    preheader: ai.preheader,
    content: ai.content,
    callToAction: ai.callToAction,
    rationale: ai.rationale,
    segmentId: segment?.id ?? null,
  };
  if (input.save === false) return { saved: false, draft: fields, meta: ai.meta };

  const campaign = await Campaign.create({
    ...fields,
    createdBy: user.id,
    aiMetadata: {
      ...ai.meta,
      inputs: { productOrOffer: input.productOrOffer, additionalInstructions: input.additionalInstructions },
      audience: { size: audience.size, avgSpent: audience.avgSpent, avgOrders: audience.avgOrders },
    },
  });
  return { saved: true, campaign: await getCampaign(campaign.id) };
}

/** Re-run generation on an existing draft, optionally applying reviewer feedback. */
export async function regenerateCampaign(id, { feedback }, user) {
  const campaign = await getCampaign(id);
  assertCanModify(campaign, user);
  if (campaign.status !== CAMPAIGN_STATUS.DRAFT) {
    throw new AppError(409, 'Only draft campaigns can be regenerated', 'INVALID_STATE');
  }
  const { audience } = await loadAudience(campaign.segmentId);

  const ai = await generateCampaignContent({
    objective: campaign.objective,
    channel: campaign.channel,
    tone: campaign.tone,
    audience,
    productOrOffer: campaign.aiMetadata?.inputs?.productOrOffer,
    additionalInstructions: campaign.aiMetadata?.inputs?.additionalInstructions,
    feedback,
    previousDraft: { subject: campaign.subject, content: campaign.content, callToAction: campaign.callToAction },
  });

  await campaign.update({
    subject: ai.subject,
    preheader: ai.preheader,
    content: ai.content,
    callToAction: ai.callToAction,
    rationale: ai.rationale,
    aiMetadata: { ...campaign.aiMetadata, ...ai.meta, lastFeedback: feedback || null },
  });
  return getCampaign(id);
}

export async function createManualCampaign(data, user) {
  if (data.segmentId) await getSegment(data.segmentId);
  const violations = getChannelViolations(data.channel, data);
  if (violations.length) throw new AppError(422, 'Content violates channel rules', 'VALIDATION_ERROR', violations.map((message) => ({ message })));
  const campaign = await Campaign.create({ ...data, createdBy: user.id });
  return getCampaign(campaign.id);
}

export async function updateCampaign(id, data, user) {
  const campaign = await getCampaign(id);
  assertCanModify(campaign, user);
  if (LOCKED.includes(campaign.status)) {
    throw new AppError(409, `A ${campaign.status} campaign cannot be edited`, 'INVALID_STATE');
  }
  if (data.segmentId) await getSegment(data.segmentId);

  const merged = { ...campaign.toJSON(), ...data };
  const violations = getChannelViolations(merged.channel, merged);
  if (violations.length) throw new AppError(422, 'Content violates channel rules', 'VALIDATION_ERROR', violations.map((message) => ({ message })));

  // Editing approved content invalidates the approval.
  const contentChanged = ['subject', 'preheader', 'content', 'callToAction', 'channel'].some((k) => k in data);
  if (campaign.status === CAMPAIGN_STATUS.APPROVED && contentChanged) data.status = CAMPAIGN_STATUS.DRAFT;

  await campaign.update(data);
  return getCampaign(id);
}

export async function changeStatus(id, { status, scheduledAt }, user) {
  const campaign = await getCampaign(id);
  assertCanModify(campaign, user);

  if (!CAMPAIGN_TRANSITIONS[campaign.status].includes(status)) {
    throw new AppError(409, `Cannot move a campaign from ${campaign.status} to ${status}`, 'INVALID_TRANSITION');
  }
  if (status === CAMPAIGN_STATUS.SCHEDULED) {
    if (!scheduledAt || scheduledAt <= new Date()) {
      throw new AppError(422, 'scheduledAt must be a future date', 'VALIDATION_ERROR', [{ field: 'scheduledAt', message: 'must be a future date' }]);
    }
    if (!campaign.segmentId) throw new AppError(422, 'A segment is required before scheduling', 'SEGMENT_REQUIRED');
  }
  await campaign.update({ status, scheduledAt: status === CAMPAIGN_STATUS.SCHEDULED ? scheduledAt : null });
  return getCampaign(id);
}

export async function deleteCampaign(id, user) {
  const campaign = await getCampaign(id);
  assertCanModify(campaign, user);
  if (campaign.status === CAMPAIGN_STATUS.SENT) {
    throw new AppError(409, 'Sent campaigns cannot be deleted, archive them instead', 'INVALID_STATE');
  }
  await campaign.destroy();
}
