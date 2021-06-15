import { formatAuthors, getAllProjects } from "./projects.js";

export async function getSidebarDetails(db) {
    const projects = await getAllProjects(db);

    return {
        projects: projects.map(project => {
            return {
                ...project,
                authors: formatAuthors(project)
            };
        }).reduce((groups, project) => {
            const session = project.session || null;
            if (groups.length > 0 && groups[groups.length - 1].session === session) {
                groups[groups.length - 1].projects.push(project);
                return groups;
            } else {
                return groups.concat([{session, projects: [project]}]);
            }
        }, [])
    };
}

export async function getUserReviews(db, user) {
    const res = await db.query("SELECT project_id FROM reviews WHERE user_id = $1;", [user.user_id]);
    return res.rows;
}

export async function getReviewCounts(db) {
    const res = await db.query("SELECT r.project_id, COUNT(r.review_id) as all, SUM(CAST(u.type='judge' AS integer)) as judge FROM reviews as r, users as u WHERE r.user_id = u.user_id GROUP BY r.project_id;");
    return res.rows;
}
