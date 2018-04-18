var cron = require('cron');
var scrapeData = require('./scrapeData');

exports.init = function(){

    // Set to run every day at 6pm
    var scrapeJob = new cron.CronJob({
        cronTime: '0 18 * * * *',
        onTick: function() {
            scrapeData.run
            console.log('Scrape job triggered');
        },
        start: false,
        timeZone: 'America/Chicago'
    });
    
    scrapeJob.start();
    
    console.log('Scrape job scheduled');

}