require('dotenv').config();

const express = require('express');
const axios = require('axios');

const app = express();

app.use(express.static('public'));

/**
 * Generate Access Token using Refresh Token
 */
async function getAccessToken() {
    try {
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

        console.log('TOKEN RESPONSE:', response.data);

        return response.data.access_token;

    } catch (err) {
        console.error(
            'TOKEN ERROR:',
            JSON.stringify(err.response?.data || err.message, null, 2)
        );

        throw err;
    }
}

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
app.get('/ticket/:id', async (req, res) => {

    const id = req.params.id;

    try {

        const accessToken = await getAccessToken();

        const url = `${process.env.SDESK_URL}/requests/${id}`;

        console.log('Calling URL:', url);

        const response = await axios.get(url, {
            headers: {
                Authorization: `Zoho-oauthtoken ${accessToken}`,
                Accept: 'application/vnd.manageengine.sdp.v3+json'
            }
        });

        const r = response.data.request;

        res.json({
            ticketNo: r.id,
            displayId: r.display_id,
            subject: r.subject,
            date: r.created_time?.display_value,
            dueBy: r.due_by_time?.display_value,
            requesterName: r.requester?.name,
            requesterEmail: r.requester?.email_id,
            status: r.status?.name,
            priority: r.priority?.name,
            display_id: r.display_id,
            technician: r.technician?.name,
            group: r.group?.name,
            category: r.category?.name,
            site: r.site?.name
        });

    } catch (err) {

        console.error(
            'SERVICEDESK ERROR STATUS:',
            err.response?.status
        );

        console.error(
            'SERVICEDESK ERROR DATA:',
            err.response?.data || err.message
        );

        res.status(500).json({
            error: err.response?.data || err.message
        });
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