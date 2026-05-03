"use strict";

const fs = require("fs");
const { chromium } = require("playwright");
const { createStaticServer } = require("../scripts/serve");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function chromeExecutablePath() {
  const candidates = [
    process.env.CHROME_EXECUTABLE_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(candidate));
}

async function listen(server) {
  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();
  assert(address && typeof address === "object", "Unable to bind smoke-test server.");
  return `http://127.0.0.1:${address.port}`;
}

async function run() {
  const server = createStaticServer();
  const baseUrl = await listen(server);
  const executablePath = chromeExecutablePath();
  const browser = await chromium.launch({
    headless: true,
    executablePath,
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto(baseUrl);
    await page.waitForSelector("#miniMap");
    await page.waitForTimeout(700);
    assert(errors.length === 0, `Console/page errors: ${errors.join(" | ")}`);
    assert(await page.locator("#chipValue").count(), "Brain chip HUD value is missing.");

    await page.mouse.click(550, 345);
    await page.waitForTimeout(150);
    const baseCommands = await page.locator("#actionGrid").textContent();
    assert(/Export Goods/.test(baseCommands || ""), "Main base is missing Export Goods command.");

    await page.mouse.click(725, 340);
    await page.waitForTimeout(150);
    const unitCommands = await page.locator("#actionGrid").textContent();
    assert(/Install Brain/.test(unitCommands || ""), "Cartbot is missing Install Brain command.");

    const mini = await page.locator("#miniMap").boundingBox();
    const bottom = await page.locator("#bottomHud").boundingBox();
    assert(mini && bottom, "Expected minimap and bottom HUD boxes.");

    const miniData = () => page.$eval("#miniMap", (canvas) => canvas.toDataURL());

    await page.mouse.move(520, bottom.y - 25);
    await page.waitForTimeout(300);
    await page.mouse.move(mini.x + mini.width / 2, mini.y + mini.height / 2);
    await page.waitForTimeout(120);
    const afterMiniEnter = await miniData();
    await page.waitForTimeout(850);
    const afterMiniHold = await miniData();
    assert(afterMiniEnter === afterMiniHold, "Camera changed while hovering minimap/bottom HUD.");

    await page.mouse.wheel(0, -700);
    await page.waitForTimeout(250);
    const afterMiniWheel = await miniData();
    assert(afterMiniWheel === afterMiniHold, "Wheel over minimap changed the battlefield camera.");

    await page.mouse.move(430, 320);
    await page.waitForTimeout(80);
    const beforeZoom = await miniData();
    await page.mouse.wheel(0, -700);
    await page.waitForTimeout(250);
    const afterZoom = await miniData();
    assert(beforeZoom !== afterZoom, "Wheel over battlefield did not change the viewport.");

    await page.keyboard.press("a");
    await page.mouse.click(560, 360);
    await page.waitForTimeout(150);
    const alertText = await page.locator("#alertFeed").textContent();
    assert(/Attack-move assigned|Attack target assigned/.test(alertText || ""), "Combat world alert was not raised.");

    await page.keyboard.press("Space");
    await page.waitForTimeout(150);

    console.log("Smoke test passed.");
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
