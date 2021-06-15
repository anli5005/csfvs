import { stringify } from "csv-string";

export async function exportReviews(db) {
    let reviews = await db.query("SELECT r.review_id, p.name as project, u.name, u.email as email FROM reviews as r, projects as p, users as u WHERE r.project_id = p.project_id AND r.user_id = u.user_id;");
    reviews = reviews.rows;

    const criteria = await db.query("SELECT title FROM criteria ORDER BY criteria_id;");
    const headers = ["review_id", "project", "name", "email", ...criteria.rows.map(x => x.title)];

    for (const i in reviews) {
        const review = reviews[i];
        const res = await db.query("SELECT val, description FROM review_xref WHERE review_id = $1 ORDER BY criteria_id;", [review.review_id]);

        reviews[i] = [
            review.review_id,
            review.project,
            review.name,
            review.email,
            ...res.rows.map(x => x.val ? x.val : x.description)
        ];
    }

    return stringify([headers, ...reviews]);
}
