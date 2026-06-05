require('dotenv').config();

const express = require('express');
const axios = require('axios');

const app = express();

app.use(express.static('public'));

app.get('/ticket/:ticketNo', async (req, res) => {

    const ticketNo = req.params.ticketNo;

    try {

        /*
        Temporary mock data.
        Replace with ServiceDesk API later.
        */
        //  const response = await axios.get(
        //     `${process.env.SDESK_URL}/${ticketNo}`,
        //     {
        //         headers: {
        //             TECHNICIAN_KEY: process.env.API_TOKEN
        //         }
        //     }
        // );

        // console.log(response.data);

        // res.json(response.data);
        

        res.json({
            ticketNo: ticketNo,
            date: "05-Jun-2026",
            requesterName: "John Doe",
            requesterEmail: "john.doe@company.com",
            status: "Open"
        });

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});