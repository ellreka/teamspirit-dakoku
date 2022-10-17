import puppeteer from "puppeteer";
import config from "../config.json";
import process from "process";

(async () => {
  const startBtnSelector = "#btnStInput";
  const endBtnSelector = "#btnEtInput";

  const type = process.argv[2];
  if (!["start", "end", "input"].includes(type))
    throw new Error("無効なコマンドです");

  const browser = await puppeteer.launch({
    headless: false,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-notifications",
    ],
  });
  try {
    // 位置情報の取得を許可
    const context = browser.defaultBrowserContext();
    await context.overridePermissions(config.url, ["geolocation"]);

    const page = (await browser.pages())[0];
    page.setViewport({ width: 1920, height: 1080 });

    // login
    await page.goto(config.url);
    await page.type('input[name="username"]', config.id);
    await page.type('input[name="pw"]', config.password);
    await page.click('input[name="Login"]');

    await page.waitForTimeout(10000);

    // iframeを取得
    const frame = await page
      .frames()
      .find((frame) => frame.name().includes("vfFrameId"));
    if (frame == null) throw new Error("iframeが取得できませんでした");
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
      // case "input":
      //   await page.goto(
      //     `${config.url}/lightning/n/teamspirit__AtkWorkTimeTab`
      //   );
      //   await page.waitForTimeout(10000);
      //   // iframeを取得
      //   const iframe = await page
      //     .frames()
      //     .find((frame) => frame.name().includes("vfFrameId"));
      //   if (iframe == null) throw new Error("iframeが取得できませんでした");
      //   await iframe.click("#dailyWorkCell2022-07-01");
      //   await page.waitForTimeout(10000);
      //   const table = await iframe.$("#empWorkTableBody");
      //   console.log(table);
      //   const title = (
      //     await table?.$x(
      //       `//div[@class = "name" and text() = "`
      //     )
      //   )?.[0];
      //   console.log(title);
      //   if (title == null) return;
      //   const cell = (await title.getProperty("parentNode")).asElement();
      //   console.log(cell);
      //   if (cell == null) return;
      //   const input = await cell.$("input#empInputTime0");
      //   console.log(input);
      //   input?.type("7:10");
      //   await page.waitForTimeout(10000);
      //   break;
      default:
        console.error("error");
    }
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();
