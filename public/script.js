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
<div class="ticket-result">

    <div class="card border-0 shadow-sm mb-4">

        <div class="card-header bg-white">
            <h4 class="mb-0">📋 Request Details</h4>
        </div>

        <div class="card-body p-0">

            <table class="table table-bordered mb-0">

                <tr>
    <th width="35%">Ticket Number</th>
    <td>${data.ticketNo || "-"}</td>
</tr>

<tr>
    <th>Current Status</th>
    <td>
        <span class="badge status-badge">
            ${data.status || "-"}
        </span>
    </td>
</tr>

<tr>
    <th>Priority</th>
    <td>${data.priority || "-"}</td>
</tr>

<tr>
    <th>Created Date</th>
    <td>${data.createdDate || "-"}</td>
</tr>

<tr>
    <th>Requester Name</th>
    <td>${data.requesterName || "-"}</td>
</tr>

<tr>
    <th>Requester Email</th>
    <td>${data.requesterEmail || "-"}</td>
</tr>
            </table>

        </div>

    </div>

    <div class="card border-0 shadow-sm mb-4">

        <div class="card-body">

            <h4>📝 Resolution Summary</h4>

            <p class="mb-0">
                ${data.subject || "No summary available"}
            </p>

        </div>

    </div>

    

    <div class="card border-0 shadow-sm">

        <div class="card-body">

            <h5>🎧 Need Assistance?</h5>

            <p class="mb-0">
                Contact Service Desk and quote
                <strong>${data.displayId}</strong>
            </p>

        </div>

    </div>

</div>
`;
        

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