export interface Player {
    player_name: string;
    character_name: string;
    team_name: string;
    team_num: number;
    team_placement: number;
    kills: number;
    damage_dealt: number;
    assists: number;
    shots: number;
    hits: number;
    headshots: number;
    knockdowns: number;
    revives_given: number;
    survival_time: number;
    team_id: string;
}

export interface Match {
    mid: string;
    map_name: string;
    aim_assist_allowed: boolean;
    match_start: string;
    ban: string;
    data: Player[];
}

export interface MatchData {
    matches: Match[];
}
