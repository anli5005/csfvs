import { formatAuthors, getAllProjects } from "./projects.js";

export async function getSidebarDetails(db, user) {
    const projects = await getAllProjects(db);
    let reviewCounts = {};
    let reviewed = new Set();
    (await getUserReviews(db, user)).forEach(({project_id}) => {
        reviewed.add(project_id);
    });

    if (user.type === "judge" || user.type === "admin") {
        (await getReviewCounts(db)).forEach(({project_id, all, judge}) => {
            reviewCounts[project_id] = {all, judge};
        });
    }

    return {
        projects: projects.map(project => {
            return {
                ...project,
                authors: formatAuthors(project),
                reviewed: reviewed.has(project.project_id),
                reviewCount: (user.type === "judge" || user.type === "admin") && (reviewCounts[project.project_id] || {all: 0, judge: 0})
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

export async function getUserAssigned(db, user) {
    const res = await db.query("SELECT project_id FROM assigned WHERE email = $1;", [user.email]);
    return res.rows;
}

export async function getReviewCounts(db) {
    const res = await db.query("SELECT r.project_id, COUNT(r.review_id) as all, SUM(CAST((u.type='judge' OR u.type='admin') AS integer)) as judge FROM reviews as r, users as u WHERE r.user_id = u.user_id GROUP BY r.project_id;");
    return res.rows;
}
