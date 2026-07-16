/** Marketing Strategy checkbox options (multi-select) */
export const MARKETING_STRATEGY_OPTIONS = [
  'Print Flyer',
  'Digital',
  'Brining a Roster of Patients',
  'Road Signage',
  'Social Media Posting & Ads',
] as const

export type MarketingStrategyOption = (typeof MARKETING_STRATEGY_OPTIONS)[number]

export const MARKETING_STRATEGY_OPTION_SET = new Set<string>(MARKETING_STRATEGY_OPTIONS)

export function isMarketingStrategyOption(value: string): value is MarketingStrategyOption {
  return MARKETING_STRATEGY_OPTION_SET.has(value)
}
