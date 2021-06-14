
export async function getAllProjects(db) {
    const res = await db.query("SELECT * FROM projects;");
    return res.rows;
}

export async function getProjectById(db, id) {
    const res = await db.query("SELECT * FROM projects WHERE project_id = $1;", [id]);
    if (res.rows.length === 1) {
        return res.rows[0];
    }
    return null;
}

export async function getUserProjects(db, profile) {
    const res = await db.query("SELECT p.* FROM projects as p, projects_users_xref as x WHERE x.project_id = p.project_id AND x.email = $1;", [profile.email]);
    return res.rows;
}
