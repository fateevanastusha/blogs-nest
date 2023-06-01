import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from "@nestjs/common";
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { createApp } from "./create.app";
import { BusinessService } from "../src/business.service";
import { UsersRepository } from "../src/api/superadmin/users/users.repository";

describe('AppController (e2e)', () => {
  jest.setTimeout(3 * 60 * 1000)
  let service;
  let appRaw: INestApplication;
  let server;
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).overrideProvider(BusinessService)
      .useValue({
        sendConfirmationCode (email : string, confirmationCode : string){
        return Promise.resolve(confirmationCode)
        },
        sendRecoveryCode (email : string, confirmationCode : string){
          return Promise.resolve(confirmationCode)
        },
      })
      .compile();
    appRaw = moduleFixture.createNestApplication();
    let app = createApp(appRaw)
    await app.init();
    server = await app.getHttpServer()
    service = app.get<UsersRepository>(UsersRepository)
  });

  beforeAll(async () => {
    //runDb()
    await request(server)
      .delete('/testing/all-data')
      .set({ Authorization: "Basic YWRtaW46cXdlcnR5" })
      .expect(204)
  })

  let token_1 : any = null
  let token_2 : any = null
  let createResponseBlog_1 : any = null
  let createResponsePost_1 : any = null
  let createResponsePost_2 : any = null
  let createResponseBlog_2 : any = null
  let createResponseUser_1 : any = null
  let createResponseUser_2 : any = null
  let res : any = null

  //SA testing

  it ('SA check empty blogs array', async  () => {
    const res = await request(server)
      .get('/sa/blogs')
      .set({Authorization: "Basic YWRtaW46cXdlcnR5"})
    expect(res.body).toStrictEqual({
      pagesCount: 0,
      page: 1,
      pageSize: 10,
      totalCount: 0,
      items: []
    })
    expect(res.status).toBe(200)
  })

  it ('SA check empty user', async  () => {
    const res = await request(server)
      .get('/sa/users')
      .set({Authorization: "Basic YWRtaW46cXdlcnR5"})
    expect(res.body).toStrictEqual({
      pagesCount: 0,
      page: 1,
      pageSize: 10,
      totalCount: 0,
      items: []
    })
    expect(res.status).toBe(200)
  })

  it ('SA create 1 user', async  () => {
    createResponseUser_1 = await request(server)
      .post('/sa/users')
      .set({Authorization: "Basic YWRtaW46cXdlcnR5"})
      .send({
        login: 'user1',
        password: 'qwerty',
        email: 'user1@gmail.com'
      })
      .expect(201)
    expect(createResponseUser_1.body).toStrictEqual({
      "banInfo": {
        "banDate": null,
        "banReason": null,
        "isBanned": false
      },
      "createdAt": expect.any(String),
      "email": "user1@gmail.com",
      "id": expect.any(String),
      "login": "user1"
    })
  })

  it ('SA create 2 user', async  () => {
    createResponseUser_2 = await request(server)
      .post('/sa/users')
      .set({Authorization: "Basic YWRtaW46cXdlcnR5"})
      .send({
        login: 'user2',
        password: 'qwerty',
        email: 'user2@gmail.com'
      })
      .expect(201)
  })

  it('SA get 2 users with pagination', async () => {
    res = await request(server)
      .get('/sa/users?sortBy=name&sortDirection=asc&pageSize=5')
      .set({Authorization: "Basic YWRtaW46cXdlcnR5"})
      .expect(200)
    expect(res.body).toStrictEqual({
      "page": 1,
      "pageSize": 5,
      "pagesCount": 1,
      "totalCount": 2,
      "items": [
        {
          "banInfo": {
            "banDate": null,
            "banReason": null,
            "isBanned": false
          },
          "createdAt": createResponseUser_1.body.createdAt,
          "email": "user1@gmail.com",
          "id": createResponseUser_1.body.id,
          "login": "user1"
        },
        {
          "banInfo": {
            "banDate": null,
            "banReason": null,
            "isBanned": false
          },
          "createdAt": createResponseUser_2.body.createdAt,
          "email": "user2@gmail.com",
          "id": createResponseUser_2.body.id,
          "login": "user2"
        }
      ]
    })
  })

  it ('SA ban user', async  () => {
    await request(server)
      .put('/sa/users/' + createResponseUser_1.body.id + '/ban')
      .set({Authorization: "Basic YWRtaW46cXdlcnR5"})
      .send({
        isBanned : true,
        banReason : 'test ban for user 1 that longer 20'
      })
      .expect(204)
    res = await request(server)
      .get('/sa/users?sortBy=name&sortDirection=asc&pageSize=1')
      .set({Authorization: "Basic YWRtaW46cXdlcnR5"})
      .expect(200)
    expect(res.body).toStrictEqual({
      "page": 1,
      "pageSize": 1,
      "pagesCount": 2,
      "totalCount": 2,
      "items": [
        {
          "banInfo": {
            "banDate": expect.any(String),
            "banReason": "test ban for user 1 that longer 20",
            "isBanned": true
          },
          "createdAt": expect.any(String),
          "email": "user1@gmail.com",
          "id": createResponseUser_1.body.id,
          "login": "user1"
        }
      ]
    })
    await request(server)
      .put('/sa/users/' + createResponseUser_1.body.id + '/ban')
      .set({Authorization: "Basic YWRtaW46cXdlcnR5"})
      .send({
        isBanned : false ,
        banReason : 'test ban for user 1 that longer 20'
      })
      .expect(204)
    res = await request(server)
      .get('/sa/users?sortBy=name&sortDirection=asc&pageSize=1')
      .set({Authorization: "Basic YWRtaW46cXdlcnR5"})
      .expect(200)
    expect(res.body).toStrictEqual({
      "page": 1,
      "pageSize": 1,
      "pagesCount": 2,
      "totalCount": 2,
      "items": [
        {
          "banInfo": {
            "banDate": null,
            "banReason": null,
            "isBanned": false
          },
          "createdAt": expect.any(String),
          "email": "user1@gmail.com",
          "id": createResponseUser_1.body.id,
          "login": "user1"
        }
      ]
    })
  })

  it ('SA delete 1 user', async  () => {
    await request(server)
      .delete('/sa/users/' + createResponseUser_1.body.id)
      .set({Authorization: "Basic YWRtaW46cXdlcnR5"})
      .expect(204)
  })

  it('SA check for deleted 1 user', async () => {
    res = await request(server)
      .get('/sa/users')
      .set({Authorization: "Basic YWRtaW46cXdlcnR5"})
      .expect(200)
    expect(res.body).toStrictEqual({
      "page": 1,
      "pageSize": 10,
      "pagesCount": 1,
      "totalCount": 1,
      "items": [
        {
          "banInfo": {
            "banDate": null,
            "banReason": null,
            "isBanned": false
          },
          "createdAt": createResponseUser_2.body.createdAt,
          "email": "user2@gmail.com",
          "id": createResponseUser_2.body.id,
          "login": "user2"
        }
      ]
    })
  })

  it ('SA create new blog', async () => {
    createResponseBlog_1 = await request(server)
      .post('/blog')
      .send({
        "name": "TEST2",
        "description": "TEST2",
        "websiteUrl": "http://www.test2.com"
      })
      .set({Authorization: "Basic YWRtaW46cXdlcnR5"})
      .expect(201)
  })

  it('SA check for created blog', async () => {
    res = await request(server)
      .get('/sa/blogs')
      .set({Authorization: "Basic YWRtaW46cXdlcnR5"})
      .expect(200)
    expect(res.body).toStrictEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: [
        {
          name: 'TEST2',
          description: 'TEST2',
          websiteUrl: 'http://www.test2.com',
          id: createResponseBlog_1.body.id,
          createdAt: createResponseBlog_1.body.createdAt,
          isMembership: true,
          blogOwnerInfo: {
            userId : expect.any(String),
            userLogin : expect.any(String)
          }
        }
      ]
    })
  })

  it ('SA bind blog', async  () => {
    await request(server)
      .put('/sa/blogs/' + createResponseBlog_1.body.id + '/bind-with-user/' + createResponseUser_2.body.id)
      .set({Authorization: "Basic YWRtaW46cXdlcnR5"})
      .expect(204)
  })

  it('SA check for binded blog', async () => {
    res = await request(server)
      .get('/sa/blogs')
      .set({Authorization: "Basic YWRtaW46cXdlcnR5"})
      .expect(200)
    expect(res.body).toStrictEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: [
        {
          name: 'TEST2',
          description: 'TEST2',
          websiteUrl: 'http://www.test2.com',
          id: createResponseBlog_1.body.id,
          createdAt: createResponseBlog_1.body.createdAt,
          isMembership: true,
          blogOwnerInfo: {
            userId : createResponseUser_2.body.id,
            userLogin : createResponseUser_2.body.login
          }
        }
      ]
    })
  })

  //CHECK BLOGGER

  it('PUBLIC AND BLOGGER delete all data after SA', async () => {
    //runDb()
    await request(server)
      .delete('/testing/all-data')
      .set({ Authorization: "Basic YWRtaW46cXdlcnR5" })
      .expect(204)
  })
  //try to auth with banned user

  it ('AUTH PUBLIC login with banned user', async () => {
    //create user
    await request(server)
      .post('/auth/registration')
      .send({
        login : "userforban",
        email : "userforban@yandex.ru",
        password : "1234567"
      })
      .expect(204)
    //ban user
    let userId = (await service.returnUserByField('userforban')).id
    await request(server)
      .put('/sa/users/' + userId + '/ban')
      .set({Authorization: "Basic YWRtaW46cXdlcnR5"})
      .send({
        isBanned : true,
        banReason : 'test ban for user 1 that longer 20'
      })
      .expect(204)
    await request(server)
      .post('/auth/login')
      .send({
        loginOrEmail : 'userforban@yandex.ru',
        password : '1234567'
      })
      .expect(401)

  })

  //starts with create user
  let user
  it('AUTH PUBLIC test email sending', async () => {
    await request(server)
      .post('/auth/registration')
      .send({
        login : "nastya1",
        email : "fateevanastushatest@yandex.ru",
        password : "qwerty1"
      })
      .expect(204)
    await request(server)
      .post('/auth/registration')
      .send({
        login : "",
        email : "",
        password : ""
      })
      .expect(400)
    await request(server)
      .post('/auth/registration')
      .send({
        login : "nastya1",
        email : "fateevanastushatest@yandex.ru",
        password : "qwerty1"
      })
      .expect(400)
    //registration email resending
    await request(server)
      .post('/auth/registration-email-resending')
      .send({
        email : "notexisting@gmail.com"
      })
      .expect(400)

    await request(server)
      .post('/auth/registration-email-resending')
      .send({
        email : "fateevanastushatest@yandex.ru"
      })
      .expect(204)

    //confirmation check
    await request(server)
      .post('/auth/registration-confirmation')
      .send({
        "code" : "not existing code"
      })
      .expect(400)
    user = await service.returnUserByField('nastya1')
    await request(server)
      .post('/auth/registration-confirmation')
      .send({
        "code" : user.confirmedCode
      })
      .expect(204)
  });

  it('AUTH PUBLIC test change password', async () => {
    await request(server)
      .post('/auth/password-recovery')
      .send({
        email : "fateevanastushatest@yandex.r",
      })
      .expect(400)
    await request(server)
      .post('/auth/password-recovery')
      .send({
        email : "fateevanastushatest@yandex.ru",
      })
      .expect(201)

    await request(server)
      .post('/auth/new-password')
      .send({
        "newPassword": "qwerty11",
        "recoveryCode": 'WRONG CODE'
      })
      .expect(400)
    let new_user = await service.returnUserByField('nastya1')
    await request(server)
      .post('/auth/new-password')
      .send({
        "newPassword": "qwerty11",
        "recoveryCode": new_user.confirmedCode
      })
      .expect(204)

    await request(server)
      .post('/auth/login')
      .send({
        loginOrEmail : 'fateevanastushatest@yandex.ru',
        password : 'WRONG PASSWORD'
      })
      .expect(401)

    token_1 = await request(server)
      .post('/auth/login')
      .send({
        loginOrEmail : 'fateevanastushatest@yandex.ru',
        password : 'qwerty11'
      })
      .expect(200)
    expect(token_1.body).toBeDefined()

  });
  it('AUTH PUBLIC check me and refresh token request', async () => {
    await request(server)
      .get('/auth/me')
      .expect(401)
    res = await request(server)
      .get('/auth/me')
      .auth(token_1.body.accessToken, {type : 'bearer'})
      .expect(200)
    expect(res.body).toStrictEqual({
      email : 'fateevanastushatest@yandex.ru',
      login : 'nastya1',
      userId : expect.any(String)
    })
  })
  //create second user

  it('AUTH PUBLIC create second user for check blogs', async () => {
    await request(server)
      .post('/auth/registration')
      .send({
        login : "alina28",
        email : "alina23tikhomirova@yandex.ru",
        password : "qwerty"
      })
      .expect(204)
    token_2 = await request(server)
      .post('/auth/login')
      .send({
        loginOrEmail : 'alina28',
        password : 'qwerty'
      })
      .expect(200)
    expect(token_2.body).toBeDefined()
  })
  //check for bloggers

  it ('BLOGGER create new blog', async () => {
    createResponseBlog_1 = await request(server)
      .post('/blogger/blogs')
      .send({
        "name": "1bloguser1",
        "description": "about me",
        "websiteUrl": "http://www.nastyastar.com"
      })
      .auth(token_1.body.accessToken, {type : 'bearer'})
      .expect(201)
    await request(server)
      .post('/blogger/blogs')
      .send({
        "name": "2bloguser1",
        "description": "about me",
        "websiteUrl": "http://www.nastyastar.com"
      })
      .auth(token_1.body.accessToken, {type : 'bearer'})
      .expect(201)
    createResponseBlog_2 = await request(server)
      .post('/blogger/blogs')
      .send({
        "name": "2bloguser2",
        "description": "about me",
        "websiteUrl": "http://www.nastyastar.com"
      })
      .auth(token_2.body.accessToken, {type : 'bearer'})
      .expect(201)
    res = await request(server)
      .get('/blogger/blogs')
      .auth(token_1.body.accessToken, {type : 'bearer'})
      .expect(200)
    expect(res.body).toStrictEqual({
      "page": 1,
      "pageSize": 10,
      "pagesCount": 0,
      "totalCount": 0,
      "items": [{
        "createdAt": expect.any(String),
        "description": "about me",
        "id": expect.any(String),
        "isMembership": true,
        "name": "2bloguser1",
        "websiteUrl": "http://www.nastyastar.com"
      },
        {
          "createdAt": expect.any(String),
          "description": "about me",
          "id": expect.any(String),
          "isMembership": true,
          "name": "1bloguser1",
          "websiteUrl": "http://www.nastyastar.com"
        }]
    })
    await request(server)
      .put('/blogger/blogs/' + createResponseBlog_1.body.id )
      .send({
        "name": "updatedname",
        "description": "about me",
        "websiteUrl": "http://www.nastyastar.com"
      })
      .auth(token_2.body.accessToken, {type : 'bearer'})
      .expect(403)
    res = await request(server)
      .get('/blogger/blogs')
      .auth(token_1.body.accessToken, {type : 'bearer'})
      .expect(200)
    expect(res.body).toStrictEqual({
      "page": 1,
      "pageSize": 10,
      "pagesCount": 0,
      "totalCount": 0,
      "items": [{
        "createdAt": expect.any(String),
        "description": "about me",
        "id": expect.any(String),
        "isMembership": true,
        "name": "2bloguser1",
        "websiteUrl": "http://www.nastyastar.com"
      },
        {
          "createdAt": expect.any(String),
          "description": "about me",
          "id": expect.any(String),
          "isMembership": true,
          "name": "1bloguser1",
          "websiteUrl": "http://www.nastyastar.com"
        }]
    })
    await request(server)
      .put('/blogger/blogs/' + createResponseBlog_1.body.id )
      .send({
        "name": "updatedname",
        "description": "about me",
        "websiteUrl": "http://www.nastyastar.com"
      })
      .auth(token_1.body.accessToken, {type : 'bearer'})
      .expect(204)
    res = await request(server)
      .get('/blogger/blogs')
      .auth(token_1.body.accessToken, {type : 'bearer'})
      .expect(200)
    expect(res.body).toStrictEqual({
      "page": 1,
      "pageSize": 10,
      "pagesCount": 0,
      "totalCount": 0,
      "items": [{
        "createdAt": expect.any(String),
        "description": "about me",
        "id": expect.any(String),
        "isMembership": true,
        "name": "2bloguser1",
        "websiteUrl": "http://www.nastyastar.com"
      },
        {
          "createdAt": expect.any(String),
          "description": "about me",
          "id": expect.any(String),
          "isMembership": true,
          "name": "updatedname",
          "websiteUrl": "http://www.nastyastar.com"
        }]
    })
  })


  afterAll(async () => {
    await request(server)
      .delete('/testing/all-data')
      .set({Authorization : "Basic YWRtaW46cXdlcnR5"})
      .expect(204)
    await server.close()
  })
});
