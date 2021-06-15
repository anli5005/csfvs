INSERT INTO users (user_id, outlook_id, email, name, type) VALUES ('24b18a58-5fc8-4ef3-a8f8-6d6f684339ba', 'a', 'a@a.a', 'usera', 'user');
INSERT INTO users (user_id, outlook_id, email, name, type) VALUES ('3bbc9863-9bc8-4851-9bd1-6491444de103', 'b', 'b@b.b', 'userb', 'user');

INSERT INTO criteria (criteria_id, type, title, description) VALUES ('5557f374-363a-49b7-9793-c0a5604f116b', 'scale', 'Meme', 'memedesc');
INSERT INTO criteria (criteria_id, type, title, description) VALUES ('52e5171b-a775-444e-8a92-d3e80dad0d18', 'free', 'AAAA', 'freedesc');

INSERT INTO projects (project_id, name, description, github, url, image, color) VALUES ('1201f323-8b35-4d9f-8a48-b56b58a7524a', 'projecta', 'desca', 'githuba', null, null, null);
INSERT INTO projects (project_id, name, description, github, url, image, color) VALUES ('51456775-c71d-45c1-848f-77a5a53c2616', 'projectb', 'descb', 'githubb', null, null, null);

INSERT INTO projects_users_xref (project_id, email) VALUES ('1201f323-8b35-4d9f-8a48-b56b58a7524a', 'a@a.a');
INSERT INTO projects_users_xref (project_id, email) VALUES ('1201f323-8b35-4d9f-8a48-b56b58a7524a', 'b@b.b');
INSERT INTO projects_users_xref (project_id, email) VALUES ('51456775-c71d-45c1-848f-77a5a53c2616', 'b@b.b');

INSERT INTO review_xref (review_id, criteria_id, description, val) VALUES ('f6a1b01a-a771-4cd8-9125-e0b25d1116bf', '5557f374-363a-49b7-9793-c0a5604f116b', null, '1');
INSERT INTO review_xref (review_id, criteria_id, description, val) VALUES ('8a6f50c1-18de-4078-8ea8-dd89164e005a', '5557f374-363a-49b7-9793-c0a5604f116b', null, '2');
INSERT INTO review_xref (review_id, criteria_id, description, val) VALUES ('be615f3a-3167-430c-8a99-4da5135c1693', '5557f374-363a-49b7-9793-c0a5604f116b', null, '3');
INSERT INTO review_xref (review_id, criteria_id, description, val) VALUES ('71856b4f-ae19-4056-874b-34eb2009b97f', '5557f374-363a-49b7-9793-c0a5604f116b', null, '4');
INSERT INTO review_xref (review_id, criteria_id, description, val) VALUES ('f6a1b01a-a771-4cd8-9125-e0b25d1116bf', '52e5171b-a775-444e-8a92-d3e80dad0d18', 'reva', null);
INSERT INTO review_xref (review_id, criteria_id, description, val) VALUES ('8a6f50c1-18de-4078-8ea8-dd89164e005a', '52e5171b-a775-444e-8a92-d3e80dad0d18', 'revb', null);
INSERT INTO review_xref (review_id, criteria_id, description, val) VALUES ('be615f3a-3167-430c-8a99-4da5135c1693', '52e5171b-a775-444e-8a92-d3e80dad0d18', 'revc', null);
INSERT INTO review_xref (review_id, criteria_id, description, val) VALUES ('71856b4f-ae19-4056-874b-34eb2009b97f', '52e5171b-a775-444e-8a92-d3e80dad0d18', 'revd', null);

INSERT INTO reviews (review_id, user_id, project_id) VALUES ('f6a1b01a-a771-4cd8-9125-e0b25d1116bf', '24b18a58-5fc8-4ef3-a8f8-6d6f684339ba', '1201f323-8b35-4d9f-8a48-b56b58a7524a');
INSERT INTO reviews (review_id, user_id, project_id) VALUES ('8a6f50c1-18de-4078-8ea8-dd89164e005a', '3bbc9863-9bc8-4851-9bd1-6491444de103', '1201f323-8b35-4d9f-8a48-b56b58a7524a');
INSERT INTO reviews (review_id, user_id, project_id) VALUES ('be615f3a-3167-430c-8a99-4da5135c1693', '24b18a58-5fc8-4ef3-a8f8-6d6f684339ba', '51456775-c71d-45c1-848f-77a5a53c2616');
INSERT INTO reviews (review_id, user_id, project_id) VALUES ('71856b4f-ae19-4056-874b-34eb2009b97f', '3bbc9863-9bc8-4851-9bd1-6491444de103', '51456775-c71d-45c1-848f-77a5a53c2616');
