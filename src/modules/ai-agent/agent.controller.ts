import { AiGeneratorService } from './generator.service.js';
import { analyzeTeamStats } from './analyzer/teamAnalyzer.js';
import { Match } from './team.types.js';
import { DEFAULT_TEAM_NAME } from '../../config/constants.js';

export class AgentController {
  constructor(private readonly generator = new AiGeneratorService()) {}

  generateChannelUpdate(variables: Record<string, string>): Promise<string> {
    return this.generator.generateCopy('channelUpdate', variables);
  }

  generateTwitchLiveAnnouncement(variables: Record<string, string>): Promise<string> {
    return this.generator.generateCopy('twitchLive', variables);
  }

  analyzeTeamPerformance(matches: Match[], teamName: string = DEFAULT_TEAM_NAME) {
    return analyzeTeamStats(matches, teamName);
  }
}

