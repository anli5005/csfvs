document.addEventListener("readystatechange", _ => {
    if (document.readyState === "complete") {
        const authors = document.getElementById("authors");
        if (authors) {
            new bootstrap.Tooltip(authors);
        }
    }
});
