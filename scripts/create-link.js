const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("node:fs");

const url = "https://developer.garmin.com/connect-iq/overview/";
const baseUrl = "https://developer.garmin.com";

const ignorePatterns = [
  /\.zip$/i,
  /\.dmg$/i,
  /\.jsp$/i,
  /github\.com/,
  /twitter\.com/,
  /www\.garmin\.com/,
  /apps\.garmin\.com/,
  /forums\.garmin\.com/,
  /creative\.garmin\.com/,
  /central\.sonatype\.com/,
];

const ignoreStrings = [
  "#",
  "https://developer.garmin.com/",
  "https://developer.garmin.com/connect-iq/api-docs/",
];

async function fetchHtml(url) {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching the URL (${url}):`, error.message);
    throw error;
  }
}

async function scrapeLinks(url, visitedLinks = new Set()) {
  try {
    console.log(`Fetching data from ${url}`);
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    const links = [];

    $("a[href]").each((index, element) => {
      let href = $(element).attr("href");
      const text = $(element).text().trim();

      if (href?.startsWith("/")) {
        href = baseUrl + href;
      }

      const isIgnored =
        ignorePatterns.some((pattern) => pattern.test(href)) ||
        ignoreStrings.includes(href);

      if (href && !isIgnored && !visitedLinks.has(href)) {
        visitedLinks.add(href);
        links.push({ href, text });
      }
    });

    return links;
  } catch (error) {
    console.error(`Error scraping links from ${url}:`, error.message);
    throw error;
  }
}

function saveToFile(filename, data) {
  try {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2), "utf-8");
    console.log(`Data saved to ${filename}`);
  } catch (error) {
    console.error("Error saving the file:", error.message);
    throw error;
  }
}

(async () => {
  try {
    const visitedLinks = new Set();
    const links = await scrapeLinks(url, visitedLinks);
    console.log(`Collected ${links.length} unique links from the main page.`);

    const nestedResults = [];

    for (const link of links) {
      console.log(`Processing nested scraping for: ${link.href}`);
      const nestedLinks = await scrapeLinks(link.href, visitedLinks);
      nestedResults.push({
        url: link.href,
        text: link.text,
        nestedLinks,
      });
    }

    saveToFile("files/links.json", nestedResults);
  } catch (error) {
    console.error("An error occurred:", error.message);
  }
})();
