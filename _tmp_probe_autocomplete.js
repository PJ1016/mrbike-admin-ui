const { chromium } = require("playwright");

// Unsigned but syntactically valid JWT (ProtectedRoute uses jwt-decode
// client-side without verifying signature, so this is enough to pass the
// route guard for local UI testing — no real backend auth happens).
function fakeJwt(payload) {
  const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  return `${b64url({ alg: "HS256", typ: "JWT" })}.${b64url(payload)}.fakesig`;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const consoleMsgs = [];
  page.on("console", (msg) => consoleMsgs.push(`[console:${msg.type()}] ${msg.text()}`));
  page.on("pageerror", (err) => consoleMsgs.push(`[pageerror] ${err.message}`));

  const gmapsRequests = [];
  page.on("request", (req) => {
    if (req.url().includes("maps.googleapis.com") || req.url().includes("mrbikedoctor")) {
      gmapsRequests.push(`REQ  ${req.method()} ${req.url()}`);
    }
  });
  page.on("response", async (res) => {
    if (res.url().includes("maps.googleapis.com")) {
      let bodySnippet = "";
      try {
        const text = await res.text();
        bodySnippet = text.slice(0, 300);
      } catch (e) {}
      gmapsRequests.push(`RES  ${res.status()} ${res.url()}  BODY: ${bodySnippet}`);
    }
  });

  // Mock every admin-API call so the real backend's 401 (fake token) never
  // triggers the "Session Expired" Swal — we only care about the Autocomplete
  // widget behavior, which is independent of data-fetch success.
  await page.route("**/api/v1/admin/serviceable-areas**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: 200, message: "Success", data: [], meta: { total: 0 } }) })
  );
  await page.route("**/bikedoctor/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: 200, message: "Success", data: [] }) })
  );

  await page.goto("http://localhost:3055/login", { waitUntil: "domcontentloaded" });

  await page.evaluate((token) => {
    localStorage.setItem("adminToken", token);
    localStorage.setItem("userData", JSON.stringify({ _id: "000000000000000000000000", name: "Test Admin", role: "admin" }));
  }, fakeJwt({ user_id: "000000000000000000000000", user_type: 1, exp: Math.floor(Date.now() / 1000) + 3600 }));

  // Realistic path: visit another Google-Maps-using page first via REAL
  // client-side SPA navigation (not page.goto, which does a full reload and
  // would reset window.google every time, hiding the exact bug item 4 is
  // about) — mirrors an admin using Location Categories/Banners earlier in
  // the same session before opening Serviceable Areas.
  await page.goto("http://localhost:3055/location-featured-categories", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.getByRole("link", { name: /location categories/i }).click().catch(() => {});
  await page.waitForTimeout(300);
  // Open its Add form (client-side route change) so its own loadGoogleMapsScript runs.
  await page.locator('a[href="/location-featured-categories/add"], button:has-text("Add")').first().click().catch(() => {});
  await page.waitForTimeout(1500);
  console.log("=== after opening Location Categories add form (client-side nav), google state ===", await page.evaluate(() => ({
    hasPlaces: !!window.google?.maps?.places,
    scriptCount: document.querySelectorAll('script[src*="maps.googleapis.com"]').length,
  })));

  await page.screenshot({ path: "/private/tmp/claude-501/-Users-gicdev3-Desktop-mrbike/6c95a994-4ef8-44fc-937f-ee413c828c64/scratchpad/before_nav_to_sa.png", fullPage: true });
  const sidebarLinkCount = await page.locator('a[href="/serviceable-areas"]').count();
  console.log("=== a[href=/serviceable-areas] count ===", sidebarLinkCount);
  await page.locator('a[href="/serviceable-areas"]').first().click();
  await page.waitForTimeout(1000);
  console.log("=== after client-side nav to /serviceable-areas, google state ===", await page.evaluate(() => ({
    hasPlaces: !!window.google?.maps?.places,
    scriptCount: document.querySelectorAll('script[src*="maps.googleapis.com"]').length,
    url: location.pathname,
  })));

  console.log("=== URL after nav ===", page.url());
  console.log("=== body text snippet ===", (await page.locator("body").innerText()).slice(0, 800));
  console.log("=== early console/errors ===");
  console.log(consoleMsgs.join("\n"));
  await page.screenshot({ path: "/private/tmp/claude-501/-Users-gicdev3-Desktop-mrbike/6c95a994-4ef8-44fc-937f-ee413c828c64/scratchpad/early_state.png", fullPage: true });

  await page.getByRole("button", { name: /new area/i }).click();
  await page.waitForTimeout(300);

  // Switch Area Type to Radius
  await page.locator('label:has-text("Area Type")').locator("..").locator("div[role=combobox]").click();
  await page.waitForTimeout(200);
  await page.getByRole("option", { name: /radius/i }).click();
  await page.waitForTimeout(500);

  console.log("=== window.google state before typing ===");
  const googleState = await page.evaluate(() => ({
    hasGoogle: !!window.google,
    hasMaps: !!window.google?.maps,
    hasPlaces: !!window.google?.maps?.places,
    scriptTags: Array.from(document.querySelectorAll('script[src*="maps.googleapis.com"]')).map(s => s.src),
  }));
  console.log(JSON.stringify(googleState, null, 2));

  const searchInput = page.getByLabel("Search Location");
  await searchInput.click();
  await searchInput.type("infosys", { delay: 150 });
  await page.waitForTimeout(2000);

  console.log("=== pac-container presence after typing ===");
  const pacState = await page.evaluate(() => {
    const containers = Array.from(document.querySelectorAll(".pac-container"));
    return containers.map(c => ({
      innerHTML: c.innerHTML.slice(0, 500),
      visible: c.offsetParent !== null,
      childCount: c.children.length,
      computedDisplay: getComputedStyle(c).display,
      computedZ: getComputedStyle(c).zIndex,
    }));
  });
  console.log(JSON.stringify(pacState, null, 2));

  const helperText = await page.locator('text=/Search and select a location|Please search and select/').first().textContent().catch(() => "(not found)");
  console.log("=== helper text now ===", helperText);

  console.log("\n=== clicking first .pac-item suggestion ===");
  await page.locator(".pac-item").first().click({ force: true });
  await page.waitForTimeout(500);

  const formStateAfterClick = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input')).map(i => ({ name: i.name, label: i.closest('.MuiFormControl-root')?.querySelector('label')?.textContent, value: i.value }));
    return inputs;
  });
  console.log("=== all form inputs after clicking suggestion ===");
  console.log(JSON.stringify(formStateAfterClick, null, 2));

  const searchValueAfterClick = await searchInput.inputValue().catch(() => "(err)");
  console.log("=== Search Location input value after click ===", searchValueAfterClick);

  const helperTextAfterClick = await page.locator('label:has-text("Search Location")').locator("..").locator("..").locator("p").first().textContent().catch(() => "(not found)");
  console.log("=== helper text after click ===", helperTextAfterClick);

  const mapPreviewPresent = await page.locator('text=/Selected location|Infosys/').count();
  console.log("=== MapPreview-ish text count (only renders if hasLocation===true) ===", mapPreviewPresent);

  await page.getByLabel("Radius (KM)").fill("2");

  let capturedCreateBody = null;
  page.on("request", (req) => {
    if (req.url().includes("/api/v1/admin/serviceable-areas") && req.method() === "POST") {
      capturedCreateBody = req.postData();
    }
  });

  await page.getByLabel("Area Name").fill("Infosys Pocharam Building 12");
  await page.getByRole("button", { name: /^create$/i }).click();
  await page.waitForTimeout(1000);

  console.log("=== validation error text visible after clicking Create? ===");
  const errAfterSubmit = await page.locator('text="Please search and select a location"').count();
  console.log("count of 'Please search and select a location' text:", errAfterSubmit);

  console.log("=== captured POST body sent to create endpoint ===");
  console.log(capturedCreateBody);

  console.log("\n=== CONSOLE / PAGE ERRORS ===");
  console.log(consoleMsgs.join("\n"));

  console.log("\n=== GOOGLE MAPS NETWORK ACTIVITY ===");
  console.log(gmapsRequests.join("\n"));

  await page.screenshot({ path: "/private/tmp/claude-501/-Users-gicdev3-Desktop-mrbike/6c95a994-4ef8-44fc-937f-ee413c828c64/scratchpad/autocomplete_probe.png", fullPage: true });

  await browser.close();
})().catch(e => { console.error("SCRIPT CRASHED:", e); process.exit(1); });
