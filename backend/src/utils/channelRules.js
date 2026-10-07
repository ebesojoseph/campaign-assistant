import { CHANNEL_LIMITS } from '../constants/index.js';

/** Returns a list of human-readable violations for the given channel (empty = valid). */
export function getChannelViolations(channel, { subject, content }) {
  const limits = CHANNEL_LIMITS[channel];
  const out = [];
  if (!limits) return out;
  if (limits.requiresSubject && !subject) out.push(`subject is required for ${channel}`);
  if (limits.subject && subject && subject.length > limits.subject) {
    out.push(`subject must be at most ${limits.subject} characters for ${channel}`);
  }
  if (!content) out.push('content is required');
  else if (content.length > limits.content) {
    out.push(`content must be at most ${limits.content} characters for ${channel}`);
  }
  return out;
}
