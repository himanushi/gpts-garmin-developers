const puppeteer = require("puppeteer");
const fs = require("node:fs");

const inputFile = "files/links.json";
const outputFile = "files/document.txt";

async function fetchVisibleText(url) {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: "networkidle0" });
    try {
      await page.waitForSelector(".connect-IQ-articles", { timeout: 3000 });
    } catch (error) {
      console.log(`Timeout: ${url}`);
    }

    const visibleText = await page.evaluate(() => {
      const removeElements = (selector) => {
        for (const el of document.querySelectorAll(selector)) {
          el.remove();
        }
      };

      for (const el of document.querySelectorAll(
        'div > ul > li > a[href="/connect-iq/overview/"]',
      )) {
        const parentDiv = el.closest("div");
        if (parentDiv) {
          parentDiv.remove();
        }
      }

      const elementsToRemove = ["header", "footer", "script", "style"];
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
      const { text, url, nestedLinks } = entry;

      console.log(`Fetching visible text from: ${url}`);
      const mainContent = await fetchVisibleText(url);
      if (mainContent) {
        outputStream.write(`\n\n# [${text}](${url})n`);
        outputStream.write(`${mainContent}\n`);
      }

      for (const nested of nestedLinks) {
        console.log(`Fetching visible text from nested link: ${nested.href}`);
        const nestedContent = await fetchVisibleText(nested.href);
        if (nestedContent) {
          outputStream.write(`\n\n# [${nested.text}](${nested.href})n`);
          outputStream.write(`${nestedContent}\n`);
        }
      }
    }

    outputStream.end();
    console.log(`Content written to ${outputFile}`);
  } catch (error) {
    console.error("An error occurred:", error.message);
  }
}

generateTextFile();
