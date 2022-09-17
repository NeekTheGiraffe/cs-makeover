import fetch from 'node-fetch';
import express from 'express';
import { load } from 'cheerio';

import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup express server
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Handle Go button from homepage
// Simply redirects the page to the path that the user entered in the form
app.get('/go', (req, res) => {
    //console.log(req.query.path);
    res.redirect(req.query.path);
});

// Handle CS website path
app.get('/:path([a-z\\.]+)*', (req, res) => {
    /* Get the full path. Looks something like:
    /* foo/bar/cs111
    /* foo/bar/cs111/index.html   */
    const fullPath = `${req.params.path}${req.params[0]}`;

    /* Check if the current page has a file extension
     * (This will be useful if the course website serves non-HTML file types,
     * which we would not want to edit) */
    const fileExtensionMatch = fullPath.match(/\.[A-Za-z]+$/);
    const fileExtension = fileExtensionMatch ? fileExtensionMatch[0].substring(1) : null;
    const isHTML = fileExtension == null || fileExtension == 'html';
    
    const pathWithoutFile = fullPath.match(/^([\w-]+\/)*([\w-]+$)?/)[0];
    const linkPath = pathWithoutFile.charAt(pathWithoutFile.length - 1) == '/' ?
        `/${pathWithoutFile}` : `/${pathWithoutFile}/`;
    //console.log({ linkPath, fileExtension, fullPath, isHTML });
    
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
    fetch(`http://web.cs.ucla.edu/${fullPath}`)
        .then(response => response.text())
        .then(html => {
            // Load the HTML
            const $ = load(html);

            // Add favicon and custom CSS
            $('head')
                .append('<link rel="icon" type="image/png" href="/sparkles.png">')
                .append('<link rel="stylesheet" href="/styles.css">');
            
            // For every link, if it is relative, edit it so it links properly
            $('a').each((i, el) => {
                const href = $(el).attr('href');
                const isRelativeLink = href != null && href.match(/^\/|#|(mailto)|(https?)/) == null;
                //console.log({ href: $(el).attr('href'), isRelativeLink });
                if (isRelativeLink)
                    $(el).prop('href', `${linkPath}${href}`);
            });

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

            // Ship the edited HTML
            res.send($.html());
        });
});

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});