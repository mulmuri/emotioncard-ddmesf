const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());

app.set('view engine', 'ejs');
app.set('views', 'view_ejs');
app.use(express.static('emoticon'));



var emotionList = [0, "감동적인", "감사한", "기대되는", "기쁜", "놀라운", "든든한", "만족스러운", "사랑스러운", "신나는", "열중한", "자랑스러운", "자신 있는", "재미 있는", "편안한", "평화로운", "홀가분한", "활기찬", "황홀한", "걱정스러운", "긴장한", "깜짝 놀란", "당황한", "두려운", "무서운", "불안한", "혼란스러운", "시무룩한", "웃픈", "답답한", "미운", "분한", "억울한", "짜증나는", "귀찮은", "무관심한", "부끄러운", "부러운", "싸늘한", "지루한", "피곤한", "괴로운", "그리운", "막막한", "미안한", "서운한", "슬픈", "실망스러운", "안타까운", "외로운", "우울한", "좌절한", "후회스러운", "궁금한", "위축되는", "서러운"];

var cardColor = [];
for (var i=1; i<=55; i++) {
    var R = Math.floor(Math.random() * 8 + 8).toString(16) + Math.floor(Math.random() * 16).toString(16);
    var G = Math.floor(Math.random() * 8 + 8).toString(16) + Math.floor(Math.random() * 16).toString(16);
    var B = Math.floor(Math.random() * 8 + 8).toString(16) + Math.floor(Math.random() * 16).toString(16);
    cardColor[i] = '#'+R+G+B;
};


function Room() {

    this.cardState = [];
    for (var i=1; i<=55; i++) this.cardState[i] = {
        cardType: 0,
        cardOwner: -1
    };
    this.eventQueue = [];

    this.syncCallback = function(req, res, timestamp, roomId, count) {
        newTimestamp = room[roomId].eventQueue.length;
        if (newTimestamp != timestamp || count == 0) {
            var updateList = new Array(newTimestamp - timestamp);
            for (var i=0; i< updateList.length; i++)
                updateList[i] = room[roomId].eventQueue[i+timestamp];

            req.body.timestamp = newTimestamp;
            req.body.updateList = updateList;
            res.send(req.body);
        } else {
            setTimeout(room[roomId].syncCallback, 100, req, res, timestamp, roomId, count-1);
        }
    }

    this.selectCard = function(cardNum, actionUser, username) {
        if (this.cardState[cardNum].cardType == 0) {
            this.cardState[cardNum] = {
                cardType: 1,
                cardOwner: actionUser,
                username: username
            };
            this.eventQueue.push({
                cardNum: cardNum,
                actionType: 1,
                actionUser: actionUser,
                username: username
            });
            return 1;

        } else if (this.cardState[cardNum].cardType == 1 && this.cardState[cardNum].cardOwner == actionUser) {
            this.cardState[cardNum].cardType = 0;
            this.eventQueue.push({
                cardNum: cardNum,
                actionType: 0,
                actionUser: 0,
                username: username
            });
            return 0;

        } else {
            return -1;
        }
    };

    this.resetCard = function() {
        for (var i=1; i<=55; i++) {
            if (this.cardState[i].cardType == 1) {
                this.eventQueue.push({
                    cardNum: i,
                    actionType: 0,
                    actionUser: 0,
                    username: undefined
                });
                this.cardState[i].cardType = 0;
            }
        }
    };

}

var room = [];



app.post('/syncRequest', function(req, res) {
    room[req.body.roomId].syncCallback(req, res, req.body.timestamp, req.body.roomId, 250);
});

app.post('/selectCardRequest', function(req, res) {
    var result = room[req.body.roomId].selectCard(req.body.cardNum, req.body.actionUser, req.body.username);

    if (result == 1 || result == 0) {
        req.body.operate = true;
        req.body.actionType = result;
    } else {
        req.body.operate = false;
    }

    console.log(req.body);
    res.send(req.body);
});

app.post('/cardResetRequest', function(req, res) {
    room[req.body.roomId].resetCard();
});


app.post('/makeRoom', function(req, res) {
    var roomId = Math.floor(Math.random() * 9000) + 1000;
    room[roomId] = new Room();
    res.redirect('room?id='+roomId);
});

app.post('/enterRoom', function(req, res) {
    var roomId = req.body.roomId;
    res.redirect('room?id='+roomId);    
})


app.get('/main', function(req, res) {
    res.render('main');
});

app.get('/maintest', function(req, res) {
    res.render('main');
});

app.get('/room', function(req, res) {
    var roomId = req.query.id;
    if (room[roomId] == undefined) {
        res.status(404).send('Error');
        room[roomId] = new Room();
    }

    res.render('room', {
        emotionList: emotionList,
        cardColor: cardColor,
        roomId: roomId,
        timestamp: room[roomId].eventQueue.length,
        cardState: room[roomId].cardState
    });
});



app.listen(80, () => console.log('server is running'));
