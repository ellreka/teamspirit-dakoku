const puppeteer = require("puppeteer");
const config = require("./config.json");
const process = require("process");

(async () => {
  const startBtnSelector = "#btnStInput";
  const endBtnSelector = "#btnEtInput";

  const type = process.argv[2];
  if (!["start", "end"].includes(type)) throw new Error("無効なコマンドです");

  const browser = await puppeteer.launch({
    headless: true,
    devtools: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = browser.defaultBrowserContext();
  await context.overridePermissions(undefined, ["geolocation"]);

  const page = (await browser.pages())[0];

  await page.goto("https://teamspirit.cloudforce.com/");

  // login
  await page.type('input[name="username"]', config.id);
  await page.type('input[name="pw"]', config.password);
  await page.click('input[name="Login"]');

  await page.waitForTimeout(10000);

  const frame = await page
    .frames()
    .find((frame) => frame.name().includes("vfFrameId"));

  switch (type) {
    case "start":
      await frame
        .waitForSelector(startBtnSelector, {
          timeout: 10000,
          visible: true,
        })
        .catch((err) => {
          console.error("出勤出来ませんでした");
          throw err;
        });
      await frame.click(startBtnSelector);
      await frame.waitForSelector(`${startBtnSelector}[disabled]`);
      break;
    case "end":
      await frame
        .waitForSelector(endBtnSelector, {
          timeout: 10000,
          visible: true,
        })
        .catch((err) => {
          console.error("退勤出来ませんでした");
          throw err;
        });
      await frame.click(endBtnSelector);
      await frame.waitForSelector(`${endBtnSelector}[disabled]`);
      break;
    default:
      console.error("error");
  }

  await page.waitForTimeout(3000);

  await browser.close();
})();
