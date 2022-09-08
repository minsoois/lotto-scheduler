import * as puppeteer from "puppeteer";
import * as dotenv from "dotenv";
dotenv.config();

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: false, devtools: true });

    // 팝업이 열렸을때 팝업을 모두 종료
    browser.on("targetcreated", async (target) => {
      if (target.type() === "page") {
        const newPage = await target.page();
        const url = newPage.url();
        if (url.includes("popup")) {
          await newPage.close();
        }
      }
    });

    const mainPage = await browser.newPage();

    await mainPage.goto(
      "https://dhlottery.co.kr/user.do?method=login&returnUrl=",
      {
        waitUntil: "domcontentloaded",
      }
    );

    // 로또 로그인
    await mainPage.type("#userId", process.env.ACCOUNT_ID);
    await mainPage.type("input[type=password]", process.env.ACCOUNT_PASSWORD);
    await mainPage.click(".btn_common.lrg.blu");
    await mainPage.waitForNavigation();

    // 로또 구매 페이지를 켬
    const buyPage = await browser.newPage();
    await buyPage.goto("https://ol.dhlottery.co.kr/olotto/game/game645.do", {
      waitUntil: "domcontentloaded",
    });
    await buyPage.bringToFront();

    await buyPage.click("#num2");

    await buyPage.waitForSelector("#amoundApply");

    // 구매 개수 변경
    await buyPage.select("#amoundApply", process.env.PURCHASE_QUANTITY);
    await buyPage.click("#btnSelectNum");

    // 구매버튼 클릭
    await buyPage.click("#btnBuy");

    // 구매확인 버튼 클릭
    await buyPage.click(
      "#popupLayerConfirm > div > div.btns > input:nth-child(1)"
    );

    // 구매 결과 영수증 이미지로 저장
    const resultPopup = await buyPage.$("#popReceipt");
    resultPopup.screenshot({
      path: `${new Date().getTime()}.jpg`,
      type: "jpeg",
    });

    await browser.close();
  } catch (error) {
    console.error(error);
    return;
  }
})();
