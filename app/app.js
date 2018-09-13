require('dotenv').config();
const puppeteer = require('puppeteer');
const helper = require('./helper.js');

exports.scrape = async function(){

    console.log('Starting scrape.');
    
    const options = {
        headless: true,
        ignoreHTTPSErrors: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    };

    var returnError;
	
	const browser = await puppeteer.launch(options);
	var page = await browser.newPage();

	try{

		var customerPages, 
            customerData = [];

        await page.goto('https://hutson.dealercustomerportal.com/Login');

        await page.waitForSelector('#p_lt_zonecontent_LogonForm_Login1_UserName');
        await page.type('#p_lt_zonecontent_LogonForm_Login1_UserName', process.env.DCP_USER);
        await page.type('#p_lt_zonecontent_LogonForm_Login1_Password', process.env.DCP_PWD);
        await helper.delay(1000);
        await page.click('#p_lt_zonecontent_LogonForm_Login1_LoginButton');

        await helper.delay(10000);

        await page.goto('https://hutson.dealercustomerportal.com/Dealers/Customers');

        await page.waitForSelector('#p_lt_zonemain_pageplaceholder_p_lt_zoneContent_pageplaceholder_p_lt_ctl02_SedonaForm_ctl01_FormControl_DCPStatus_dropDownList');
        await page.click('#p_lt_zonemain_pageplaceholder_p_lt_zoneContent_pageplaceholder_p_lt_ctl02_SedonaForm_ctl01_FormControl_DCPStatus_dropDownList');
        await page.select('#p_lt_zonemain_pageplaceholder_p_lt_zoneContent_pageplaceholder_p_lt_ctl02_SedonaForm_ctl01_FormControl_DCPStatus_dropDownList', 'Enabled');
        await page.click('#p_lt_zonemain_pageplaceholder_p_lt_zoneContent_pageplaceholder_p_lt_ctl02_SedonaForm_ctl01_FormControl_SearchButton_btn');

        await helper.delay(5000);

        await page.waitForSelector('#p_lt_zonemain_pageplaceholder_p_lt_zoneContent_pageplaceholder_p_lt_ctl03_SedonaGrid_ctl01_UniGrid_p_drpPageSize');
        await page.select('#p_lt_zonemain_pageplaceholder_p_lt_zoneContent_pageplaceholder_p_lt_ctl03_SedonaGrid_ctl01_UniGrid_p_drpPageSize', '100');

        await helper.delay(5000);

        customerPages = await page.evaluate(() => {

            var paginationListEl = document.querySelector('.pagination-list');

            return paginationListEl.childElementCount - 2;

        });

        for(var i = 1; i <= customerPages; i++){

            if( i != 1){
                await page.click('.pagination-list > li:nth-child(' + (i + 1) + ') a');
            }

            await helper.delay(5000);

            let result = [];

            result = await page.evaluate(() => {

                let data = [];

                var tableEl = document.getElementById('p_lt_zonemain_pageplaceholder_p_lt_zoneContent_pageplaceholder_p_lt_ctl03_SedonaGrid_ctl01_UniGrid_v');

                var tableRows = tableEl.querySelectorAll('tr');

                for(var j = 1; j < tableRows.length; j++) {

                    let email = tableRows[j].childNodes[3].innerText;
                    let fullName = tableRows[j].childNodes[4].innerText;
                    let branch = tableRows[j].childNodes[5].innerText.substr(0, 2);

                    branchName = getBranchName(branch);

                    data.push({email: email.toLowerCase(), fullName: fullName, branch: branchName});

                }

                return data;

                function getBranchName(branch) {

                    var branchNumber;
                    
                    if(branch < 10) {

                        branchNumber = Number(branch.substr(1, 2));

                    }else {

                        branchNumber = Number(branch);

                    }

                    var branches = ['', 'Mayfield', 'Princeton', 'Russellville', 'Morganfield', 'Clarksville', 'Clinton', 'Cypress', 'Paducah', 'Hopkinsville', 'Jasper', 'Evansville', 'Poseyville', '', 'Newberry'];

                    return branches[branchNumber];
            
                }

            });

            customerData = customerData.concat(result);

        }

        await helper.delay(15000);
        
        await browser.close();

	}catch(err){

		if(err){
			console.log(err);
			returnError = err;
		}

    }
    
    console.log("Finished scrape");

	await browser.close();
    return {err: returnError, customerData: customerData};

};