const puppeteer = require('puppeteer');
const sessionFactory = require('./factories/sessionFactory');
const userFactory = require('./factories/userFactory');

describe('header', () => {
  let browser;
  let page;
  
  const login = async () => {
    const user = await userFactory.new();
    const { session, signature } = sessionFactory(user);

    await page.setCookie({ name: 'session', value: session });
    await page.setCookie({ name: 'session.sig', value: signature });
    await page.goto('localhost:3000/blogs');
    await page.waitFor('a[href="/auth/logout"]');

    return user;
  };

  beforeEach(async () => {
    browser = await puppeteer.launch({
      headless: false,
    });
    page = await browser.newPage();
    await page.goto('localhost:3000');
  });

  afterEach(async () => {
    await page.close();
    await browser.close();
  });

  test('Header has the correct text', async () => {
    const text = await page.$eval('a.brand-logo', el => el.innerHTML);

    expect(text).toEqual('Blogster');
  });

  test('Login', async () => {
    await page.click('.right a');
    const url = await page.url();

    expect(url).toMatch(/accounts\.google\.com/);
  });

  test('when signed in, shows logout button', async () => {
    const user = await login();

    const text = await page.$eval('a[href="/auth/logout"]', el => el.innerHTML);
    expect(text).toEqual('Logout');

    userFactory.delete(user._id);
  });
});
