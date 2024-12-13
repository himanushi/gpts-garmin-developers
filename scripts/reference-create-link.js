const fs = require("node:fs");
const cheerio = require("cheerio");

const inputFile = "files/input.html"; // 保存したHTMLファイルの名前
const outputFile = "files/reference-links.json"; // 出力するJSONファイルの名前
const baseUrl = "https://developer.garmin.com/connect-iq/api-docs/"; // 必要に応じて変更

const html = fs.readFileSync(inputFile, "utf-8");
const $ = cheerio.load(html);

function extractLinks(element, parentPath = []) {
  const links = [];

  $(element).each((_, el) => {
    const href = $(el).attr("href");
    const text = $(el).attr("title") ?? $(el).text().trim();

    links.push({
      href: href
        ? href.startsWith("./")
          ? baseUrl + href.slice(2)
          : href
        : null,
      text,
    });
  });

  return links;
}

const rootLinks = extractLinks($("#object_Toybox a[href]"));
fs.writeFileSync(outputFile, JSON.stringify(rootLinks, null, 2), "utf-8");
console.log(`Links saved to ${outputFile}`);

/*

fs = require("node:fs");
cheerio = require("cheerio");
inputFile = "files/input.html";
outputFile = "files/reference-links.json";
baseUrl = "https://developer.garmin.com/connect-iq/api-docs/";
html = fs.readFileSync(inputFile, "utf-8");
$ = cheerio.load(html);

*/
