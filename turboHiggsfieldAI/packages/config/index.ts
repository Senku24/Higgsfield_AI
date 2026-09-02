import credits from "./credits.json" with { type: "json" };

export interface CreditsConfig {
  signupGrant: number;
  avatarGenerationCost: number;
  videoGenerationCost: number;
}

export const CREDITS_CONFIG: CreditsConfig = credits;
export default CREDITS_CONFIG;
