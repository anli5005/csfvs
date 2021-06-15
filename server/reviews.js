
export async function getAllCriteria(db) {
    const res = await db.query("SELECT * FROM criteria ORDER BY ordering;");
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

export async function deleteReview(db, response_id) {
    await db.query("DELETE FROM reviews WHERE review_id = $1;", [response_id]);
}

export async function getUserReview(db, user, project) {
    const res = await db.query("SELECT * FROM reviews WHERE user_id = $1 AND project_id = $2;", [user.user_id, project.project_id]);
    if (res.rows.length > 0) {
        return res.rows[0];
    }
}

export async function getReviewCriteria(db, review) {
    const xref = await db.query("SELECT * FROM review_xref WHERE review_id = $1", [review.review_id]);
    return xref.rows;
}

export async function getProjectReviews(db, project, type) {
    let res;
    let query;

    if (type === "judge")
        query = "u.type = 'judge' OR u.type = 'admin'";
    else
        query = "u.type = 'default'";

    res = await db.query(
        `SELECT r.review_id, array_agg(x.criteria_id ORDER BY x.ordering) as criteria_ids, array_agg(x.val ORDER BY x.ordering) as vals, array_agg(x.description ORDER BY x.ordering) as descriptions FROM reviews as r LEFT JOIN (SELECT c.criteria_id, c.ordering, x.val, x.description, x.review_id FROM review_xref as x, criteria as c WHERE x.criteria_id = c.criteria_id) as x ON r.review_id = x.review_id LEFT JOIN users as u ON r.user_id = u.user_id WHERE r.project_id = $1 AND (${query}) GROUP BY r.review_id;`,
        [project.project_id]
    );

    return res.rows;
}

export function processReviews(reviews, criteria) {
    return reviews.map(data => {
        return {
            review_id: data.review_id,
            criteria: criteria.map(({ criteria_id, type }) => {
                const index = data.criteria_ids.indexOf(criteria_id);
                if (index !== -1) {
                    return { criteria_id, type, val: data.vals[index], description: data.descriptions[index] };
                } else {
                    return { criteria_id, type };
                }
            })
        }
    });
}

// a6e43331-c7db-4b2d-9459-d4fbba9a1524
// b3bd7e18-a068-4b1f-9d35-dcebd80beca6
