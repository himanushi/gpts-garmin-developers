const puppeteer = require("puppeteer");
const fs = require("node:fs");

const inputFile = "files/reference-links.json";
const outputFile = "files/reference-content.txt";

async function fetchVisibleText(url) {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: "networkidle0" });

    const visibleText = await page.evaluate(() => {
      const removeElements = (selector) => {
        for (const el of document.querySelectorAll(selector)) {
          el.remove();
        }
      };

      const elementsToRemove = [
        "header",
        "footer",
        "script",
        "style",
        "iframe",
      ];
      for (const selector of elementsToRemove) {
        removeElements(selector);
      }

      return document.body.innerHTML
        .replace(/\n/g, " ")
        .replace(/<\/(h[1-6]|ul|li|tr)>/g, "\n")
        .replace(/<\/?[^>]+>/g, " ")
        .replace(/[ \t]+/g, " ")
        .trim();
    });

    await browser.close();
    return visibleText;
  } catch (error) {
    console.error(`Error fetching the URL (${url}):`, error.message);
    return "";
  }
}

async function generateTextFile() {
  try {
    if (!fs.existsSync(inputFile)) {
      console.error(`Input file ${inputFile} does not exist.`);
      return;
    }

    const data = JSON.parse(fs.readFileSync(inputFile, "utf-8"));
    const outputStream = fs.createWriteStream(outputFile, { flags: "w" });

    for (const entry of data) {
      const { text, href } = entry;

      console.log(`Fetching visible text from: ${href}`);
      const mainContent = await fetchVisibleText(href);
      if (mainContent) {
        outputStream.write(`\n\n# [${text}](${href})n`);
        outputStream.write(`${mainContent}\n`);
      }
    }

    outputStream.end();
    console.log(`Content written to ${outputFile}`);
  } catch (error) {
    console.error("An error occurred:", error.message);
  }
}

generateTextFile();
