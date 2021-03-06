const express = require('express');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'ejs');
app.set('views', 'view_ejs');
app.use(express.static('emoticon'));



Util = {
    getRandomString : function(length) {
        const str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        let result = '';
        for (var i=0; i<length; i++) result += str[Math.floor(Math.random()*str.length)]
        return result;
    },

    getRandomNumber : function(length) {
        const str = '0123456789';
        let result = '';
        for (var i=0; i<length; i++) result += str[Math.floor(Math.random()*str.length)]
        return result;
    },

    getRandomColor : function() {
        const arr = [
            "#0d6efd",
            "#6610f2",
            "#6610f2",
            "#d63384",
            "#dc3545",
            "#fd7e14",
            "#ffc107",
            "#198754",
            "#20c997",
            "#0dcaf0",
            "#adb5bd"            
        ];
        return arr[Math.floor(Math.random()*arr.length)];
    },

    getLightColor : function() {
        var R = Math.floor(Math.random() * 8 + 8).toString(16) + Math.floor(Math.random() * 16).toString(16);
        var G = Math.floor(Math.random() * 8 + 8).toString(16) + Math.floor(Math.random() * 16).toString(16);
        var B = Math.floor(Math.random() * 8 + 8).toString(16) + Math.floor(Math.random() * 16).toString(16);

        return color = '#'+R+G+B;
    }

}


class User  {

    roomId;

    list = new Map();
    nameList = new Map();
    activeList = [];
    lifecycle = new Map();

    constructor(num) {
        this.roomId = num;
    }

    addUser(name) {
        if (this.nameList.get(name) !== undefined)
            return this.nameList.get(name);

        var sid = Util.getRandomString(6);
        var color = Util.getRandomColor();
        this.nameList.set(name, sid);
        this.activeList.push({
            name: name,
            color: color
        });
        this.list.set(sid, {
            name: name,
            color: color,
            online: 1,
            ownCard: []
        });

        this.resetLifeCycle(sid);
            
        return sid;
    };

    deleteUser(sid, user, roomId) {
        if (user.list.get(sid) === undefined) return;

        var name = user.list.get(sid).name;
        user.nameList.delete(name);
        user.activeList = user.activeList.filter(elm => elm.name != name);
        user.list.delete(sid);
        user.lifecycle.delete(sid);

    console.log(`
    ** user leaved **
    room : ${room.get(roomId).view.title}
    user : ${name}`)

    };

    resetLifeCycle(sid) {
        let timer = setTimeout(this.deleteUser, 6000, sid, this, this.roomId);
        this.lifecycle.set(sid, timer);
    };

}

class Room {

    roomId;

    view = {
        emotionList: [null,
            "????????????", "?????????", "????????????", "??????", "?????????", "?????????", "???????????????", "???????????????", "?????????", "?????????", "???????????????", "?????? ??????", "?????? ??????", "?????????", "????????????", "????????????", "?????????", "?????????",
            "???????????????", "?????????", "?????? ??????", "?????????", "?????????", "?????????", "?????????", "???????????????", "????????????", "??????", "?????????", "??????", "??????", "?????????", "????????????", "?????????", "????????????", "????????????", "?????????", "?????????", "?????????", "?????????", "?????????", "?????????", "?????????", "?????????", "?????????", "??????", "???????????????", "????????????", "?????????", "?????????", "?????????", "???????????????", "?????????", "????????????", "?????????"
        ],
        cardColor: [],
        title: ""
    };

    card = {
        queue: [],
        state: [],
        
        getCurTime: () => {return this.card.queue.length}
    };

    user;

    constructor(roomId, title) {
        this.roomId = roomId;
        this.view.title = title;

        for (var i=1; i<=55; i++) {
            this.view.cardColor[i] = Util.getLightColor();
        };

        for (var i=1; i<=55; i++) this.card.state[i] = {
            type: -1,
            owner: null,
            color: null
        };

        this.user = new User(roomId);

    console.log(`

    ** room generated **
    room : ${title}`)

    };


    syncCallback(req, res, myRoom, sid, lastTime, count) {
        var curTime = myRoom.card.getCurTime();

        if (curTime != lastTime || count == 0) {
            clearTimeout(myRoom.user.lifecycle.get(sid));
            myRoom.user.resetLifeCycle(sid);
            req.body.userList = myRoom.user.activeList;

            var updateList = new Array(curTime - lastTime);
            for (var i=0; i< updateList.length; i++)
                updateList[i] = myRoom.card.queue[i+lastTime];

            req.body.curTime = curTime;
            req.body.updateList = updateList;
            res.send(req.body);
        } else {
            setTimeout(myRoom.syncCallback, 100, req, res, myRoom, sid, lastTime, count-1);
        }
    };

    selectCard(num, sid) {
        if (this.user.list.get(sid) === undefined) return 0;

        var ret;

        if (this.card.state[num].type != 1) {
            this.card.state[num] = {
                owner: sid,
                type: 1,
                name: this.user.list.get(sid).name,
                color: this.user.list.get(sid).color,
            };
            this.card.queue.push({
                num: num,
                type: 1,
                name: this.user.list.get(sid).name,
                color: this.user.list.get(sid).color
            });
            ret = 1;

        } else if (this.card.state[num].type == 1 && this.card.state[num].owner == sid) {
            this.card.state[num].type = 0;
            this.card.queue.push({
                num: num,
                type: 0,
                name: null,
                color: null
            });
            ret = -1;

        } else {
            ret = 0;
        }

    console.log(`
    ** card select request **
    room : ${room.get(this.roomId).view.title}
    user : ${this.user.list.get(sid).name}
    card num : ${num}
    card type : ${ret}`)

        return ret;
    };


    resetCard() {
        for (var i=1; i<=55; i++) {
            if (this.card.state[i].type == 1) {
                this.card.state[i].type = 0;
                this.card.queue.push({
                    num: i,
                    type: 0,
                    name: null,
                    color: null
                });
            }
        }
    };

}



let room = new Map();

app.post('/syncRequest', function(req, res) {
    let myRoom = room.get(req.body.roomId);
    let sid = req.body.sid;
    if (myRoom.user.list.get(sid) === undefined) {
        myRoom.user.addUser(req.body.name);
    }
    myRoom.syncCallback(req, res, myRoom, req.body.sid, req.body.lastTime, 40);
});

app.post('/selectCardRequest', function(req, res) {
    var result = room.get(req.body.roomId).selectCard(req.body.num, req.body.sid);

    if (result === 1) {
        req.body.operation = true;
        req.body.type = 1;
    } else if (result === -1) {
        req.body.operation = true;
        req.body.type = 0;
    } else if (result === 0) {
        req.body.operation = false;
    }

    

    res.send(req.body);
});

app.post('/cardResetRequest', function(req, res) {
    var roomId = req.body.roomId;

    console.log(`
    ** card reset request **
    room : ${room.get(roomId).view.title}`)

    room.get(roomId).resetCard();
});


app.post('/makeRoom', function(req, res) {

    var roomId = Util.getRandomNumber(4);
    while (room.get(roomId) === null) roomId = Util.getRandomNumber(4);
    var title = req.body.title;

    var myRoom = new Room(roomId, title)

    room.set(roomId, myRoom);
    var name = req.body.name;
    var sid = myRoom.user.addUser(name);

    console.log(`
    ** user entered **
    room : ${title}
    user : ${name}`)

    res.redirect(`room?id=${roomId}&sid=${sid}`);
});

app.post('/enterRoom', function(req, res) {
    var roomId = req.body.roomId;
    var myRoom = room.get(roomId);

    if (myRoom === undefined) {
        res.redirect('main');
    } else {
        var name = req.body.name;
        var sid = myRoom.user.addUser(name);

    console.log(`
    ** user entered **
    room : ${room.get(roomId).view.title}
    user : ${name}`)

        res.redirect(`room?id=${roomId}&sid=${sid}`);
    }


});


app.get('/', function(req,res) {
    res.redirect('/main');
});

app.get('/main', function(req, res) {
    res.render('main');
});

app.get('/room', function(req, res) {
    var roomId = req.query.id;
    var sid = req.query.sid;


    var thisRoom = room.get(roomId);

    if (thisRoom === undefined || thisRoom.user.list.get(sid) === undefined) {
        res.redirect('main');
    }

    else {
        res.render('room', {
            roomId: roomId,
            I: {
                sid: sid,
                name: thisRoom.user.list.get(sid).name,
                color: thisRoom.user.list.get(sid).color
            },
            view: thisRoom.view,
            card: {
                state: thisRoom.card.state,
                curTime: thisRoom.card.getCurTime()
            },
            user: thisRoom.user.activeList
        });
    }
});


app.listen(3000, () => console.log('    server started\n'));