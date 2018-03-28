require('dotenv').config();
const app = require('./app/app');
const index = require('./index');
const Emma = require('emma-sdk');
var winston = require('winston');

// Models
var Customer = require('./app/models/Customer.js');

var emma = new Emma({
    publicKey: process.env.EMMA_PUBLIC_KEY,
    privateKey: process.env.EMMA_PRIVATE_KEY,
    accountID: process.env.EMMA_ACCOUNT_ID
});

var today = new Date();
var todayString = (today.getMonth() + 1) + '-' + today.getDate() + '-' + today.getFullYear();

var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({filename: './logs/' + todayString + '.log'})
    ]
  });

index.startup().then(() => {

    app.scrape().then(data => {
        
        if(data.err){
            logger.log('Error occured. Exiting...');
            process.exit(0);
        }
        
        var i = 0;
        var newGroupMembers = [];

        (function processCustomer(){

            currentCustomer = data.customerData[i];
            
            // Search for customer in database
            Customer.findOne({email: currentCustomer.email}).exec(function(err, result){
                 
                 if(!result) {
                     
                    // New to database
                    // Check if has an Emma account
                    emma.member.withEmail(currentCustomer.email).details((err, res) => {
    
                        if(res) {
                            
                            // Customer in Emma
                            emma.member.withID(res.member_id).update({
                                fields: {
                                    "full-name": currentCustomer.fullName,
                                    "store-location": currentCustomer.branch
                                },
                                group_ids: [3301727]
                            }, (err) => {

                                if(err) logger.log(err);

                                createCustomer(res.member_id);
    
                                // Report that customer was updated in Emma
                                logger.log('Customer updated in Emma: ' + currentCustomer.email);

                                newGroupMembers.push(res.member_id);

                            });
    
                        }else {
    
                            // Customer not in Emma
                            emma.member.addOne({
                                email: currentCustomer.email, 
                                fields: {
                                    "full-name": currentCustomer.fullName,
                                    "store-location": currentCustomer.branch
                                }
                            }, (err, res) => {
        
                                if(err) logger.log(err);
                
                                createCustomer(res.member_id);
    
                                // Report that customer was added to Emma
                                logger.log('Customer added to Emma: ' + currentCustomer.email);
                                
                            });
                            
                        }
    
                    });
                     
                }else {
                    
                    increment();

                }

                function createCustomer(emmaAccount) {
    
                    var newCustomer = new Customer({
                        branch: currentCustomer.branch,
                        email: currentCustomer.email,
                        emmaAccount: emmaAccount,
                        fullName: currentCustomer.fullName
                    });
    
                    // Save new customer
                    newCustomer.save(err => {
                        
                        if(err) logger.log(err);
                        
                        // Report that new customer was saved
                        logger.log('Customer added to database: ' + currentCustomer.email);

                        increment();
    
                    });
    
                }
    
            });

            function increment() {
    
                i++;
                
                if(i < data.customerData.length){

                    processCustomer();

                }else {

                    if(newGroupMembers.length > 0) {

                        emma.group.withID(3301727).addMembers({
                            member_ids: newGroupMembers
                        }, (err, res) => {
    
                            if(err) logger.log(err);
    
                            logger.log('Customers added to Emma group.');
    
                            exitScript();
    
                        });

                    }else {

                        exitScript();

                    }

                    function exitScript() {

                        logger.log('Finished processing.');
                        process.exit(0);

                    }

                }

            }

        })();

    });

}, err => {

    logger.log(err);

});

