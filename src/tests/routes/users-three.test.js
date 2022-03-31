const request = require('supertest');
const buildApp = require('../../app');
const UserRepo = require('../../repos/user-repos');
const Context = require('../context');

beforeAll(async () => {
  // randomly generating a role name to connect ot PG as
  context = await Context.build();
});

afterAll(() => {
  return context.close();
});

beforeEach(async () => {
  await context.reset();
});

it('create a user', async () => {
  const startingCount = await UserRepo.count();
  //   expect(startingCount).toEqual(0);

  await request(buildApp())
    .post('/users')
    .send({ username: 'testuser', bio: 'test bio' })
    .expect(200);

  const finishCount = await UserRepo.count();
  expect(finishCount - startingCount).toEqual(1);
});
