import AppTester from '../utils/AppTester';

let appTester;
let request;
let token
let user = {
    email: "test@test.com",
    password: "password",
    firstName: "firstname",
    lastName: "lastname",
    age: 23,
    gender: "M",
    receiveNewsletter: true
};

beforeAll((done) => {
    appTester = new AppTester({
        dbAddress: "mongodb://localhost:27017/DeleteMeTest",
        onReady: async () => {
            try{
                request = appTester.getRequestSender();
                await appTester.register(user);
                const res = await appTester.login(user.email, user.password);
                token = res.data.login.token;
                done();
            } catch (err) {
                done(err);
            }
        }
    });
}, 40000);

test('Wrong password', async (done) => {

    const query = {
        query: `mutation{
            deleteMe(password:"wrongpassword")
          }`
    }
    let res = await request.postGraphQL(query, token);
    expect(res.errors[0].message.includes("wrong password")).toBeTruthy();
    expect(res.errors[0].type).toBe('WrongPasswordError');
    done()
});

test('Delete user', async (done) => {

    const query = {
        query: `mutation{
            deleteMe(password:"${user.password}")
          }`
    }
    let res = await request.postGraphQL(query, token);
    expect(res.data.deleteMe).toBeTruthy();
    
    res = await appTester.login(user.email, user.password);
    expect(res.errors[0].message.includes("Wrong credentials")).toBeTruthy();
    expect(res.errors[0].type).toBe('UserNotFoundError');

    done();
});


afterAll(async (done) => {
    await appTester.close(done);
}, 40000);