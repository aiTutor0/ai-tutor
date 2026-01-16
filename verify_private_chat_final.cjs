const puppeteer = require('puppeteer');

async function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    });
}

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    // 1. Register/Login as HOST User (Teacher)
    const hostEmail = `host_${Date.now()}@test.com`;
    console.log('Testing with Host:', hostEmail);

    await page.goto('http://localhost:3000');

    // Register Host
    await page.click('#btn-hero-start');
    await delay(500);
    await page.type('#reg-name', 'Host User');
    await page.type('#reg-email', hostEmail);
    await page.type('#reg-password', '123456');
    await page.type('#reg-confirm', '123456');
    await page.click('#register-form button[type="submit"]');
    await delay(2000); // Wait for auth

    // Login Host (if redirect to login)
    if (await page.$('#login-form:not(.hidden)')) {
        await page.type('#login-email', hostEmail);
        await page.type('#login-password', '123456');
        await page.click('#login-form button[type="submit"]');
        await delay(2000);
    }

    // Go to Workspace
    await page.evaluate(() => window.showDashboard());
    await delay(1000);
    await page.evaluate(() => window.openTool('group'));
    await delay(1000);

    // Create Private Group
    const groupName = `Private Room ${Date.now()}`;
    console.log('Creating group:', groupName);

    page.on('dialog', async dialog => {
        console.log('Dialog content:', dialog.message());
        await dialog.accept(groupName);
    });

    await page.evaluate(() => window.addRoom());
    await delay(2000); // Wait for Supabase creation

    // 2. Register/Login as GUEST User (Student) in Incognito
    const context = await browser.createIncognitoBrowserContext();
    const page2 = await context.newPage();
    const guestEmail = `guest_${Date.now()}@test.com`;
    console.log('Testing with Guest:', guestEmail);

    await page2.goto('http://localhost:3000');
    await page2.click('#btn-hero-start');
    await delay(500);
    await page2.type('#reg-name', 'Guest User');
    await page2.type('#reg-email', guestEmail);
    await page2.type('#reg-password', '123456');
    await page2.type('#reg-confirm', '123456');
    await page2.click('#register-form button[type="submit"]');
    await delay(2000);

    if (await page2.$('#login-form:not(.hidden)')) {
        await page2.type('#login-email', guestEmail);
        await page2.type('#login-password', '123456');
        await page2.click('#login-form button[type="submit"]');
        await delay(2000);
    }

    await page2.evaluate(() => window.showDashboard());
    await delay(1000);
    await page2.evaluate(() => window.openTool('group'));
    await delay(2000);

    // CHECK 1: Guest should NOT see the group yet
    const content = await page2.content();
    if (content.includes(groupName)) {
        console.error('FAIL: Guest saw private group before invite!');
    } else {
        console.log('PASS: Guest cannot see private group.');
    }

    // 3. Host Invites Guest
    console.log('Host inviting guest...');
    await page.bringToFront();

    // We need to trigger the invite flow manually or via UI
    // UI approach: Find the group, click invite icon
    // Since we don't have easy selectors for dynamic list, we act via console
    // First, get the group ID
    const rooms = await page.evaluate(() => groupService.getMyGroups());
    const targetGroup = rooms.find(r => r.name === groupName);
    if (!targetGroup) throw new Error('Host could not find own group');

    console.log('Target Group ID:', targetGroup.id);

    // Emulate prompt for email
    page.off('dialog'); // Remove previous listener
    page.on('dialog', async dialog => {
        console.log('Invite Prompt:', dialog.message());
        await dialog.accept(guestEmail);
    });

    // Call invite logic
    await page.evaluate((id, name) => window.inviteToRoom(id, name), targetGroup.id, groupName);
    await delay(3000);

    // 4. Guest Refreshes/Checks
    console.log('Guest checking visibility...');
    await page2.bringToFront();
    await page2.reload();
    await delay(2000);
    await page2.evaluate(() => window.showDashboard());
    await page2.evaluate(() => window.openTool('group'));
    await delay(2000);

    const content2 = await page2.content();
    if (content2.includes(groupName)) {
        console.log('PASS: Guest sees group after invite.');
    } else {
        console.error('FAIL: Guest DOES NOT see group after invite.', content2.substring(0, 500));
    }

    await browser.close();
})();
