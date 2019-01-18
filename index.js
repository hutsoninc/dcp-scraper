require('dotenv').config({ path: './.env' });
const Hubspot = require('hubspot');
const hubspot = new Hubspot({ apiKey: process.env.HUBSPOT_API_KEY });
const Promise = require('bluebird');
const mongoose = require('mongoose');
const { scrape } = require('./src/scraper');

const Customer = require('./src/models/Customer.js');

let today = new Date();
let todayString =
    today.getMonth() + 1 + '-' + today.getDate() + '-' + today.getFullYear();

async function init() {
    console.log('Date: ' + todayString);

    return new Promise(function(resolve, reject) {
        // Set up default mongoose connection
        mongoose.connect(
            process.env.DB_LOCATION,
            err => {
                if (err) {
                    console.log(err);
                    process.exit(1);
                }
            }
        );

        // Get the default connection
        let db = mongoose.connection;

        db.on('connected', () => {
            console.log('MongoDB connected');
            resolve();
        });

        db.on('error', err => {
            console.log('MongoDB error: ' + err);
            reject(err);
        });
    });
}

async function run(options) {
    try {
        await init();

        let data = await scrape(options);

        console.log('Checking database for customers');

        let promises = data.map(customer => {
            return new Promise((resolve, reject) => {
                Customer.findOne({
                    email: customer.email,
                }).exec((err, res) => {
                    if (err) console.error(err);
                    if (!res) resolve(customer);
                    resolve(null);
                });
            });
        });

        data = await Promise.all(promises);

        data = data.filter(obj => obj !== null);

        console.log('Adding customers to HubSpot');

        promises = data.map(customer => {
            return new Promise(async (resolve, reject) => {
                hubspot.contacts
                    .createOrUpdate(customer.email, {
                        properties: [
                            {
                                property: 'firstname',
                                value: customer.firstname || '',
                            },
                            {
                                property: 'lastname',
                                value: customer.lastname || '',
                            },
                            {
                                property: 'branch',
                                value: customer.branch || '',
                            },
                            {
                                property: 'dealer_customer_portal',
                                value: 'yes',
                            },
                        ],
                    })
                    .then(async res => {
                        console.log(res);
                        createCustomer(customer).then(() => {
                            resolve();
                        });
                    });
            });
        });

        await Promise.all(promises);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }

    process.exit(0);
}

async function createCustomer(data) {
    let newCustomer = new Customer(data);

    // Save new customer
    await newCustomer.save(err => {
        if (err) console.error(err);
        return;
    });
    // Report that new customer was saved
    console.log('Customer added to database: ' + data.email);

    return;
}

module.exports = {
    run,
};
