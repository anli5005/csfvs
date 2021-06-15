document.addEventListener("readystatechange", e => {
    if (document.readyState === "complete") {
        const sidebar = document.getElementById("sidebar");
        if (sidebar) {
            const active = sidebar.querySelector(".active");
            if (active && active.scrollIntoView) {
                active.scrollIntoView({block: "center"});
            }
        }
        const badges = document.getElementsByClassName("review-count-badge");
        for (let i = 0; i < badges.length; i++) {
            new bootstrap.Tooltip(badges[i]);
        }
    }
});
