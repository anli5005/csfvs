
export async function getAllUsers(db) {
    const res = await db.query("SELECT * FROM users;");
    return res.rows
}

// export async function

// export async function updateUserType(db, user, type) {

// }
