async function searchTicket() {
    const ticketNo = document.getElementById("ticketNo").value.trim();

    if (!ticketNo) {
        alert("Please enter a Ticket Number");
        return;
    }

    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = `<div class="text-center py-4"><div class="spinner-border text-success"></div><p class="mt-2 text-muted">Fetching ticket...</p></div>`;

    try {
        const response = await fetch(`/ticket/${ticketNo}`);
        const data = await response.json();

        if (!response.ok) {
            resultDiv.innerHTML = `
                <div class="alert alert-danger">
                    <strong>Error:</strong> ${data.error || "Failed to fetch ticket"}
                </div>`;
            return;
        }

        function row(label, value) {
            return `<tr>
                <th width="30%">${label}</th>
                <td>${value || '<span class="text-muted">—</span>'}</td>
            </tr>`;
        }

        function statusBadge(status) {
            const s = (status || '').toLowerCase();
            let color = 'success';
            if (s.includes('close'))  color = 'secondary';
            if (s.includes('pending') || s.includes('hold')) color = 'warning';
            if (s.includes('open'))   color = 'primary';
            return `<span class="badge bg-${color} fs-6">${status || '—'}</span>`;
        }

        resultDiv.innerHTML = `
            <div class="card shadow-sm border-0 result-card">
                <div class="card-header bg-success text-white">
                    <h5 class="mb-0">Ticket Details</h5>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-bordered align-middle">
                            <tbody>
                                ${row("Ticket Number", data.ticketNo)}
                                ${row("Subject", data.subject)}
                                ${row("Date Created", data.date)}
                                ${row("Due By", data.dueBy)}
                                ${row("Requester Name", data.requesterName)}
                                ${row("Requester Email", data.requesterEmail)}
                                <tr>
                                    <th>Status</th>
                                    <td>${statusBadge(data.status)}</td>
                                </tr>
                                ${row("Priority", data.priority)}
                                ${row("display", data.display_id)}
                                ${row("Assigned Technician", data.technician)}
                                ${row("Group", data.group)}
                                ${row("Category", data.category)}
                                ${row("Site", data.site)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>`;

    } catch (err) {
        resultDiv.innerHTML = `
            <div class="alert alert-danger">
                <strong>Network error:</strong> ${err.message}
            </div>`;
    }
}

// Allow pressing Enter to search
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("ticketNo").addEventListener("keydown", (e) => {
        if (e.key === "Enter") searchTicket();
    });
});