

# CVE-API-Unit-Tests
In order to Run Tests, make sure you configure a DB connection in the config/config.json under the `test` environment.

## Dependencies

This project uses or depends on software from

- NodeJS https://nodejs.org/
- Express https://github.com/expressjs
- MYSQL
- Sequelize http://docs.sequelizejs.com/
- Mocha https://mochajs.org/
- Chai https://www.chaijs.com/


In order to run unit tests, use the following command:

```sh
npm run start:test
```

## Notes

Please note, test will run on every attempted `git push` command. Pushing into a repo will only be successful if and only if tests successfully pass.

