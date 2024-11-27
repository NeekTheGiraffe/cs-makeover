import fetch from 'node-fetch';
import express from 'express';
import { load } from 'cheerio';
import qs from 'qs';

import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

const hostname = 'web.cs.ucla.edu';

const classesCache = {};
const classesCacheTtlMs = 24 * 60 * 60 * 1000;

// Setup express server
const app = express();
const port = process.env.PORT || 3000;

app.get('/', async (req, res) => {
    const now = new Date();
    const abbreviatedYear = now.getFullYear() - 2000;
    const term = `${getSeason(now)}${abbreviatedYear}`;
    const defaultSubroute = `/classes/${term}`;

    if (classesCache[term] == null || now - classesCache[term].lastUpdated > classesCacheTtlMs) {
        try {
            classesCache[term] = {
                classes: await getClasses(term),
                lastUpdated: now,
            }
            console.log(`Successfully retrieved classes for ${term} and updated cache`);
        } catch (e) {
            console.error(`Failed to retrieve classes for ${term}`);
        }
    }
    const classes = classesCache[term]?.classes ?? [];

    res.render(path.join(rootDir, 'templates', 'index.ejs'), { classes, defaultSubroute });
});

app.use(express.static(path.join(rootDir, 'public')));

// Handle Go button from homepage
// Simply redirects the page to the path that the user entered in the form
app.get('/go', (req, res) => {
    res.redirect(req.query.path || '/');
});

// Handle CS website path
app.get('*', (req, res) => {
    /* Get the full path. Looks something like:
    /* foo/bar/cs111
    /* foo/bar/cs111/index.html   */
    const fullPath = req.params[0];
    const queryString = qs.stringify(req.query);

    /* Check if the current page has a file extension
     * (This will be useful if the course website serves non-HTML file types,
     * which we would not want to edit) */
    const fileExtensionMatch = fullPath.match(/\.[A-Za-z]+$/);
    const fileExtension = fileExtensionMatch ? fileExtensionMatch[0].substring(1) : null;
    const isHTML = fileExtension == null || fileExtension === 'html' || fileExtension === 'htm' || fileExtension === 'cgi';

    const pathWithoutFile = fullPath.match(/^\/([\w~-]+\/)*([\w~-]+$)?/)[0];
    const linkPath = pathWithoutFile.charAt(pathWithoutFile.length - 1) == '/' ?
        pathWithoutFile : `${pathWithoutFile}/`;

    // For non-HTML files, just pipe them to the response without changes
    if (!isHTML)
    {
        const externalReq = http.request({
            hostname: "web.cs.ucla.edu",
            path: `/${fullPath}`
        }, externalRes => externalRes.pipe(res));
        externalReq.end();
        return;
    }

    // HTML pages - Grab the webpage
    const originalPageUrl = queryString === '' ? `https://web.cs.ucla.edu${fullPath}` : `https://web.cs.ucla.edu${fullPath}?${queryString}`;
    fetch(originalPageUrl)
        .then(response => response.text())
        .then(html => {
            // Load the HTML
            const $ = load(html);

            // Add favicon and custom CSS
            $('head')
                .append('<link rel="icon" type="image/png" href="/sparkles.png">')
                .append('<link rel="stylesheet" href="/styles.css">');

            fixRelativeLinks($, linkPath, 'a',   'href');
            fixRelativeLinks($, linkPath, 'img', 'src');

            // Add scripts for copy button logic
            $('body')
                .append('<script src="https://code.jquery.com/jquery-3.6.1.min.js">')
                .append('<script src="/copy-code.js">');
            // For every code block, add a 'Copy' button
            $('pre').each((i, el) => {
                $(el)
                    .wrapInner(`<div class="code-block" id="blk-${i}"></div>`)
                    .prepend(`<div class="copy-btn-holder">\
                        <button class="copy-btn" id="btn-${i}">Copy</button>\
                    </div>`);
            });

            $('form').each((i, el) => {
                $(el).replaceWith(
                    `<h3>Go back to the <a href=${originalPageUrl} target='_blank'>original page</a> to submit this form.</h3>\
                    <p>Remember, never submit anything for class on a 3rd-party website like this.</p>`);
            });

            // Ship the edited HTML
            res.send($.html());
        });
});

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});

function fixRelativeLinks($, linkPath, elementName, attrName) {
    $(elementName).each((i, el) => {
        const attributeValue = $(el).attr(attrName);
        const isRelativeLink = attributeValue != null && attributeValue.match(/^\/|#|(mailto)|(https?)/) == null;
        if (isRelativeLink)
            $(el).prop(attrName, `${linkPath}${attributeValue}`);
    });
}

function getSeason(date) {
    const month = date.getMonth();
    if (month <= 4) {
        return 'winter';
    } else if (month <= 8) {
        return 'spring';
    } else {
        return 'fall';
    }
}

async function getClasses(term) {
    const classesTableUrl = `https://${hostname}/classes/${term}`;
    const response = await fetch(classesTableUrl);
    const html = await response.text();
    const $ = load(html);

    const classesThisTerm = [];
    $('td a').each((i, el) => {
        const csClassRegex = /^cs([0-9]+[A-Z]?)\/$/;
        const match = $(el).text().match(csClassRegex);
        if (match == null) {
            return;
        }
        const [subroute, classNumber] = match;
        classesThisTerm.push({ subroute: `/classes/${term}/${subroute}`, classNumber });
    });
    return classesThisTerm;
}
