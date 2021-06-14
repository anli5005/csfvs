
export async function getAllCriteria(db) {
    const res = await db.query("SELECT * FROM criteria;");
    return res.rows;
}

export async function createReview(db, user, project, responses) {
    const res = await db.query("INSERT INTO reviews (user_id, project_id) VALUES ($1, $2) RETURNING *;", [user.user_id, project.project_id]);
    if (res.rows.length === 1) {
        const review = res.rows[0];

        for (let el of responses) {
            await db.query(
                "INSERT INTO review_xref (review_id, criteria_id, description, val) VALUES ($1, $2, $3, $4);",
                [review.review_id, el.criteria_id, el.description, el.val]
            );
        }

        return review;
    } else {
        throw new Error("magic!");
    }

}

// a6e43331-c7db-4b2d-9459-d4fbba9a1524
// b3bd7e18-a068-4b1f-9d35-dcebd80beca6
