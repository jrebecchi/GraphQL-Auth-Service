import AppTester from '../utils/AppTester';

let appTester: AppTester;
let request;

let user1 = {
    email: "test@test.com",
    password: "password",
    firstName: "firstname",
    lastName: "lastname",
    age: 23,
    gender: "Mrs",
    receiveNewsletter: true
};

let user2 = {
    email: "test2@test.com",
    password: "password2",
    firstName: "firstname2",
    lastName: "lastname2",
    age: 23,
    gender: "Mrs",
    receiveNewsletter: true
};

const buildEmailAvailableQuery = (email) => {
    return {
        query: `query{
            emailAvailable(email:"${email}")
        }`
    }
}

beforeAll((done) => {
    appTester = new AppTester({
        dbAddress: "localhost:27017/AvailableTest",
        onReady: async () => {
            try {
                request = appTester.getRequestSender();
                await appTester.register(user1);
                await appTester.register(user2);
                done();
            } catch (err) {
                done(err);
            }
        }
    });
}, 40000);

test("Email availability", async (done) => {
    let res = await request.getGraphQL(buildEmailAvailableQuery("available.email@mail.com"));
    expect(res.data.emailAvailable).toBeTruthy();
    res = await request.getGraphQL(buildEmailAvailableQuery(user1.email));
    expect(res.data.emailAvailable).toBeFalsy();
    res = await request.getGraphQL(buildEmailAvailableQuery(user2.email));
    expect(res.data.emailAvailable).toBeFalsy();
    done()
});

afterAll(async (done) => {
    await appTester.close(done);
}, 40000);