import * as fs from 'fs';
import * as path from 'path';

// Типы данных для игрока и матча
interface Player {
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

interface Match {
    mid: string;
    map_name: string;
    aim_assist_allowed: boolean;
    match_start: string;
    ban: string;
    data: Player[];
}

interface MatchData {
    matches: Match[];
}

// Функция для загрузки данных из JSON
const loadJsonData = (filePath: string): MatchData => {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
};

// Парсинг данных для конкретной команды
const parseMatchData = (filePath: string, teamName: string) => {
    const data = loadJsonData(filePath);
    
    // Перебираем все матчи и выводим информацию по команде
    data.matches.forEach((match: Match) => {
        let totalKills = 0;
        let totalDamage = 0;
        let totalPlayers = 0;

        // Выводим информацию по каждому матчу
        console.log(`\nМатч на карте: ${match.map_name}`);
        console.log(`Плейсмент команды: ${match.data[0].team_placement}`);
        
        // Перебираем игроков в этом матче
        match.data.forEach((player: Player) => {
            if (player.team_name === teamName) {
                totalKills += player.kills;
                totalDamage += player.damage_dealt;
                totalPlayers += 1;

                // Выводим информацию по каждому игроку
                console.log(`${player.player_name} на карте:`);
                console.log(`Киллы: ${player.kills}, Урон: ${player.damage_dealt}`);
            }
        });

        // Выводим суммарную статистику для команды в этом матче
        console.log(`\nОбщие киллы команды: ${totalKills}`);
        console.log(`Общий урон команды: ${totalDamage}`);
        console.log(`Общее количество игроков в команде: ${totalPlayers}`);
    });
};

// Пример использования
const filePath = 'lobbies_3_19882b_scores.json'; // Убедитесь, что файл находится в той же папке
const teamName = 'SUPERNOVA';  // Замените на нужную команду
parseMatchData(filePath, teamName);
