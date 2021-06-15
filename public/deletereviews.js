document.addEventListener("readystatechange", _ => {
    if (document.readyState === "complete") {
        const headers = document.getElementsByClassName("review-header");
        for (let i = 0; i < headers.length; i++) {
            const header = headers[i];
            const cell = document.createElement("th");
            cell.innerText = "Delete";
            header.appendChild(cell);
        }

        const rows = document.getElementsByClassName("review-row");
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const button = document.createElement("a");
            button.classList.add("text-danger");
            button.href = "#";
            button.innerText = "Delete";
            const cell = document.createElement("td");
            cell.appendChild(button);
            row.appendChild(cell);
            button.addEventListener("click", e => {
                e.preventDefault();
                if (confirm("Delete this review? Click OK to confirm.")) {
                    fetch(`/reviews/${row.id}`, {method: "DELETE"}).then(_ => {
                        window.location.reload();
                    });
                }
            });
        }
    }
});
