class Game {
    
    ctx:CanvasRenderingContext2D;
    size:number;
    board:Board;
    mousePos : { x : number, y : number };
    tileSize : number;
    hint: boolean;
    hasImage : boolean;
    imgData: HTMLImageElement;
    won : boolean;
    imgScale : { x : number, y : number, s : number};
    startTime : number = -1;
    elapsed : number = 0;
    timer : number = -1;
    playSound : boolean;
    clickAudio : HTMLAudioElement;
    winAudio : HTMLAudioElement;
    onTimer;    
    freeUp : Function;
    
    constructor(id:string, board:Board, size: number) {
        
        var canvas: HTMLCanvasElement = document.getElementById(id);
        canvas.width = canvas.height = size;
        this.size = size; 
        this.ctx = canvas.getContext('2d');
        this.board= board;
        this.mousePos = { x :0, y : 0};
        this.tileSize  = this.size / board.size;
        this.hint = false;
        this.won = false;
        this.hasImage = false;
        this.imgScale = { x : 1, y : 1, s : 1};
        
        var clickListener = e => {
            var canvasPos = canvas.getBoundingClientRect();
            let x = e.clientX - canvasPos.left; 
            let y = e.clientY - canvasPos.top;
            if(board.move(Math.floor(y / this.tileSize), Math.floor(x / this.tileSize))) {
                if(this.playSound && this.clickAudio) this.clickAudio.play();
            
                this.won = this.board.checkWin();
                if(this.won && this.timer != -1) {
                    if(this.playSound && this.winAudio) this.winAudio.play();
                    clearInterval(this.timer);
                    this.timer = -1;
                }
                
                requestAnimationFrame(x => this.draw());
            }
        };
        
        this.freeUp = () => {
            canvas.removeEventListener('click', clickListener);
            clearInterval(this.timer);
            this.onTimer = null;  
        };
        
        canvas.addEventListener('click', clickListener);
    }
    
    setImage(image:HTMLImageElement) : Game {
        this.hasImage = true;
        this.imgData = image;
        
        let scale = Math.min(image.naturalWidth, image.naturalHeight);
        
        this.imgScale.s = scale / this.size;
        this.imgScale.x = (image.naturalWidth - scale) / 2;
        this.imgScale.y = (image.naturalHeight - scale) / 2;
        return this;
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.size, this.size);
        
        this.ctx.lineWidth = 1;
        this.ctx.font = "32px serif";
        this.ctx.textBaseline = 'middle';
        this.ctx.textAlign = 'center';
        let e = this.tileSize;
                    
        this.ctx.fillStyle = '#EEEEEE';
        this.ctx.fillRect(this.board.empty.col * e , this.board.empty.row * e, e, e);
        this.ctx.fillRect(this.board.empty.col * e , this.board.empty.row * e, e, e);
        
        this.ctx.fillStyle = '#CDC7C7';
        this.ctx.fillRect(this.board.empty.col * e , this.board.empty.row * e, e, 4);
        this.ctx.fillRect(this.board.empty.col * e , this.board.empty.row * e, 4, e);
        
        var drawPc = this.hasImage ? this.drawPcImage : this.drawPcNumber;
        
        this.board.nodes.forEach((row, r) => {
            row.forEach((p, c) => {
                if(p) {
                    drawPc.call(this, p, r, c, e);
                }
            });
        });
    }
    
    startCountdown(onTimerCallback) : Game {
        this.startTime = new Date().getTime();
        this.elapsed = 0;
        this.onTimer = onTimerCallback;
        this.timer = setInterval(x => {
            this.elapsed = Math.floor((new Date().getTime() - this.startTime) / 1000);
            if(this.onTimer) this.onTimer(this.elapsed);
        }, 1000);
        
        return this;
    }
    
    setSound(clickAudio : HTMLAudioElement, winAudio : HTMLAudioElement) : Game {
        this.clickAudio = clickAudio;
        this.winAudio = winAudio;
        return this;
    }
    
    playSounds(play) : Game {
        this.playSound = play;
        return this;
    }
    
    showHint(hint:boolean) : Game {
        this.hint = hint;
        return this;
    }
    
    drawPcImage(p:Pc, r, c, e) {
        var t = e * this.imgScale.s;    
        this.ctx.drawImage(this.imgData,
            p.org.col * t + this.imgScale.x,
            p.org.row * t + this.imgScale.y,
            t,
            t,
            
            c * e,
            r * e,
            e,
            e
        );
        
        if(this.hint && !p.home) {
            this.ctx.fillStyle = 'black';
            this.ctx.fillText('' + p.id, c * e + e /2, r * e +  e / 2);
            this.ctx.fillStyle = 'rgba(255,0,0, 0.2)';
            this.ctx.fillRect(c * e, r * e, e, e);
        }
    }
    
    drawPcNumber(p:Pc, r, c, e) {
        this.ctx.fillStyle = this.won ? '#00F5A6' : 'white';
        this.ctx.strokeStyle = 'black';        
        this.ctx.fillRect(c * e, r * e, e, e);
        this.ctx.strokeRect(c * e, r * e, e, e);
        this.ctx.fillStyle = 'black';
        this.ctx.fillText('' + p.id, c * e + e /2, r * e +  e / 2);
        
        if(this.hint && !p.home) {
            this.ctx.fillStyle = 'rgba(255,0,0, 0.2)';
            this.ctx.fillRect(c * e, r * e, e, e);
        }
    }
    
} 

class Pc {
    id:number;
    org : { row : number, col: number};
    home: boolean;
        
    constructor(id : number, row: number, col:number) {
        this.id = id;
        this.org = { row : row, col: col};
        this.home = true;
    }
    
    check(row:number, col:number) {
        this.home = this.org.row == row && this.org.col == col;
        return this.home;
    }
}

class Board {
    size:number;
    nodes: Array<Array<Pc>>;
    empty : { row : number, col : number};
   
    
    constructor(size:number) {
        this.size = size;
    }
    
    create() : Board {
        this.nodes = [];
        var count = 1;
        for (var index = 0; index < this.size; index++) {
            var row = [];
            for (var r = 0; r < this.size; r++) {
                let p = new Pc(count++, index, r);
                row.push(p);
            }
            this.nodes.push(row);            
        }
        
        var e = this.size -1;
        
        this.nodes[e][e] = null;        
        this.empty = { row : e, col : e}; 
        return this;
    }
    
    
    shuffle() : Board {
        var times = this.size * this.size * 20;
        var max = this.size - 1;
        for (var index = 0; index < times; index++) {
            if(Math.random() < 0.5) {
                this.move(this.empty.row, Math.round(Math.random() * max));    
            } else {
                this.move(Math.round(Math.random() * max), this.empty.col);
            }
        }
        
        this.move(this.size-1, this.empty.col);
        this.move(this.size -1, this.size - 1);
        return this;
    }
    
    move(row: number, col: number) {
        if(row < 0 || col < 0 || row >= this.size || col >= this.size) {
            return false; 
        }
        
        if(this.empty.row == row && this.empty.col != col) {
            var items = this.nodes[row];
            
            if(col > this.empty.col) {
                // move left
                for(var index = this.empty.col ; index < col; index++) {
                    items[index] = items[index + 1];                    
                }
            } else {
                // move right
                for(var index = this.empty.col - 1 ; index >= col; index--) {
                    items[index+1] = items[index];
                }
            }
            
            items[col] = null;
            this.empty.col = col;
            items.forEach((p, i) => { if(p) p.check(row, i); });
        } else if(this.empty.col == col  && this.empty.row != row) {
            if(row > this.empty.row) {
                // move top
                for (var index = this.empty.row; index < row; index++) {
                    this.nodes[index][col] = this.nodes[index+1][col];                    
                }
            } else {
                // move bottom
                for (var index = this.empty.row; index > row; index--) {
                    this.nodes[index][col] = this.nodes[index-1][col];                    
                }
            }
            
            this.nodes[row][col] = null;
            this.empty.row = row;         
            
            for(var i= 0; i < this.size; i++) {
                var p = this.nodes[i][col];
                if(p) p.check(i, col);
            }       
        } else {
            return false;
        }
        
        return true;
    }
    
    checkWin() :boolean {
        return  this.empty.row == this.size -1 &&
                this.empty.col == this.size -1 &&
                this.nodes.every(row => row.every(x => x? x.home : true));
    }
}