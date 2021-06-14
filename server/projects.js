
export async function getAllProjects(db) {
    const res = await db.query("SELECT p.*, array_agg(u.name ORDER BY u.name) as names, array_agg(u.email ORDER BY u.name) as emails FROM projects as p LEFT JOIN (SELECT u.name, u.email, x.project_id FROM users as u, projects_users_xref as x WHERE u.email = x.email) as u ON p.project_id = u.project_id GROUP BY p.project_id ORDER BY p.session, p.room;")
    return res.rows;
}

export async function getProjectById(db, id) {
    const res = await db.query("SELECT p.*, array_agg(u.name ORDER BY u.name) as names, array_agg(u.email ORDER BY u.name) as emails FROM projects as p LEFT JOIN (SELECT u.name, u.email, x.project_id FROM users as u, projects_users_xref as x WHERE u.email = x.email) as u ON p.project_id = u.project_id WHERE p.project_id = $1 GROUP BY p.project_id;", [id]);
    if (res.rows.length === 1) {
        return res.rows[0];
    }
    return null;
}

export async function getUserProjects(db, profile) {
    const res = await db.query("SELECT p.* FROM projects as p, projects_users_xref as x WHERE x.project_id = p.project_id AND x.email = $1;", [profile.email]);
    return res.rows;
}

export async function userOwnsProject(db, user, project) {
    const res = await db.query("SELECT project_id FROM projects_users_xref WHERE project_id = $1 AND email = $2", [project.project_id, user.email]);
    return res.rows.length > 0;
}

export function formatAuthors(project) {
    return project.names.map((name, i) =>
        name ? name : project.emails[i]
    ).join(", ");
}
