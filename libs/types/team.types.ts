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

// Статистика тройки героев команды
export interface TeamCompositionPerformance {
    heroes: string[];
    avgPlacement: number;
    gamesPlayed: number;
    bestPlacement: number;
    worstPlacement: number;
}

// Статистика героя команды
export interface TeamHeroPerformance {
    heroName: string;
    avgPlacement: number;
    gamesPlayed: number;
    bestPlacement: number;
    worstPlacement: number;
}

// Рейтинг игрока относительно всех
export interface PlayerRanking {
    playerName: string;
    damageRank: number;
    damageTotal: number;
    killsRank: number;
    killsTotal: number;
    assistsRank: number;
    assistsTotal: number;
    survivalRank: number;
    survivalTotal: number;
    totalPlayers: number;
}

// Командная статистика (продвинутая версия)
export interface TeamStats {
    teamCompositions: TeamCompositionPerformance[];
    heroPerformances: TeamHeroPerformance[];
    playerRankings: PlayerRanking[];
}

// Персональная статистика игрока
export interface PlayerStats {
    playerName: string;
    totalKills: number;
    avgKills: number;
    maxKills: number;
    totalDamage: number;
    avgDamage: number;
    maxDamage: number;
    totalAssists: number;
    avgAssists: number;
    maxAssists: number;
    avgSurvivalTime: number;
    totalKnockdowns: number;
    totalRevives: number;
    gamesPlayed: number;
}

// Статистика тройки героев
export interface TeamComposition {
    heroes: string[]; // отсортированный массив из 3 героев
    wins: number; // количество побед (1-3 место)
    losses: number; // количество поражений (4-20 место)
    totalGames: number;
    winRate: number; // процент побед
}

// Статистика отдельного героя
export interface CharacterStats {
    characterName: string;
    totalPicks: number;
    wins: number;
    losses: number;
    winRate: number;
    loseRate: number;
}

// Игровая статистика
export interface GameStats {
    totalMaps: number;
    bans: Map<string, number>; // character_name -> count
    mostFrequentBans: string[]; // топ-5 банов
    characterPickRate: Map<string, number>; // character_name -> count
    mapPlayRate: Map<string, number>; // map_name -> count
    teamCompositions: TeamComposition[]; // статистика троек героев (общая)
    teamCompositionsByMap: Map<string, TeamComposition[]>; // статистика троек по картам
    characterStats: CharacterStats[]; // винрейт/лузрейт каждого героя
}