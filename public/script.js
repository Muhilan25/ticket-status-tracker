async function searchTicket() {

    const ticketNo =
        document.getElementById("ticketNo").value;

    if (!ticketNo) {
        alert("Please enter a Ticket Number");
        return;
    }

    const response =
        await fetch(`/ticket/${ticketNo}`);

    const data =
        await response.json();

    document.getElementById("result").innerHTML = `

        <div class="card shadow-sm result-card border-0">

            <div class="card-header bg-success text-white">
                <h5 class="mb-0">Ticket Details</h5>
            </div>

            <div class="card-body">

                <div class="table-responsive">

                    <table class="table table-bordered align-middle">

                        <tbody>

                            <tr>
                                <th width="30%">Ticket Number</th>
                                <td>${data.ticketNo}</td>
                            </tr>

                            <tr>
                                <th>Date</th>
                                <td>${data.date}</td>
                            </tr>

                            <tr>
                                <th>Requester Name</th>
                                <td>${data.requesterName}</td>
                            </tr>

                            <tr>
                                <th>Requester Email</th>
                                <td>${data.requesterEmail}</td>
                            </tr>

                            <tr>
                                <th>Status</th>
                                <td>
                                    <span class="badge bg-success fs-6">
                                        ${data.status}
                                    </span>
                                </td>
                            </tr>

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    `;
}