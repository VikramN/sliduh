var Game = (function () {
    function Game(id, board, size) {
        var _this = this;
        this.startTime = -1;
        this.elapsed = 0;
        this.timer = -1;
        var canvas = document.getElementById(id);
        canvas.width = canvas.height = size;
        this.size = size;
        this.ctx = canvas.getContext('2d');
        this.board = board;
        this.mousePos = { x: 0, y: 0 };
        this.tileSize = this.size / board.size;
        this.hint = false;
        this.won = false;
        this.hasImage = false;
        this.imgScale = { x: 1, y: 1, s: 1 };
        var clickListener = function (e) {
            var canvasPos = canvas.getBoundingClientRect();
            var x = e.clientX - canvasPos.left;
            var y = e.clientY - canvasPos.top;
            if (board.move(Math.floor(y / _this.tileSize), Math.floor(x / _this.tileSize))) {
                if (_this.playSound && _this.clickAudio)
                    _this.clickAudio.play();
                _this.won = _this.board.checkWin();
                if (_this.won && _this.timer != -1) {
                    if (_this.playSound && _this.winAudio)
                        _this.winAudio.play();
                    clearInterval(_this.timer);
                    _this.timer = -1;
                }
                requestAnimationFrame(function (x) { return _this.draw(); });
            }
        };
        this.freeUp = function () {
            canvas.removeEventListener('click', clickListener);
            clearInterval(_this.timer);
            _this.onTimer = null;
        };
        canvas.addEventListener('click', clickListener);
    }
    Game.prototype.setImage = function (image) {
        this.hasImage = true;
        this.imgData = image;
        var scale = Math.min(image.naturalWidth, image.naturalHeight);
        this.imgScale.s = scale / this.size;
        this.imgScale.x = (image.naturalWidth - scale) / 2;
        this.imgScale.y = (image.naturalHeight - scale) / 2;
        return this;
    };
    Game.prototype.draw = function () {
        var _this = this;
        this.ctx.clearRect(0, 0, this.size, this.size);
        this.ctx.lineWidth = 1;
        this.ctx.font = "32px serif";
        this.ctx.textBaseline = 'middle';
        this.ctx.textAlign = 'center';
        var e = this.tileSize;
        this.ctx.fillStyle = '#EEEEEE';
        this.ctx.fillRect(this.board.empty.col * e, this.board.empty.row * e, e, e);
        this.ctx.fillRect(this.board.empty.col * e, this.board.empty.row * e, e, e);
        this.ctx.fillStyle = '#CDC7C7';
        this.ctx.fillRect(this.board.empty.col * e, this.board.empty.row * e, e, 4);
        this.ctx.fillRect(this.board.empty.col * e, this.board.empty.row * e, 4, e);
        var drawPc = this.hasImage ? this.drawPcImage : this.drawPcNumber;
        this.board.nodes.forEach(function (row, r) {
            row.forEach(function (p, c) {
                if (p) {
                    drawPc.call(_this, p, r, c, e);
                }
            });
        });
    };
    Game.prototype.startCountdown = function (onTimerCallback) {
        var _this = this;
        this.startTime = new Date().getTime();
        this.elapsed = 0;
        this.onTimer = onTimerCallback;
        this.timer = setInterval(function (x) {
            _this.elapsed = Math.floor((new Date().getTime() - _this.startTime) / 1000);
            if (_this.onTimer)
                _this.onTimer(_this.elapsed);
        }, 1000);
        return this;
    };
    Game.prototype.setSound = function (clickAudio, winAudio) {
        this.clickAudio = clickAudio;
        this.winAudio = winAudio;
        return this;
    };
    Game.prototype.playSounds = function (play) {
        this.playSound = play;
        return this;
    };
    Game.prototype.showHint = function (hint) {
        this.hint = hint;
        return this;
    };
    Game.prototype.drawPcImage = function (p, r, c, e) {
        var t = e * this.imgScale.s;
        this.ctx.drawImage(this.imgData, p.org.col * t + this.imgScale.x, p.org.row * t + this.imgScale.y, t, t, c * e, r * e, e, e);
        if (this.hint && !p.home) {
            this.ctx.fillStyle = 'black';
            this.ctx.fillText('' + p.id, c * e + e / 2, r * e + e / 2);
            this.ctx.fillStyle = 'rgba(255,0,0, 0.2)';
            this.ctx.fillRect(c * e, r * e, e, e);
        }
    };
    Game.prototype.drawPcNumber = function (p, r, c, e) {
        this.ctx.fillStyle = this.won ? '#00F5A6' : 'white';
        this.ctx.strokeStyle = 'black';
        this.ctx.fillRect(c * e, r * e, e, e);
        this.ctx.strokeRect(c * e, r * e, e, e);
        this.ctx.fillStyle = 'black';
        this.ctx.fillText('' + p.id, c * e + e / 2, r * e + e / 2);
        if (this.hint && !p.home) {
            this.ctx.fillStyle = 'rgba(255,0,0, 0.2)';
            this.ctx.fillRect(c * e, r * e, e, e);
        }
    };
    return Game;
})();
var Pc = (function () {
    function Pc(id, row, col) {
        this.id = id;
        this.org = { row: row, col: col };
        this.home = true;
    }
    Pc.prototype.check = function (row, col) {
        this.home = this.org.row == row && this.org.col == col;
        return this.home;
    };
    return Pc;
})();
var Board = (function () {
    function Board(size) {
        this.size = size;
    }
    Board.prototype.create = function () {
        this.nodes = [];
        var count = 1;
        for (var index = 0; index < this.size; index++) {
            var row = [];
            for (var r = 0; r < this.size; r++) {
                var p = new Pc(count++, index, r);
                row.push(p);
            }
            this.nodes.push(row);
        }
        var e = this.size - 1;
        this.nodes[e][e] = null;
        this.empty = { row: e, col: e };
        return this;
    };
    Board.prototype.shuffle = function () {
        var times = this.size * this.size * 20;
        var max = this.size - 1;
        for (var index = 0; index < times; index++) {
            if (Math.random() < 0.5) {
                this.move(this.empty.row, Math.round(Math.random() * max));
            }
            else {
                this.move(Math.round(Math.random() * max), this.empty.col);
            }
        }
        this.move(this.size - 1, this.empty.col);
        this.move(this.size - 1, this.size - 1);
        return this;
    };
    Board.prototype.move = function (row, col) {
        if (row < 0 || col < 0 || row >= this.size || col >= this.size) {
            return false;
        }
        if (this.empty.row == row && this.empty.col != col) {
            var items = this.nodes[row];
            if (col > this.empty.col) {
                // move left
                for (var index = this.empty.col; index < col; index++) {
                    items[index] = items[index + 1];
                }
            }
            else {
                // move right
                for (var index = this.empty.col - 1; index >= col; index--) {
                    items[index + 1] = items[index];
                }
            }
            items[col] = null;
            this.empty.col = col;
            items.forEach(function (p, i) { if (p)
                p.check(row, i); });
        }
        else if (this.empty.col == col && this.empty.row != row) {
            if (row > this.empty.row) {
                // move top
                for (var index = this.empty.row; index < row; index++) {
                    this.nodes[index][col] = this.nodes[index + 1][col];
                }
            }
            else {
                // move bottom
                for (var index = this.empty.row; index > row; index--) {
                    this.nodes[index][col] = this.nodes[index - 1][col];
                }
            }
            this.nodes[row][col] = null;
            this.empty.row = row;
            for (var i = 0; i < this.size; i++) {
                var p = this.nodes[i][col];
                if (p)
                    p.check(i, col);
            }
        }
        else {
            return false;
        }
        return true;
    };
    Board.prototype.checkWin = function () {
        return this.empty.row == this.size - 1 &&
            this.empty.col == this.size - 1 &&
            this.nodes.every(function (row) { return row.every(function (x) { return x ? x.home : true; }); });
    };
    return Board;
})();
