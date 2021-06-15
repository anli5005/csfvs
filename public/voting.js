document.addEventListener("readystatechange", _ => {
    if (document.readyState === "complete") {
        const button = document.getElementById("submit-vote");
        const form = document.getElementById("vote-form");
        button.disabled = true;
        form.addEventListener("change", _ => {
            button.disabled = !form.checkValidity();
        });
    }
});
