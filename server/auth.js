/**
 * @typedef Profile
 * @property {string} outlook_id
 * @property {string} name
 * @property {string} email
 * @property {string} type
 */

/**
 * @param {import('pg').Client} db 
 * @param {Profile} profile 
 */
export async function findOrCreateUser(db, profile) {
    const res = await db.query("SELECT * FROM users WHERE outlook_id = $1", [profile.outlook_id]);
    if (res.rows.length === 1) {
        return res.rows[0];
    } else if (res.rows.length === 0) {
        const insertRes = await db.query("INSERT INTO users (outlook_id, email, name, type) VALUES ($1, $2, $3, 'default') RETURNING user_id",  [profile.outlook_id, profile.email, profile.name]);
        // We'll deal with the welcome screen later
        return insertRes.rows[0];
    } else {
        throw new Error("Internal inconsistency: 2 users with same Google ID in database");
    }
}

/**
 * @param {import('passport')} passport
 * @param {import('pg').Client} db
 */
export function registerSerialization(passport, db) {
    passport.serializeUser((user, done) => {
        console.log(user);
        // @ts-ignore
        done(null, user.user_id);
    });

    passport.deserializeUser((user, done) => {
        db.query("SELECT * FROM users WHERE user_id = $1", [user]).then(user => {
            if (user.rows.length === 0) throw new Error("User not found");
            done(null, user.rows[0]);
        }).catch(err => {
            done(err, null);
        });
    });
}
