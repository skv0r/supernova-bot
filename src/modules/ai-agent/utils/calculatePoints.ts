/**
 * Упрощенная система подсчета очков ALGS
 * @param placement место команды (1-20)
 * @returns количество очков за плейсмент
 */
export function calculatePoints(placement: number): number {
    const pointsTable: { [key: number]: number } = {
        1: 12, 2: 9, 3: 7, 4: 5, 5: 5,
        6: 4, 7: 4, 8: 3, 9: 3, 10: 3,
        11: 2, 12: 2, 13: 2, 14: 1, 15: 1,
        16: 1, 17: 1, 18: 1, 19: 1, 20: 1,
    };
    return pointsTable[placement] || 0;
}

