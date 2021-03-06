import AppTester from '../utils/AppTester';
import jwt from 'jsonwebtoken';
import config from '../../src/config';

let appTester: AppTester;
let request;

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
        dbAddress: "mongodb://localhost:27017/LoginTest",
        onReady: async () => {
            request = appTester.getRequestSender();
            const registerQuery = {
                query: `mutation{
                    register(fields: {
                        email:"${user.email}" 
                        password:"${user.password}"
                        age:${user.age}
                        receiveNewsletter:${user.receiveNewsletter},
                        gender:${user.gender}
                        firstName:"${user.firstName}" 
                        lastName:"${user.lastName}"})
                    }`
            }
            const res = await request.postGraphQL(registerQuery);
            if (res.errors) done(res.errors);
            else done();
        }
    });
}, 40000);

test('Login by email & query user data', async (done) => {

    const query = {
        query: `mutation{
            login(email:"${user.email}" password:"${user.password}"){
            user{
                email
                _id
                email_verified
                age
                receiveNewsletter
                gender
                firstName
                lastName
            }
            token
        }}`
    }
    const res = await request.postGraphQL(query);

    expect(typeof res.data.login.user._id === "string").toBeTruthy();
    expect(res.data.login.user._id.length > 5).toBeTruthy();
    expect(typeof res.data.login.token === "string").toBeTruthy();
    expect(res.data.login.token.length > 10).toBeTruthy();
    expect(res.data.login.user.email).toBe(user.email);
    expect(res.data.login.user.email_verified).toBe(false);
    expect(res.data.login.user.age).toBe(user.age);
    expect(res.data.login.user.receiveNewsletter).toBe(user.receiveNewsletter);
    expect(res.data.login.user.gender).toBe(user.gender);
    expect(res.data.login.user.firstName).toBe(user.firstName);
    expect(res.data.login.user.lastName).toBe(user.lastName);

    done();
});

test('Login by email & decrypting token to get user data', async (done) => {

    const query = {
        query: `mutation{
            login(email:"${user.email}" password:"${user.password}"){
            token
        }}`
    }
    const res = await request.postGraphQL(query);
    expect(typeof res.data.login.token === "string").toBeTruthy();
    expect(res.data.login.token.length > 10).toBeTruthy();
    jwt.verify(res.data.login.token, config.publicKey, { algorithms: ['RS256'] }, async (err, userDecrypted: any) => {
        if (err) {
            done(new Error('Wrong token'));
        } else {
            expect(typeof userDecrypted._id === "string").toBeTruthy();
            expect(userDecrypted._id.length > 5).toBeTruthy();
            expect(userDecrypted.email).toBe(user.email);
            expect(userDecrypted.email_verified).toBe(false);
            expect(userDecrypted.age).toBe(user.age);
            expect(userDecrypted.receiveNewsletter).toBe(user.receiveNewsletter);
            expect(userDecrypted.gender).toBe(user.gender);
            expect(userDecrypted.firstName).toBe(user.firstName);
            expect(userDecrypted.lastName).toBe(user.lastName);
            done()
        }
    });
});

test("Can't decrypt token with a wrong public key", async (done) => {

    const query = {
        query: `mutation{
            login(email:"${user.email}" password:"${user.password}"){
            token
        }}`
    }
    const res = await request.postGraphQL(query);
    expect(typeof res.data.login.token === "string").toBeTruthy();
    expect(res.data.login.token.length > 10).toBeTruthy();
    jwt.verify(res.data.login.token, "wrongPublicKey", { algorithms: ['RS256'] }, async (err, userDecrypted) => {
        if (err) {
            expect(err).toBeTruthy();
            done()
        } else {
            done(new Error('Could decrypt token despite a wrong public key'));
        }
    });
});

test("Wrong login", async (done) => {

    const query = {
        query: `mutation{
            login(email:"blabla" password:"${user.password}"){
            token
        }}`
    }
    const res = await request.postGraphQL(query);
    expect(res.errors[0].message.includes("Wrong credentials")).toBeTruthy();
    expect(res.errors[0].type).toBe('UserNotFoundError');
    done();
});

test("Wrong password", async (done) => {

    const query = {
        query: `mutation{
            login(email:"${user.email}" password:"wrong password"){
            token
        }}`
    }
    const res = await request.postGraphQL(query);
    expect(res.errors[0].message.includes("Wrong credentials")).toBeTruthy();
    expect(res.errors[0].type).toBe('UserNotFoundError');
    done();
});

afterAll(async (done) => {
    await appTester.close(done);
}, 40000);