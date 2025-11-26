import { DEFAULT_PROMPTS } from './prompts.js';

export class AiGeneratorService {
  async generateCopy(promptKey: keyof typeof DEFAULT_PROMPTS, variables: Record<string, string> = {}): Promise<string> {
    const template = DEFAULT_PROMPTS[promptKey];
    const base = template ?? DEFAULT_PROMPTS.channelUpdate;
    const rendered = Object.entries(variables).reduce(
      (acc, [key, value]) => acc.replaceAll(`{{${key}}}`, value),
      base,
    );
    return `${rendered}\n\n#autogen`;
  }
}

