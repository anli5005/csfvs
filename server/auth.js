/**
 * @typedef Profile
 * @property {string} outlook_id
 * @property {string} name
 * @property {string} email
 * @property {number} type
 */

/**
 * @param {import('pg').Client} db 
 * @param {Profile} profile 
 */
export async function findOrCreateUser(db, profile) {
    const res = await db.query("SELECT * FROM users WHERE outlook_id = $1", [profile.outlook_id]);
    console.log(res);
}
