// scrape.js
import { appendFileSync, writeFileSync } from "fs";

// 1. Add all the URLs you want to scrape into this array.
import { pagesToScrape } from "./scrape-list";
// Create log file with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const logFile = `scraper-log-${timestamp}.md`;

// Initialize log file
const logHeader = `# Scraper Log\n\nStarted: ${new Date().toLocaleString()}\n\n---\n\n`;
writeFileSync(logFile, logHeader);

console.log("🚀 Starting the scraping process...");
console.log(`📝 Logging to: ${logFile}\n`);

// 2. This loop will go through each URL one by one.
for (const url of pagesToScrape) {
  console.log(`\n➡️  Scraping: ${url}`);
  // let appendedUrl = baseUrl + url;

  // Log to file
  appendFileSync(logFile, `## Scraping: ${url}\n\n`);
  appendFileSync(logFile, `Started: ${new Date().toLocaleString()}\n\n`);
  appendFileSync(logFile, "```\n");

  const proc = Bun.spawn(["mintlify-scrape", "page", url], {
    // Capture output to both terminal and file
    stdout: "pipe",
    stderr: "pipe",
  });

  // Stream stdout to both console and file
  const stdoutReader = proc.stdout.getReader();
  const stderrReader = proc.stderr.getReader();

  // Read stdout
  (async () => {
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await stdoutReader.read();
      if (done) break;
      const text = decoder.decode(value);
      process.stdout.write(text);
      appendFileSync(logFile, text);
    }
  })();

  // Read stderr
  (async () => {
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await stderrReader.read();
      if (done) break;
      const text = decoder.decode(value);
      process.stderr.write(text);
      appendFileSync(logFile, text);
    }
  })();

  // 3. The 'await' keyword makes the script wait for the current
  //    command to finish before starting the next one.
  await proc.exited;
  const exitCode = proc.exitCode;

  appendFileSync(logFile, "```\n\n");
  appendFileSync(
    logFile,
    `Exit code: ${exitCode}\nFinished: ${new Date().toLocaleString()}\n\n`
  );

  console.log(`Exit code: ${exitCode}`);

  if (exitCode === 0) {
    console.log(`✅ Success: Finished scraping ${url}`);
    appendFileSync(logFile, `✅ **Success**\n\n---\n\n`);
  } else {
    console.error(
      `❌ Error: Failed to scrape ${url} with exit code ${exitCode}`
    );
    appendFileSync(
      logFile,
      `❌ **Error**: Failed with exit code ${exitCode}\n\n---\n\n`
    );
  }
}

console.log("\n✨ All pages processed!");
console.log(`📝 Log saved to: ${logFile}`);
appendFileSync(logFile, `\n---\n\n✨ All pages processed!\n`);
appendFileSync(logFile, `Finished: ${new Date().toLocaleString()}\n`);
