require('dotenv').config({ path: './.env' });
const http = require('http');
const express = require('express');
const cron = require('cron');
const { run } = require('./index');

const app = express();
const server = http.createServer(app);

server.listen(process.env.PORT, process.env.HOST, () => {
    console.log('Express server running on port ' + process.env.PORT);

    setupCron();
});

function setupCron() {
    // Set to run every day at 6pm
    let job = new cron.CronJob({
        cronTime: '0 18 * * * *',
        onTick: function() {
            run;
            console.log('Scrape job triggered');
        },
        start: false,
        timeZone: 'America/Chicago',
    });

    job.start();

    console.log('Scrape job scheduled');
}
