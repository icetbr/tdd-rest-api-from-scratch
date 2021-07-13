# Requirements, TDD, coding... where should I start my program?

## What to do next?
I can decide that for now, saving to the database is enough and proceed to the rest of the CRUD actions, but I want to explore employee creation further.

I'm going to show some more usual and some unusual requirements to discuss some testing techniques along the way. All of my requirements will follow this same pattern, so I'll ommit it for simplicicty

1) **when** I `POST` some data to the endpoint `/employees`, **then** I want **X**
2) I'll make it happen by making a request to my application
3) The feature will be successful if after the request, the **X** happened


## ... to return the saved data
Since the expected behaviour is the result of the same action, I'll include it in the same test (!).

```js
employeeApiTest.js

    const response = await server.inject({ method: 'post', url: '/employees', payload: employee });

    // and the saved employee is returned
    expect(response.result).to.deep.equal({ ...employee, _id: response.result._id } );
```
Run and see it fail
```sh
       {
      -  "connection": {}
      -  "insertedCount": 1
      -  "insertedId": {
      -    "id": "`HÄ/²´ÿj?W"
      -  }
      -  "ops": [
      -    {
      -      "_id": {
      -        "id": "`HÄ/²´ÿj?W"
      -      }
      -      "jobTitle": "Programmer"
      -      "name": "John"
      -    }
      -  ]
      -  "result": {
      -    "n": 1
      -    "ok": 1
      -  }
      +  "_id": [undefined]
      +  "jobTitle": "Programmer"
      +  "name": "John"
       }
```
Looking at this error message I can see that I'm returning more than I wanted, and that the saved employee is inside the `ops` property.

```js
server.route({
  method: 'POST',
  path: '/employees',
  handler: async request => {
    await db.initialize();
    const result = await db.collection('employees').insertOne(request.payload);
    return result.ops[0];
  },
});
```
The test now passes, but now it seems to be testing for two things, that the **employee is saved** and that **it is returned**. There is some [disagreement][1] on this topic, but the way I see it is that I should test for only one action, the input **/POST /employees with employee data**. Testing with no data or with invalid data are different tests. Testing with a `?sendEmail=true` param is another test.

This is an **integration test**, and its is normal for them to have multiple side effects that must be tested for each action. Consider that if the employee is not saved to the database, I don't care about it being returned. In other words, these are dependent conditions.

But here is an improvement to be made. I need to make these expectations clear. The best way to do this depends on the test framework.

In any framework, I can update the test description.
```js
test('POST /employees saves the employee data to the database and returns the saved employee', async () => {
```
This might be enough, but it can get better. When one of the expectations fails, how can I tell which one was? Now, in this simple test, I, the creator of the test know. The errors are very specific to each `expect`. But future me, or another developer, or in a more complex case, it may not be that simple.

This is one of the reasons people advocate the "test only one thing". Error detection. If I have multiple tests
```js
test('POST /employees saves the employee data to the database', async () => {})

test('POST /employees returns the saved employee', async () => {})
```

I would get errors like these
```sh
POST /employees saves the employee data to the database:
-[]
+[
+  {
...
```
```sh
POST /employees returns the saved employee:
  {
-  "connection": {}
-  "insertedCount": 1
...
```

To use this style and still make only one invocation, you can use `tape`, as you can have a test like
```js
t.test('POST /employees', async (t) => {
  post('/employees', employee);
  const savedEmployees = findSavedEmployees();

  t.test('saves the employee data to the database', () => {
    expect(savedEmployees).to.equal([employee]);
  })
  t.test('returns the saved employee', () => {
    expect(response.result).to.deep.equal(employee);
  })
})
```
This style is of grouping doesn't work in `mocha`. But you can use like this
```js
test('POST /employees', async (t) => {
  post('/employees', employee);
  const savedEmployees = findSavedEmployees();

  expect(savedEmployees, 'saves the employee data to the database').to.equal([employee]);
  expect(response.result, 'returns the saved employee').to.deep.equal(employee);
})
```
This would result in errors similar to the above.

Jest bring yet another possibility
```js
test('POST /employees', async (t) => {
  post('/employees', employee);
  const savedEmployees = findSavedEmployees();

  // saves the employee data to the database
  expect(savedEmployees).to.equal([employee]);

  // returns the saved employee
  expect(response.result).to.deep.equal(employee);
})
```


## ... to save a copy for history
I'll continue to use the comments format in this series. Here is just another feature.
```js
  test('POST /employees saves the employee data to the database, saves a copy for history and returns the saved employee', async () => {
    ...
    // and a copy is saved for history
    const savedEmployeesHistory = await db.collection('employees_history').find({}, { projection: { _id: 0 } }).toArray();
    expect(savedEmployeesHistory).to.deep.equal([employee]);
```
```js
server.js

await db.collection('employees_history').insertOne(request.payload);
```

## ... to add some metadata
Note that this description is a little vague. Which metadata?

```js
test('POST /employees saves the employee data to the database, adds metadata, saves a copy for history and returns the saved employee', async () => {
    // given our current time
    const now = new Date('2018-02-21T12:30:20.903Z');
    const clock = sinon.useFakeTimers({ now, toFake: ['Date']});
    ...
    // then it adds metadata
    const metadata = {
        updatedAt: now,
        updatedBy: 'mary@hr.com',
        isDeleted: false,
        uniqueKey: response.result._id.toString(),
    };
    const expectedEmployee = { ...employee, ...metadata };
    ...
    // cleanup
    clock.restore();
```
```js
server.js

    const _id = new ObjectId();
    const employee = {
      ...request.payload,
      _id,
      uniqueKey: _id.toString(), // serves as a foreign key with the history collection
      updatedBy: 'mary@hr.com',  // hardcoded here, but you would pass this in the request Authorization header
      updatedAt: new Date(),
      isDeleted: false,
    };

    const result = await db.collection('employees').insertOne(employee);
    await db.collection('employees_history').insertOne(employee);
```

Quite a few things going on here. I would like to continue to use just **deep equality**, but it comes at a cost. If I have an error in my metadata, this is what I would get
```sh
returns the saved employee

     "isDeleted": false
     "jobTitle": "Programmer"
     "name": "John"
     "updatedAt": [Date: 2018-02-21T12:30:20.903Z]
-    "updatedBy": "mary@hr.com"
+    "updatedBy": "mary@hr.om"
    }
  ]
```
It may seem obvious that the metadata is wrong here. But as I said before, its a little less clear.

```js
expect(savedEmployees[0]).to.deep.match(metadata);
```

I'm introducing a new matcher from `chai-deep-match` in order to keep up with the idea of deep equality. I could have choosen a more simple approach like
```js
expect(savedEmployees[0].updatedBy).to.exist();
```
This could be enough to check that "metadata was added", and in another test, I would check if all the fields are there.

Running the test gives me another error
```sh
the employee data is saved to the database
  [
    {
-    "isDeleted": false
      "jobTitle": "Programmer"
      "name": "John"
-    "updatedAt": [Date: 2018-02-21T12:30:20.903Z]
-    "updatedBy": "mary@hr.com"
    }
  ]
```

Because of the assertion I chose, this test now breaks. Does that means this test is more **brittle**? Since its the same test, not so much. I decided the expectations are dependent on each other, and that's why I puit them in the same test in the first place.

If it were a different test, then it would mean it is a little more **brittle**, since the changes introduced for one test should not interfer with another.

In both cases, I could made the test less **brittle** by changing the expectation for a less strict one

```js
// and the employee data is saved to the database
expect(savedEmployees[0]).to.deep.match([employee]);
```

The tradeoff here is that if I added another field by mistake, I wouldn't catch the problem. The thing to remember is that the **deep equal** assertion is checking not only that an object was saved, bu also that all the fields were saved, and only those fields.

I'll keep the original assertion, and fix it by using this:
```js
// and the employee data is saved to the database
const expectedEmployee = { ...employee, ...metadata };
expect(savedEmployees).to.deep.equal([expectedEmployee]);
```
Every `expects` now will use the `expectedEmployee` for comparison (see the code on the repository).

There is still a problem. Now if my save fails, it will look like the metadata was the problem.
```js
// then it saves the employee to the database
const savedEmployees = await db.collection('employees').find({}, { projection: { _id: 0 } }).toArray();
expect(savedEmployees).to.have.length(1);
```

Now if save fails, this is where the error will point out. This begs for a change in this description
```js
// and no extra fields are added
const expectedEmployee = { ...employee, ...metadata };
expect(savedEmployees[0]).to.deep.equal(expectedEmployee);
```


### Metadata: updatedAt
Date handling is an exceptional case, it is a non-deterministic value. Here are some alternatives
  - make it deterministic: use `sinon.fakeTimers` or `MockDate`
  - use a special assertion like `expectDateWithin` (available in userland) TODO link
  - use a `spy(date, 'now')`
  - ignore it

Remember to restore the date at the end

### Metadata: uniqueKey
I'll introduce a complication here. I want a `uniqueKey` that takes the object's id string.

```js
employeeApiTest.js

    const metadata = {
        ...
        uniqueKey: response.result._id.toString(),
    };
```
```js
server.js

    const _id = new ObjectId();
    const employee = {
      ...request.payload,
      _id,
      uniqueKey: _id.toString(),
      updatedBy: 'mary@hr.com',  // hardcoded here, but you would pass this in the request Authorization header
      updatedAt: new Date(),
      isDeleted: false,
    };

    const result = await db.collection('employees').insertOne(employee);
    await db.collection('employees_history').insertOne(employee);
```

This code works. The tests passes. But there is a problem. It's an error I commited myself. The history and the original collection now hold documments with the same `_id`. This is bad because `ObjectIds` are expected to be unique between collections.

Ignoring the `_id` in the tests wasn't the cause of my mistake, but it was by considering to include them that got me thinking:

```js
    expect(savedEmployees).to.deep.equal([{ ...expectedEmployee, _id: savedEmployees[0]._id }]);

    // wait, is this supposed to be the same id?
    expect(savedEmployeesHistory).to.deep.equal([{ ...expectedEmployee, _id: savedEmployees[0]._id }]);
```

Here is the correct code. Note the last line in the test, without it, the test would still pass even without modifications to the source code. There was also some minor refactoring.
```js
employeeApiTest.js

    const metadata = {
        _id: response.result._id,
        uniqueKey: response.result._id.toString(),
        ...
    };

    const savedEmployees = await db.collection('employees').find().toArray();
    expect(savedEmployees).to.deep.equal([expectedEmployee]);

    // and a copy is saved for history
    const savedEmployeesHistory = await db.collection('employees_history').find().toArray();
    expect(savedEmployeesHistory).to.deep.equal([{ ...expectedEmployee, _id: savedEmployeesHistory[0]._id }]);
    expect(savedEmployees[0]._id.toString()).to.not.equal(savedEmployeesHistory[0]._id.toString());
```


## ... to transform the data to the legacy format

```js
test('POST /employees transforms the employee data to the legacy format, adds metadata, saves it to the database, saves a copy for history and returns the non transformed employee', async () => {
    ...
    // then it transforms the employee to the legacy format
    const transformedEmployee = { fullname: 'John', occupation: 'Programmer' };
    expect(savedEmployees[0]).to.deep.match(transformedEmployee);
    expect(savedEmployees[0]).to.not.have.any.keys('name', 'jobTitle');
    ...
    const expectedEmployee = { ...transformedEmployee, ...metadata };
    ...
    // and the non transformed employee is returned
    expect(response.result).to.deep.equal({ ...employee, ...metadata });
```
```sh
-{}
+{
+  "fullname": "John"
+  "occupation": "Programmer"
+}
```
```js
server.js

server.route({
  method: 'POST',
  path: '/employees',
  handler: async request => {
    await db.initialize();

    const _id = new ObjectId();
    const { name, jobTitle, ...employeeFields } = request.payload;
    const metadata = {
      _id,
      uniqueKey: _id.toString(),
      updatedBy: 'mary@hr.com', // you would get this from request.auth,
      updatedAt: new Date(),
      isDeleted: false,
    };
    const employeeAsLegacy = {
      ...employeeFields,
      ...metadata,
      fullname: name,
      occupation: jobTitle,
    };

    await db.collection('employees').insertOne(employeeAsLegacy);
    await db.collection('employees_history').insertOne({ ...employeeAsLegacy, _id: new ObjectId() });

    return {
      ...request.payload,
      ...metadata,
    };
  },
});
```


## ... to emit an event to a queue
This would require to install a messaging service, like nsq, which is too much trouble for this self contained example. I use docker to set up external services, like, mongo, redis and nsq.

The test process is similar to any external service. I have them running prior to running the tests, connect to the service, run the test, fetch the service state to check the expected has happened. NSQ has a web interface I can connect to through code to fetch/clear/etc.

The implementation is just a one line like `dispatcher.publish('employeeCreated', employee)`.


## ... to validate the data
Note again the vague description. Which validations?

You test valid data by not having invalid data. For each validation you have to provide an invalid input, which means one test per invalid input.

Although you don't change the test itself, you can update its title to contrast with the other tests.

```js
'POST /employees WITH VALID DATA transforms the employee...'
```

The idea of a failed validation is to return an error. I usually return a `400 BAD REQUEST` error. It is also not supposed to have any side effects on the system. To handle that, don't initialize your side-effectable systems. In my case, no `db.initialize()` and no `nsq.initialize()`. I usually have these services always on, so I would have to stop them before the validation tests and start after.

**when** I `POST` some data to the endpoint `/employees` with a missing name, **then** I want to return an error 400

```js
test('POST /employees with a missing name returns an error 400', async () => {
    // given a server listening for requests
    await server.initialize();

    // and an employee with a missing name
    const employee = { jobTitle: 'Programmer' };

    // when `POST` to /employees with the employee data
    const response = await server.inject({ method: 'post', url: '/employees', payload: employee });

    // then an error 400 is returned
    const errorBadRequest = {
        statusCode: 400,
        error: 'Bad Request',
        message: '"name" is required',
    };
    expect(response.result).to.deep.equal(errorBadRequest);

    // cleanup
    await server.stop();
});
```
```sh
-  "isDeleted": false
-  "jobTitle": "Programmer"
-  "uniqueKey": "604f3e639f482274a5e9f334"
-  "updatedAt": [Date: 2021-03-15T11:00:51.455Z]
-  "updatedBy": "mary@hr.com"
+  "error": "Bad Request"
+  "message": "\"name\" is required"
+  "statusCode": 400
  }
```

```js
  handler: async request => {
    if (!request.payload.name) {
      return {
        statusCode: 400,
        error: 'Bad Request',
        message: '"name" is required',
      }
    }
    ...
```

I'm using a framework agnostic error handling for now. Also I know I'm returning a 200 status code.

Create a new test like this for every validation needed.

---------------------------------------------
[1]: https://softwareengineering.stackexchange.com/questions/7823/is-it-ok-to-have-multiple-asserts-in-a-single-unit-test
