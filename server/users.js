
export async function getAllUsers(db) {
    const res = await db.query("SELECT * FROM users ORDER BY email;");
    return res.rows
}

export async function changeUserType(db, user, type) {
    await db.query("UPDATE users SET type = $1 WHERE id = $2", [type, user.user_id]);
}
