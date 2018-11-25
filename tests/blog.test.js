const puppeteer = require('puppeteer');
const sessionFactory = require('./factories/sessionFactory');
const userFactory = require('./factories/userFactory');

describe('blog', () => {
  let browser;
  let page;

  const login = async () => {
    const user = await userFactory.new();
    const { session, signature } = sessionFactory(user);

    await page.setCookie({ name: 'session', value: session });
    await page.setCookie({ name: 'session.sig', value: signature });
    await page.goto('http://localhost:3000/blogs');
    await page.waitFor('a[href="/auth/logout"]');

    return user;
  };

  beforeEach(async () => {
    browser = await puppeteer.launch({
      args: ['--no-sandbox'],
      headless: false,
    });
    page = await browser.newPage();
    await page.goto('http://localhost:3000');
  });

  afterEach(async () => {
    await page.close();
    await browser.close();
  });

  describe('new blog form', () => {
    let user;

    beforeEach(async () => {
      user = await login();
      await page.click('a[href="/blogs/new"]');
    });

    afterEach(() => {
      userFactory.delete(user._id);
    });

    test('new blog form renders correctly', async () => {
      const formExists = await page.$('form') !== null;
  
      expect(formExists).toBe(true);
    });

    describe('success', () => {
      beforeEach(async () => {
        await page.type('.title input', 'My Title');
        await page.type('.content input', 'My Content');
        await page.click('form button[type="submit"]');
      });

      test('submits and redirects to review screen', async () => {
        const confirmation = await page.$eval('form h5', el => el.textContent);
        expect(confirmation).toEqual('Please confirm your entries');
      });

      test('submits and loads new blog on blogs list', async () => {
        await page.click('form button.green');
        await page.waitFor('.card');

        const title = await page.$eval('.card-title', el => el.textContent);
        const content = await page.$eval('.card p', el => el.textContent);

        expect(title).toEqual('My Title');
        expect(content).toEqual('My Content');
      });
    });
  
    describe('failure', () => {
      test('shows error upon empty input', async () => {
        await page.click('form button[type="submit"]');

        const errorMsgs = await page.$$eval('.red-text', els =>
          els.map(el => el.textContent)
        );
        const expectedMsg = 'You must provide a value';

        expect(errorMsgs
          .every(msg => msg === expectedMsg)
        ).toBe(true);
      });
    });
  });

  describe('user is not logged in', async () => {
    const get = path =>
      page.evaluate((path) =>
        fetch(path, {
          method: 'GET',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
          },
        }).then(res => res.json()),
        path,
      );

    const post = (path, data) =>
      page.evaluate((path, data) =>
        fetch(path, {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }).then(res => res.json()),
        path,
        data,
      );

    test('user cannot view list of blog posts', async () => {
      const response = await get('/api/blogs');
      expect(response.error).toEqual('You must log in!');
    });

    test('user cannot create blog posts', async () => {
      const response = await post('/api/blogs', {
        title: 'My Title',
        content: 'My Content',
      });
      expect(response.error).toEqual('You must log in!');
    });
  });
});