export const ROLES = Object.freeze({ ADMIN: 'admin', MARKETER: 'marketer' });

export const CHANNELS = Object.freeze({
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
  WHATSAPP: 'whatsapp',
});

export const TONES = Object.freeze({
  PROFESSIONAL: 'professional',
  FRIENDLY: 'friendly',
  URGENT: 'urgent',
  PLAYFUL: 'playful',
  LUXURY: 'luxury',
  EMPATHETIC: 'empathetic',
});

export const CUSTOMER_STATUS = Object.freeze({
  LEAD: 'lead',
  ACTIVE: 'active',
  VIP: 'vip',
  INACTIVE: 'inactive',
  CHURNED: 'churned',
});

export const CAMPAIGN_STATUS = Object.freeze({
  DRAFT: 'draft',
  APPROVED: 'approved',
  SCHEDULED: 'scheduled',
  SENT: 'sent',
  ARCHIVED: 'archived',
});

export const CAMPAIGN_TRANSITIONS = Object.freeze({
  draft: ['approved', 'archived'],
  approved: ['draft', 'scheduled', 'archived'],
  scheduled: ['approved', 'sent', 'archived'],
  sent: ['archived'],
  archived: ['draft'],
});

/** Hard limits per channel; enforced on AI output and on manual edits. */
export const CHANNEL_LIMITS = Object.freeze({
  email: { subject: 150, content: 5000, requiresSubject: true },
  sms: { content: 160 },
  push: { subject: 50, content: 150, requiresSubject: true },
  whatsapp: { content: 1000 },
});

export const enumValues = (obj) => Object.values(obj);
