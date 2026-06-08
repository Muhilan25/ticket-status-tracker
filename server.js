require('dotenv').config();

const express = require('express');
const axios = require('axios');
let cachedToken = null;
let tokenExpiry = 0;

const app = express();

app.use(express.static('public'));

/**
 * Generate Access Token using Refresh Token
 */
async function getAccessToken() {

    // If token is still valid, use it
    if (cachedToken && Date.now() < tokenExpiry) {
        console.log("Using cached token");
        return cachedToken;
    }

    console.log("Generating new token...");

    const response = await axios.post(
        'https://accounts.zoho.com/oauth/v2/token',
        null,
        {
            params: {
                refresh_token: process.env.REFRESH_TOKEN,
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                grant_type: 'refresh_token'
            }
        }
    );

    cachedToken = response.data.access_token;

    // Refresh 5 minutes before expiry
    tokenExpiry = Date.now() + ((response.data.expires_in - 300) * 1000);

    return cachedToken;
}

app.get('/ticket-test/:id', async (req, res) => {

    try {

        const accessToken = await getAccessToken();

        const response = await axios.get(
            `${process.env.SDESK_URL}/requests`,
            {
                headers: {
                    Authorization: `Zoho-oauthtoken ${accessToken}`,
                    Accept: 'application/vnd.manageengine.sdp.v3+json'
                }
            }
        );

        res.json(response.data);

    } catch (err) {

        res.status(500).json(
            err.response?.data || err.message
        );
    }
});



/**
 * Test Route
 */
app.get('/test-token', async (req, res) => {
    try {
        const token = await getAccessToken();

        res.json({
            success: true,
            token_preview: token.substring(0, 20) + '...'
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * Fetch Ticket Details
 */

app.get('/ticket/:displayId', async (req, res) => {

    const displayId = req.params.displayId;

    try {

        const accessToken = await getAccessToken();

        let startIndex = 1;
        let foundTicket = null;
        let hasMoreRows = true;

        while (hasMoreRows && !foundTicket) {

            const response = await axios.get(
                `${process.env.SDESK_URL}/requests`,
                {
                    headers: {
                        Authorization: `Zoho-oauthtoken ${accessToken}`,
                        Accept: 'application/vnd.manageengine.sdp.v3+json'
                    },
                    params: {
                        input_data: JSON.stringify({
                            list_info: {
                                row_count: 100,
                                start_index: startIndex
                            }
                        })
                    }
                }
            );

            const requests = response.data.requests || [];

            foundTicket = requests.find(r =>
                r.display_id === displayId ||
                r.display_key?.display_value === displayId ||
                r.display_key?.display_value === `SoftM-${displayId}` ||
                r.display_key?.display_value === `In-${displayId}`
            );

            hasMoreRows = response.data.list_info?.has_more_rows;
            startIndex += 100;
        }

        if (!foundTicket) {
            return res.status(404).json({
                error: `Ticket ${displayId} not found`
            });
        }

        const detailResponse = await axios.get(
            `${process.env.SDESK_URL}/requests/${foundTicket.id}`,
            {
                headers: {
                    Authorization: `Zoho-oauthtoken ${accessToken}`,
                    Accept: 'application/vnd.manageengine.sdp.v3+json'
                }
            }
        );

        const r = detailResponse.data.request;

        res.json({
            ticketNo: r.display_key?.display_value || r.display_id,
            status: r.status?.name,
            priority: r.priority?.name,
            createdDate: r.created_time?.display_value,
            requesterName: r.requester?.name,
            requesterEmail: r.requester?.email_id,
            subject: r.subject
        });

    } catch (err) {

        console.error(
            JSON.stringify(err.response?.data || err.message, null, 2)
        );

        res.status(500).json({
            error: err.response?.data || err.message
        });
    }
});



app.get('/debug', async (req, res) => {
    try {

        const accessToken = await getAccessToken();

        const response = await axios.get(
            `${process.env.SDESK_URL}/requests`,
            {
                headers: {
                    Authorization: `Zoho-oauthtoken ${accessToken}`,
                    Accept: 'application/vnd.manageengine.sdp.v3+json'
                },
                params: {
                    input_data: JSON.stringify({
                        list_info: {
                            row_count: 100
                        }
                    })
                }
            }
        );

        console.log(
            JSON.stringify(response.data.list_info, null, 2)
        );

        res.json(response.data);

    } catch (err) {

        console.error(
            err.response?.data || err.message
        );

        res.status(500).json(
            err.response?.data || err.message
        );
    }
});



/**
 * Health Check
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'UP'
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});