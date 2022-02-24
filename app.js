const express = require('express');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'ejs');
app.set('views', 'view_ejs');
app.use(express.static('emoticon'));



Util = {
    generateRandomString : function(length) {
        const str ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        let result = '';
        for (var i=0; i<length; i++) result += str[Math.floor(Math.random()*str.length)]
        return result;
    },

    generateRandomNumber : function(length) {
        const str ='0123456789';
        let result = '';
        for (var i=0; i<length; i++) result += str[Math.floor(Math.random()*str.length)]
        return result;
    }
}



class Room {

    roomId = undefined;

    view = {
        emotionList: [null, "감동적인", "감사한", "기대되는", "기쁜", "놀라운", "든든한", "만족스러운", "사랑스러운", "신나는", "열중한", "자랑스러운", "자신 있는", "재미 있는", "편안한", "평화로운", "홀가분한", "활기찬", "황홀한", "걱정스러운", "긴장한", "깜짝 놀란", "당황한", "두려운", "무서운", "불안한", "혼란스러운", "시무룩한", "웃픈", "답답한", "미운", "분한", "억울한", "짜증나는", "귀찮은", "무관심한", "부끄러운", "부러운", "싸늘한", "지루한", "피곤한", "괴로운", "그리운", "막막한", "미안한", "서운한", "슬픈", "실망스러운", "안타까운", "외로운", "우울한", "좌절한", "후회스러운", "궁금한", "위축되는", "서러운"],
        cardColor: []
    };

    card = {
        queue: [],
        state: [],
        
        getCurTime: () => {return this.card.queue.length}
    };

    user = {
        list : new Map(),
        nameList : new Map(),
        activeList : [],
        addUser : function(name) {
            if (this.nameList.get(name) != undefined)
                return this.nameList.get(name);

            var sid = Util.generateRandomString(6);
            var color = "black";
            this.nameList.set(name, sid);
            this.activeList.push({
                name: name,
                color: color
            });
            this.list.set(sid, {
                name: name,
                color: color,
                online: 1,
                own_card: []
            });

            return sid;
        }
    }


    constructor(roomId) {
        this.roomId = roomId;

        for (var i=1; i<=55; i++) {
            var R = Math.floor(Math.random() * 8 + 8).toString(16) + Math.floor(Math.random() * 16).toString(16);
            var G = Math.floor(Math.random() * 8 + 8).toString(16) + Math.floor(Math.random() * 16).toString(16);
            var B = Math.floor(Math.random() * 8 + 8).toString(16) + Math.floor(Math.random() * 16).toString(16);
            this.view.cardColor[i] = '#'+R+G+B;
        };

        for (var i=1; i<=55; i++) this.card.state[i] = {
            type: -1,
            owner: null,
            color: null
        };
    }


    syncCallback(req, res, lastTime, roomId, count) {
        var curTime = room.get(roomId).card.getCurTime();
        if (curTime != lastTime || count == 0) {
            var updateList = new Array(curTime - lastTime);
            for (var i=0; i< updateList.length; i++)
                updateList[i] = room.get(roomId).card.queue[i+lastTime];

            req.body.curTime = curTime;
            req.body.updateList = updateList;
            res.send(req.body);
        } else {
            setTimeout(room.get(roomId).syncCallback, 100, req, res, lastTime, roomId, count-1);
        }
    }

    selectCard(num, sid) {
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
            return 1;

        } else if (this.card.state[num].type == 1 && this.card.state[num].owner == sid) {
            this.card.state[num].type = 0;
            this.card.queue.push({
                num: num,
                type: 0,
                name: null,
                color: null
            });
            return -1;

        } else {
            return 0;
        }
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
    room.get(req.body.roomId).syncCallback(req, res, req.body.lastTime, req.body.roomId, 30);
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
    room.get(req.body.roomId).resetCard();
});


app.post('/makeRoom', function(req, res) {
    var roomId = Util.generateRandomNumber(6);
    while (room.get(roomId) === null) roomId = Util.generateRandomNumber(6);

    room.set(roomId, new Room(roomId));
    var sid = room.get(roomId).user.addUser(req.body.name);

    res.redirect(`room?id=${roomId}&sid=${sid}`);
});

app.post('/enterRoom', function(req, res) {
    var roomId = req.body.roomId;

    var sid = room.get(roomId).user.addUser(req.body.name);

    res.redirect(`room?id=${roomId}&sid=${sid}`);
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



app.listen(3001, () => console.log('server is running'));
