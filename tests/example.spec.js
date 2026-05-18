import {test, expect} from "@playwright/test";

test("opens masterportal locally", async ({page}) => {
    await page.goto("https://localhost:9001/portal/master");

    await expect(page).toHaveTitle(/Masterportal/i);
});
