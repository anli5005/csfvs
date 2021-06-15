document.addEventListener("readystatechange", e => {
    if (document.readyState === "complete") {
        const sidebar = document.getElementById("sidebar");
        if (sidebar) {
            const active = sidebar.querySelector(".active");
            if (active && active.scrollIntoView) {
                active.scrollIntoView({block: "center"});
            }
        }
    }
});