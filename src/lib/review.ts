import { daysBetween } from './dates';
import type { Meta } from './types';

export const REVIEW_MIN_DAYS_INSTALLED = 3;
export const REVIEW_MIN_SESSIONS = 4;
export const REVIEW_MIN_ACTIVE_SUBSCRIPTIONS = 3;
export const REVIEW_COOLDOWN_DAYS = 120;
export const REVIEW_MAX_PROMPTS = 3;

export interface ReviewGateInput {
  meta: Meta;
  activeCount: number;
  now: Date;
  /** True right after the user finished something satisfying, like saving a subscription. */
  afterPositiveAction: boolean;
}

/**
 * Decides whether this is a good moment to ask for a store rating.
 * Apple and Google both ask that the prompt come after real use, never from a
 * button, never during a task, and not repeatedly. iOS also hard-caps prompts
 * at three per year; this gate stays below that.
 */
export function shouldRequestReview(input: ReviewGateInput): boolean {
  const { meta, activeCount, now, afterPositiveAction } = input;
  if (!afterPositiveAction) return false;
  if (meta.reviewPromptCount >= REVIEW_MAX_PROMPTS) return false;
  if (meta.sessionCount < REVIEW_MIN_SESSIONS) return false;
  if (activeCount < REVIEW_MIN_ACTIVE_SUBSCRIPTIONS) return false;

  const installed = new Date(meta.installedAt);
  if (Number.isNaN(installed.getTime())) return false;
  if (daysBetween(installed, now) < REVIEW_MIN_DAYS_INSTALLED) return false;

  if (meta.lastReviewPromptAt) {
    const last = new Date(meta.lastReviewPromptAt);
    if (!Number.isNaN(last.getTime()) && daysBetween(last, now) < REVIEW_COOLDOWN_DAYS) return false;
  }
  return true;
}
