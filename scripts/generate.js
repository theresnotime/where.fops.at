#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const eventsJsonPath = path.join(__dirname, '../public/events.json');
const indexHtmlPath = path.join(__dirname, '../public/index.html');

// Read events.json
const eventsData = JSON.parse(fs.readFileSync(eventsJsonPath, 'utf-8'));

// Function to parse date for sorting
function parseEventDate(dateStr) {
    if (dateStr.includes('TBC')) {
        return new Date(parseInt(dateStr.match(/\d{4}/)[0]), 11, 31); // TBC dates go to end of year
    }
    const monthMap = {
        January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
        July: 6, August: 7, September: 8, October: 9, November: 10, December: 11
    };
    const monthMatch = dateStr.match(/(January|February|March|April|May|June|July|August|September|October|November|December)/);
    const yearMatch = dateStr.match(/\d{4}/);
    const dayMatch = dateStr.match(/(\d+)(st|nd|rd|th)/);
    
    if (monthMatch && yearMatch && dayMatch) {
        const year = parseInt(yearMatch[0]);
        const month = monthMap[monthMatch[1]];
        const day = parseInt(dayMatch[1]);
        return new Date(year, month, day);
    }
    return new Date(0);
}

// Function to format an event as HTML with custom indentation
function formatEvent(event, indent = '            ') {
    return `${indent}<li id="${event.id}">
${indent}    <span class="date">${event.date}</span>
${indent}    <ul>
${indent}        <li>
${indent}            <a href="${event.url}">${event.name}</a> (<span class="location">${event.location}</span>)
${indent}        </li>
${indent}    </ul>
${indent}</li>`;
}

// Separate archived from active yes events
const activeYes = eventsData.events.yes.filter(e => !e.archived);
const archivedYes = eventsData.events.yes.filter(e => e.archived);

// Sort events by date (descending - newest first)
const sortedYes = [...activeYes].sort((a, b) => parseEventDate(b.date) - parseEventDate(a.date));
const sortedNo = [...eventsData.events.no].sort((a, b) => parseEventDate(b.date) - parseEventDate(a.date));
const sortedArchivedYes = [...archivedYes].sort((a, b) => parseEventDate(b.date) - parseEventDate(a.date));

// Generate HTML for yes, no, and archived sections
const yesEvents = sortedYes.map(e => formatEvent(e, '            ')).join('\n');
const noEvents = sortedNo.map(e => formatEvent(e, '            ')).join('\n');
const archivedYesEvents = sortedArchivedYes.map(e => formatEvent(e, '                ')).join('\n');

// Read index.html
let htmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');

// Backup original index.html
fs.writeFileSync(path.join(__dirname, 'index.html.bak'), htmlContent, 'utf-8');

// Yes
htmlContent = htmlContent.replace(
    /(<h2 id="yes">Yes<\/h2>\n)\s*<ul>[\s\S]*?<\/ul>(\n\n\s*<h2 id="no">)/,
    `$1        <ul>\n${yesEvents}\n        </ul>$2`
);

// No
htmlContent = htmlContent.replace(
    /(<h2 id="no">No<\/h2>\n)\s*<ul>[\s\S]*?<\/ul>(\n\n\s*<hr \/>)/,
    `$1        <ul>\n${noEvents}\n        </ul>$2`
);

// Yes (old)
htmlContent = htmlContent.replace(
    /(<details id="yes-old">\n\s*<summary><em>Some older events I attended<\/em><\/summary>\n)\s*<ul>[\s\S]*?<\/ul>(\n\s*<\/details>)/,
    `$1            <ul>\n${archivedYesEvents}\n            </ul>$2`
);

// Write back to index.html
fs.writeFileSync(indexHtmlPath, htmlContent, 'utf-8');

console.log('Events generated and index.html updated');
