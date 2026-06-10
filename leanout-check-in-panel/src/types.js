/** @typedef {Object} CheckInRow
 * @property {string} date
 * @property {number} weightLbs
 * @property {number} compliance
 * @property {number} energy
 * @property {number} hunger
 * @property {number|null} steps
 * @property {boolean} workoutCompleted
 */

/** @typedef {Object} CheckInStats
 * @property {{ name: string, email: string, goalType: string|null }} user
 * @property {{ xp: number, level: number, xpProgressPct: number, currentStreak: number, longestStreak: number }} gamification
 * @property {CheckInRow|null} latest
 * @property {{ compliance: number|null, energy: number|null, hunger: number|null, workouts: number }} averages7d
 * @property {CheckInRow[]} recentCheckIns
 */

/** @typedef {Object} CheckInStatsResponse
 * @property {'ok'|'not_found'|'unconfigured'|'error'} status
 * @property {string} [message]
 * @property {string} [reporterEmail]
 * @property {string} [issueKey]
 * @property {CheckInStats|null} [stats]
 */

export {};
