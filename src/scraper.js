const puppeteer = require('puppeteer');
const { delay } = require('./helper.js');

const branches = [
    '',
    'Mayfield, KY',
    'Princeton, KY',
    'Russellville, KY',
    'Morganfield, KY',
    'Clarksville, TN',
    'Clinton, KY',
    'Cypress, IL',
    'Paducah, KY',
    'Hopkinsville, KY',
    'Jasper, IN',
    'Evansville, IN',
    'Poseyville, IN',
    '',
    'Newberry, IN',
];

async function scrape(options) {
    console.log('Starting scrape');

    options = Object.assign(
        {
            headless: true,
            ignoreHTTPSErrors: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
        options
    );

    const browser = await puppeteer.launch(options);
    let page = await browser.newPage();

    let customerPages,
        customerData = [];

    try {
        await page.goto('https://hutson.dealercustomerportal.com/Login');

        await page.waitForSelector(
            '#p_lt_zonecontent_LogonForm_Login1_UserName'
        );
        await page.type(
            '#p_lt_zonecontent_LogonForm_Login1_UserName',
            process.env.DCP_USER
        );
        await page.type(
            '#p_lt_zonecontent_LogonForm_Login1_Password',
            process.env.DCP_PWD
        );
        await delay(1000);
        await page.click('#p_lt_zonecontent_LogonForm_Login1_LoginButton');

        await delay(10000);

        await page.goto(
            'https://hutson.dealercustomerportal.com/Dealers/Customers'
        );

        await page.waitForSelector(
            '[ng-model="SearchFields.Status"]'
        );
        await page.click(
            '[ng-model="SearchFields.Status"]'
        );
        await page.select(
            '[ng-model="SearchFields.Status"]',
            'number:2'
        );

        await delay(1000);

        await page.click(
            '.Submitbtn[value=Search]'
        );

        await delay(5000);

        await page.waitForSelector(
            '[name=PageRecordCount]'
        );
        await page.select(
            '[name=PageRecordCount]',
            'number:100'
        );

        await delay(5000);

        customerPages = await page.evaluate(() => {
            let totalCustomers = document.querySelectorAll('.DealerCustomerTotalCustomers')[0]
                .innerText;

            totalCustomers = totalCustomers.replace(/\D/g, '');

            return Math.ceil(Number(totalCustomers) / 100);
        });

        for (let i = 1; i <= customerPages; i++) {
            let ind = i;
            if (ind !== 1) {
                if (ind > 10) {
                    ind = (ind % 10) + 2;
                }
                await page.click(
                    '.pagination-list > li:nth-child(' + (ind + 1) + ') a'
                );
            }

            await delay(5000);

            let result = [];

            result = await page.evaluate(branches => {
                let data = [];

                const tableEl = document.getElementById(
                    'dealercustomerstable'
                );

                const tableRows = tableEl.querySelectorAll('tr');

                for (let j = 1; j < tableRows.length; j++) {
                    let email = tableRows[
                        j
                    ].childNodes[5].innerText.toLowerCase();
                    let fullname = tableRows[j].childNodes[7].innerText;
                    let splitname = fullname.split(' ');
                    let firstname, lastname;
                    if(splitname.length > 2) {
                        lastname = splitname.pop();
                        firstname = splitname.join(' ');
                    }else {
                        firstname = splitname[0];
                        lastname = splitname[1];
                    }
                    let branch = tableRows[j].childNodes[11].innerText.substr(
                        0,
                        2
                    );
                    let createdDate = tableRows[j].childNodes[13].innerText;

                    branch = branches[Number(branch)] || '';

                    data.push({
                        email,
                        firstname,
                        lastname,
                        branch,
                        createdDate,
                    });
                }

                return data;
            }, branches);

            customerData = customerData.concat(result);
        }

        await delay(10000);

        await browser.close();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }

    console.log('Finished scrape');

    return customerData;
}

module.exports = {
    scrape,
};
