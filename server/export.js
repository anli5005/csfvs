import { stringify } from "csv-string";

export async function exportReviews(db) {
    let reviews = await db.query("SELECT r.review_id, p.name as project, u.name, u.email as email, u.type FROM reviews as r, projects as p, users as u WHERE r.project_id = p.project_id AND r.user_id = u.user_id;");
    reviews = reviews.rows;

    const criteria = await db.query("SELECT title FROM criteria WHERE type <> 'empty' ORDER BY ordering;");
    const headers = ["review_id", "project", "name", "email", "type", ...criteria.rows.map(x => x.title)];

    for (const i in reviews) {
        const review = reviews[i];
        const res = await db.query("SELECT x.val, x.description FROM review_xref as x, criteria as c WHERE x.criteria_id = c.criteria_id AND x.review_id = $1 ORDER BY c.ordering;", [review.review_id]);

        reviews[i] = [
            review.review_id,
            review.project,
            review.name,
            review.email,
            review.type,
            ...res.rows.map(x => x.val ? x.val : x.description)
        ];
    }

    return stringify([headers, ...reviews]);
}
