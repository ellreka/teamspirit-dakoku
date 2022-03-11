const puppeteer = require("puppeteer");
const config = require("./config.json");
const process = require("process");

(async () => {
  const startBtnSelector = "#btnStInput";
  const endBtnSelector = "#btnEtInput";

  const type = process.argv[2];
  if (!["start", "end"].includes(type)) throw new Error("無効なコマンドです");

  const browser = await puppeteer.launch({
    headless: false,
    devtools: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    // 位置情報の取得を許可
    const context = browser.defaultBrowserContext();
    await context.overridePermissions(undefined, ["geolocation"]);

    const page = (await browser.pages())[0];
    page.setViewport({ width: 1920, height: 1080 });

    // login
    await page.goto("https://teamspirit.cloudforce.com/");
    await page.type('input[name="username"]', config.id);
    await page.type('input[name="pw"]', config.password);
    await page.click('input[name="Login"]');

    await page.waitForTimeout(10000);

    // iframeを取得
    const frame = await page
      .frames()
      .find((frame) => frame.name().includes("vfFrameId"));

    switch (type) {
      // 出勤ボタンを押す
      case "start":
        await frame
          .waitForSelector(`${startBtnSelector}:not(:disabled)`, {
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
        // 退勤ボタンを押す
        await frame
          .waitForSelector(`${endBtnSelector}:not(:disabled)`, {
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
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();
