require('dotenv').config();
const app = require('./app/app');
const index = require('./index');
var fs = require('fs');

// Models

index.startup().then(() => {

    app.scrape().then(data => {

        if(data.err){
            console.log('Error occured. Exiting...');
            process.exit(0);
        }

        fs.writeFile('info.json', JSON.stringify(data.customerData), err => {
            if(err) console.log(err);
        })

    });

}, err => {

    console.log(err);

});

