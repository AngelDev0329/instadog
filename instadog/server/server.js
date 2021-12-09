// server.server.js

// Imports
let express = require('express');
let graphqlHTTP = require('express-graphql');
let { buildSchema } = require('graphql');
let cors = require('cors');
let Pusher = require('pusher');
let bodyParser = require('body-parser');
let Multipart = require('connect-multiparty');

// schema (GraphQL Schema language)
let schema = buildSchema(`
    type User {
        id: String!
        nickname: String!
        avatar: String!
    }

    type Post {
        id: String!
        user: User!
        caption: String!
        image: String!
    }

    type Query {
        user(id: String) : User!
        post(user_id: String, post_id: String) : Post!
        posts(user_id: String) : [Post]
    }
`);

// Maps id to User object
let userslist = {
    a: {
        id: 'a',
        nickname: 'Clementine Pug',
        avatar: 'https://www.facebook.com/search/async/profile_picture/?fbid=100027794379670&width=72&height=72'
    },
    b: {
        id: 'b',
        nickname: 'Comrade Pug',
        avatar: 'https://www.facebook.com/search/async/profile_picture/?fbid=100002545038445&width=72&height=72'
    }
};

let postslist = {
    a: {
        a: {
            id: 'a',
            user: userslist['a'],
            caption: 'My brother and me!',
            image: 'https://scontent-sea1-1.xx.fbcdn.net/v/t1.0-9/59008893_10157206196141948_1760933219810672640_n.jpg?_nc_cat=111&_nc_oc=AQmeR2oM2xKnUHTVmPX0G2tTWyrBOMmQXMF57ueVeVwy7a0vTGo__nzoeRwgkpWauPA&_nc_ht=scontent-sea1-1.xx&oh=c1c3796a57f427d17405494b80f41863&oe=5DAB7BFD'
        },
        b: {
            id: 'b',
            user: userslist['a'],
            caption: 'My Brother thinks he is King of the Mountain!',
            image: 'https://scontent-sea1-1.xx.fbcdn.net/v/t1.0-9/10343670_10152501122496948_3410647605424668062_n.jpg?_nc_cat=102&_nc_oc=AQm3k6Mz4cYRGuEpK0EwRBK6jzYayuXAqKK0hICnldzQLoZF25VN1-g-JhXQmPdpCxw&_nc_ht=scontent-sea1-1.xx&oh=6ef01d430bc8559aa94f556753fc249d&oe=5DBF3273'
        },
        c: {
            id: 'c',
            user: userslist['a'],
            caption: 'Fun in the sun!',
            image: 'https://scontent-sea1-1.xx.fbcdn.net/v/t1.0-9/61654592_10157282331091948_2567625105605656576_n.jpg?_nc_cat=111&_nc_oc=AQm6PSmGqvWJ-9Fhn7ajOptR7qdx7-sH8XH506_vsNVgkpVQ51zrJeLwcz-dRn2trm4&_nc_ht=scontent-sea1-1.xx&oh=57b819f708a2db686d5d1c63905eca31&oe=5DAD2D7A'
        },
        d: {
            id: 'd',
            user: userslist['a'],
            caption: 'They see us rolling...',
            image: 'https://scontent-sea1-1.xx.fbcdn.net/v/t1.0-9/37743867_10216440455471239_7087650594881536000_n.jpg?_nc_cat=107&_nc_oc=AQk81UlIk0TeVsIb86MwiZkvu0NkjvDT5qdarH24wwW8SAYD4zGc2E5aDkTKJEfdUjA&_nc_ht=scontent-sea1-1.xx&oh=857daf30f3da67ed5bd0bc41a7003911&oe=5DBABC09'
        }
    }
};

// Root provides resolver function for each API endpoint
let root = {
    user: function ({ id }) {
        return userslist[id];
    },
    post: function( { user_id, post_id }) {
        return postslist[user_id][post_id];
    },
    posts: function({ user_id }) {
        return Object.values(postslist[user_id]);
    }
};

// Configure Pusher Client
let pusher = new Pusher ({
    appId: 'PUSHER_APP_ID',
    key: 'PUSHER_APP_KEY',
    secret: 'PUSHER_APP_SECRET',
    cluster: 'PUSHER_CLUSTER',
    encrypted: true
});

// create express app
// http://localhost:4000/graphql
let app = express();
app.use(cors());
app.use(
    "/graphql",
    graphqlHTTP({
        schema: schema,
        rootValue: root,
        graphiql: true
    })
);

// add Middleware
let multipartMiddleware = new Multipart();

// trigger add a new post
app.post('/newpost', multipartMiddleware, (req, res) => {
    // create sample post
    let post = {
        user: {
            nickname: req.body.name,
            avatar: req.body.avatar
        },
        image: req.body.image,
        caption: req.body.caption
    }

    // trigger pusher event
    pusher.trigger('posts-channel', 'new-post', {
        post
    });

    return res.json({status: 'Post created'});
});

// set application port
app.listen(4000);