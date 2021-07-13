# Requirements, TDD, coding... where should I start my program?

In this series, I'll discuss how I **idealize** starting a new project, something I've done very few times in my many years as a developer, and never using preciselly this style. In this post I'll cover **outside in TDD following the GWT naming pattern**.

You can find the code for this article in [my github][7].

These posts are very much a question in the form of an article. I'l likely forget or be mistaken in these issues. Please read it charetably and use the comments to improve on my ideas.

## Where do you start?

### Pre-coding
1) Decide what you want to build
2) Gather just enough information so you can have a workable program
3) Break down your ideas into a list of features
4) Record those features in a text file
5) Prioritize them, pick the first one
6) Locate your top most layer, coding will start here (**outside in TDD**)

I'll build the API for an employee management application, starting with the **CRUD** operations. If I was creating a web application, the UI would be the top most layer, but I just want an API instead. To be more specific, a RESTful HTTP API, meaning url requests instead of clicks on buttons will trigger the funcionalities of the application.


### Coding
1) Define what you want it to happen
2) Make it happen
3) Verify that it happened

For the feature **creation of employees**:

1) **when** I `POST` some data to the endpoint `/employees`, **then** I want that data to be saved to the database
2) I'll make it happen by making a request to my application
3) The feature will be successful if after the request, the employee data is present in the database

In software terms, this is known as a **test**, and following **TDD** it's where you should should start your code. There is something missing in these steps though: to `POST` what and where? These are known as the **preconditions** for the test.

0) **given** a fresh database, a server listening for requests and some employee data.

This way of describing tests is known as Given When Then (**GWT**).

## Follow the TDD Cycle
1) Write a failing test
2) Write the minimum ammount of code to make it pass
3) Refactor
4) Repeat

### 1) Write a failing test

Here is how I would start. I'm using [mocha][3] for testing after having [experimented][5] with some different libraries.

```js
// filename: I'm testing the employee api, so
employeeApiTest.js

// every test description should be an action followed by an expectation
test('POST /employees saves the employee data to the database', async () => {

  // start with the action, it will make it clear where to go next
  post('/employees', employee);
});
```
Now how do I POST, where and with what data? To POST I need a server listening for requests. I'm using [hapi][2] to handle the requests. I'm placing this code in a separate file because it is the code I'm interested in testing.

```js
// filename: as per node conventions
server.js

const server = Hapi.server({
    port: 3000,
    host: 'localhost',
    debug: { request: ['error'] },
});

module.exports = server;
```
```js
employeeApiTest.js

test('POST /employees saves the employee data to the database', async () => {
  await server.initialize();
  const employee = { name: 'John', jobTitle: 'Programmer' };

  // this is how hapi does the post('/employees', employee);
  await server.inject({ method: 'post', url: '/employees', payload: employee })
```
The test is now POSTing to the endpoint `/employees`. I created some dummy employee data to send. The code used is explained in hapi's [documentation][4].

Now I write the expectation.

```js
  const savedEmployees = findSavedEmployees();
  expect(savedEmployees).to.equal([employee]);
```

To check that the data was saved I need a connection to a database. I'm using [mongo-mock][6] for simplicity. Here is the first full version of the test:

```js
test('POST /employees saves the employee data to the database', async () => {
    // given a fresh database
    const client = await MongoClient.connect('mongodb://localhost', { useNewUrlParser: true });
    const db = client.db('tdd-rest-api-from-scratch');
    await db.collection('employees').deleteMany();

    // and a server listening for requests
    await server.initialize();

    // and some employee data
    const employee = { name: 'John', jobTitle: 'Programmer' };

    // when I `POST` to /employees with the employee data
    await server.inject({ method: 'post', url: '/employees', payload: employee });

    // then the employee data is saved to the employees collection
    // this is how mongo does findSavedEmployees(), I'll discuss more about ignoring the `id` in a later time
    const savedEmployees = await db.collection('employees').find({}, { projection: { _id: 0 } }).toArray();
    expect(savedEmployees).to.deep.equal([employee]);
});
```
All tests consists of an action and an expectation. Once you have this, you are ready to run it and see it fail.
```sh
  Debug: handler, error
    Error: Not Found
```


### 2) Write code to make it pass

Although the test fails, it was because of an implementation problem. The error still helps by guiding me what to do next, but I'm really after a test error.

The server is up, but it doesn't understand the `POST /employees` action.

```js
server.route({
    method: 'POST',
    path: '/employees',
    handler: async request => ({}),
});
```

Run it, see it fail.
```sh
-[]
+[
+  {
+    "jobTitle": "Programmer"
+    "name": "John"
+  }
+]
```
Write code to make it pass
```js
const client = await MongoClient.connect('mongodb://localhost', { useNewUrlParser: true });
const db = client.db('tdd-rest-api-from-scratch');

server.route({
    method: 'POST',
    path: '/employees',
    handler: async request => await db.collection('employees').insertOne(request.payload),
});
```
Run it, see it pass.

### 3) Refactor
Now that the test is passing, I can refactor. Since both the test and the source code need the database, move it to its own file to avoid duplication (DRY).

```js
db.js

let db;

module.exports = {

  async initialize() {
    if (db) return;

    const client = await MongoClient.connect('mongodb://localhost/', { useNewUrlParser: true });
    db = client.db('tdd-rest-api-from-scratch');
  },

  collection(collection) {
    return db.collection(collection);
  },

};
```

Run it, see if it still passes.

### 4) Repeat
Pick your next feature and follow the TDD cycle.


## Discussion

### Things to note about the code
- **no unit tests**: so far there is little value in adding any unit test. It's normal for CRUD and REST APIs to be mostly integration tests
- **no mocks**: I'm following an approach [without mocks][9], testing only real code.
- **every step of the GWT is commented**: useful at first for learning, but also later on the project for enforcing the style


### How I actually start my projects
In **practice**, if I were to start a new project **from scratch**, I would find the most popular stack and likely use it. Community is a powerful thing. If I had the time I would test more stacks and decide between them together with my team.

It can be a hard thing for a senior programmer, one that likes to code and has developed a personal style along the years, to use someone else's standards. The desire to create a better wheel is great, but when coding in a team you have to compromise. And there is no greater team then the internet. So if **your team is ok with it**, use stablished tools, frameworks and coding conventions.

If your team already have a bagage, some already made components, a not so hot language that everyone knows, **maybe** go with them. It is worth to reacess every once in a while if there is no better way to create a program. If you're hiring new team members, chances are they're using the latest and coolest, often overkill for the current task, tech stack on the block. Personally, I do this every few months, and I'm constantly craving to do a better version of my previous work.

Many projects I've worked had few if any tests. They start as a proof of concept, having the most important features done first and hastily. The biggest problem I ever faced and I think I will ever face is the **client not knowing what they want**. And often they will mistakenly require to see the application running in order to make decisions, even minor ones that most likely could have been talked over, or quickly sketched on a piece of paper, or even navigated on a mocked UI.

Coding is the most expensive step of developing an application, an can be made much more expensive with tests. So no, I don't think I have ever started an application with pure TDD. If some feature can go either one way or another, I will not extensively test both paths. And when the app is a go, the company will not throw away weeks of code. We start developing over that initial structure.

So, the first decision when testing that I have to make is: what to test and how much. I'll go over this and other decisions in latter topics.

### Documentation
As in every other human activity, **communication is key**. Your code should clearly communicate your intent, but don't neglect a good documentation. Here are a few toughts
- centralized business rules documentation for people other then developers
- markdown over WYSIWYG
- good commit messages and a sane commit history (squashing)
- DRY documentation: either something is in the commit message or in the wiki, or issue tracking
  - but consider that commit messages might be lost due to refactoring, so consider automate the replication
- I'm a minimalist, my favorite organization tool has always been and will always be a simple text **notepad**

### Naming
- don't use "when", "then", "should" on the test descriptions
  - any word that appears on every test is a candidate for removal
  - see [rspec guidelines][1] for some inspiration
  - **counterpoint**: repetion may help to enforce the "action" followed by an "expectation" rule
- naming is about good comunication
  - explain the test for a couple of your coleagues, that should help to clarify things
- if you don't know how to name your test, you don't know what you are testing
  - that's fine, naming is part of the iteractive development cycle: rename it as needed
- don't use implementation details

### Assertions
I've been testing using only **deep equality** for a long while, but I was pleased to see [others][8] also favoring this style.

Consider some of the alternatives

```js
// - only one assertion to learn
// - only one entity was created
// - all the passed data was persisted
// - nothing more was persisted
expect(savedEmployees).to.deep.equal([employee]);

// what if the inserted entity is not the one you intended?
expect(db.collection('employees').count()).to.equal(1)

// what if you inserted more than one entity?
expect(db.findOne({username: 'john35'})).to.equal(payload)

// what if you inserted anoher property you didn't want to?
expect(actuals[0].username).to.equal(payload.username)
expect(actuals[0].name).to.equal(payload.name)
...

// different styles of assertion
expect(db.collection('employees').findAll()).to.have.length(1);

expect(actuals[0]).to.have.property('username');
expect(actuals[0]).to.have.propertyVal('username', 'john35');

expect(actuals[0]).to.include({ username: 'john35', name: 'John' });
expect(actuals[0]).to.containSubset({ username: 'john35', name: 'John' });
```

Using the deep equality version for every scenario can be overkill, and cant still not be not enough. What if by creating an employee, I also create an user, or send an email notification? You can add more tests, at the cost of time to implement and time to run them everytime. But at one point you'll have to decide when the cost overcomes the benefits. Even my approach can be overkill sometimes, and it does have downsides, that I'll explain some other time.

- overkill, more effort needed, testing too much in one place
- not enough
- clutter error message

ultimately is about confidence



## FUTURE / Topics for discussion / Post raised questions

- gwt/aaa alternatives
- outside in alternatives
- layer choice alternative


## Series
1) Outside in TDD following the GWT naming pattern
2) Granularity: one test per action, 1+ results

https://martinfowler.com/bliki/GivenWhenThen.html
https://pythontesting.net/strategy/given-when-then-2/
GIVEN will be setting up test data.
But it could also be getting the system into the proper state.

https://medium.com/@stefanovskyi/unit-test-naming-conventions-dd9208eadbea

- link discussing BDD, ATDD, EdD

[1]: http://www.betterspecs.org
[2]: https://hapi.dev/tutorials
[3]: https://mochajs.org/index.html
[4]: https://hapi.dev/tutorials/testing
[5]: https://github.com/icetbr/comparing-testing-libraries
[6]: https://github.com/williamkapke/mongo-mock
[7]: https://github.com/icetbr/tdd-rest-api-from-scratch/tree/1_minimum_app
[8]: https://medium.com/javascript-scene/rethinking-unit-test-assertions-55f59358253f
[9]: https://medium.com/javascript-scene/mocking-is-a-code-smell-944a70c90a6a























