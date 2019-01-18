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
            '#p_lt_zonemain_pageplaceholder_p_lt_zoneContent_pageplaceholder_p_lt_ctl02_SedonaForm_ctl01_FormControl_DCPStatus_dropDownList'
        );
        await page.click(
            '#p_lt_zonemain_pageplaceholder_p_lt_zoneContent_pageplaceholder_p_lt_ctl02_SedonaForm_ctl01_FormControl_DCPStatus_dropDownList'
        );
        await page.select(
            '#p_lt_zonemain_pageplaceholder_p_lt_zoneContent_pageplaceholder_p_lt_ctl02_SedonaForm_ctl01_FormControl_DCPStatus_dropDownList',
            'Enabled'
        );
        await page.click(
            '#p_lt_zonemain_pageplaceholder_p_lt_zoneContent_pageplaceholder_p_lt_ctl02_SedonaForm_ctl01_FormControl_SearchButton_btn'
        );

        await delay(5000);

        await page.waitForSelector(
            '#p_lt_zonemain_pageplaceholder_p_lt_zoneContent_pageplaceholder_p_lt_ctl03_SedonaGrid_ctl01_UniGrid_p_drpPageSize'
        );
        await page.select(
            '#p_lt_zonemain_pageplaceholder_p_lt_zoneContent_pageplaceholder_p_lt_ctl03_SedonaGrid_ctl01_UniGrid_p_drpPageSize',
            '100'
        );

        await delay(5000);

        customerPages = await page.evaluate(() => {
            const paginationListEl = document.querySelector('.pagination-list');

            return paginationListEl.childElementCount - 2;
        });

        for (let i = 1; i <= customerPages; i++) {
            if (i !== 1) {
                await page.click(
                    '.pagination-list > li:nth-child(' + (i + 1) + ') a'
                );
            }

            await delay(5000);

            let result = [];

            result = await page.evaluate(branches => {
                let data = [];

                const tableEl = document.getElementById(
                    'p_lt_zonemain_pageplaceholder_p_lt_zoneContent_pageplaceholder_p_lt_ctl03_SedonaGrid_ctl01_UniGrid_v'
                );

                const tableRows = tableEl.querySelectorAll('tr');

                for (let j = 1; j < tableRows.length; j++) {
                    let email = tableRows[
                        j
                    ].childNodes[3].innerText.toLowerCase();
                    let fullName = tableRows[j].childNodes[4].innerText;
                    let firstname = fullName.split(' ')[0];
                    let lastname = fullName.split(' ')[1];
                    let branch = tableRows[j].childNodes[5].innerText.substr(
                        0,
                        2
                    );

                    branch = branches[Number(branch)];

                    data.push({
                        email,
                        firstname,
                        lastname,
                        branch,
                    });
                }

                return data;
            }, branches);

            customerData = customerData.concat(result);
        }

        await delay(15000);

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
