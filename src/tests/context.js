const { randomBytes } = require('crypto');
const { default: migrate } = require('node-pg-migrate');
const format = require('pg-format');
const pool = require('../pool');

const DEFAULT_OPS = {
  host: 'localhost',
  port: 5432,
  database: 'socialnetwork-test',
  user: 'babatundeololade',
  password: '',
};

class Context {
  static async build() {
    const roleName = 'a' + randomBytes(4).toString('hex');
    // Connect to PG as usual
    await pool.connect(DEFAULT_OPS);

    // Create a new role
    await pool.query(
      format('CREATE ROLE %I WITH LOGIN PASSWORD %L;', roleName, roleName)
    );

    // Create a schema with the same name
    await pool.query(
      format('CREATE SCHEMA %I AUTHORIZATION %I', roleName, roleName)
    );

    // Disconnect entriely from PG
    await pool.close();

    // run our migrations in the new schema
    await migrate({
      schema: roleName,
      direction: 'up',
      log: () => {},
      noLock: true,
      dir: 'migrations',
      databaseUrl: {
        host: 'localhost',
        port: 5432,
        database: 'socialnetwork-test',
        user: roleName,
        password: roleName,
      },
    });

    // Connect to PG as the new role
    await pool.connect({
      host: 'localhost',
      port: 5432,
      database: 'socialnetwork-test',
      user: roleName,
      password: roleName,
    });

    return new Context(roleName);
  }

  constructor(roleName) {
    this.roleName = roleName;
  }

  async close() {
    // Disconnect form PG
    await pool.close();

    // Reconnect as our root user
    await pool.connect(DEFAULT_OPS);

    // Delete the role and schema we created
    await pool.query(format('DROP SCHEMA %I CASCADE;', this.roleName));
    await pool.query(format('DROP ROLE %I;', this.roleName));

    // Disconnect
    await pool.close();
  }

  async reset() {
    return pool.query(`DELETE FROM users;`);
  }
}

module.exports = Context;
