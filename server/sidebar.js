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
