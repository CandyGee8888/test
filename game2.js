// 俄羅斯方塊遊戲邏輯
document.addEventListener('DOMContentLoaded', function() {
    // 遊戲設定
    const BOARD_WIDTH = 10;
    const BOARD_HEIGHT = 20;
    const BLOCK_SIZE = 30;
    
    // 遊戲元素
    const gameBoard = document.getElementById('game-board');
    const nextPieceCanvas = document.getElementById('next-piece-canvas');
    const scoreElement = document.getElementById('score');
    const levelElement = document.getElementById('level');
    const linesElement = document.getElementById('lines');
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const pauseScreen = document.getElementById('pause-screen');
    
    // 設置畫布
    const ctx = gameBoard.getContext('2d');
    const nextCtx = nextPieceCanvas.getContext('2d');
    
    gameBoard.width = BOARD_WIDTH * BLOCK_SIZE;
    gameBoard.height = BOARD_HEIGHT * BLOCK_SIZE;
    nextPieceCanvas.width = 80;
    nextPieceCanvas.height = 80;
    
    // 遊戲狀態
    let board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
    let score = 0;
    let level = 1;
    let lines = 0;
    let gameInterval;
    let isGameRunning = false;
    let isPaused = false;
    let dropCounter = 0;
    let dropInterval = 1000; // 初始下落速度 (毫秒)
    
    // 當前方塊與下一個方塊
    let currentPiece = null;
    let nextPiece = null;
    
    // 方塊定義 (7種經典形狀)
    const PIECES = [
        // I
        {
            shape: [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            color: '#00f0f0'
        },
        // J
        {
            shape: [
                [1, 0, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: '#0000f0'
        },
        // L
        {
            shape: [
                [0, 0, 1],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: '#f0a000'
        },
        // O
        {
            shape: [
                [1, 1],
                [1, 1]
            ],
            color: '#f0f000'
        },
        // S
        {
            shape: [
                [0, 1, 1],
                [1, 1, 0],
                [0, 0, 0]
            ],
            color: '#00f000'
        },
        // T
        {
            shape: [
                [0, 1, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: '#a000f0'
        },
        // Z
        {
            shape: [
                [1, 1, 0],
                [0, 1, 1],
                [0, 0, 0]
            ],
            color: '#f00000'
        }
    ];
    
    // 生成隨機方塊
    function createPiece() {
        const pieceIndex = Math.floor(Math.random() * PIECES.length);
        return {
            shape: PIECES[pieceIndex].shape,
            color: PIECES[pieceIndex].color,
            x: Math.floor(BOARD_WIDTH / 2) - Math.floor(PIECES[pieceIndex].shape[0].length / 2),
            y: 0
        };
    }
    
    // 生成下一個方塊 (根據 PRD 需求)
    function generateNextPiece() {
        nextPiece = createPiece();
        drawNextPiece();
    }
    
    // 生成當前方塊 (根據 PRD 需求)
    function spawnPiece() {
        currentPiece = nextPiece || createPiece();
        generateNextPiece();
        
        // 檢查遊戲結束
        if (checkCollision(currentPiece.x, currentPiece.y, currentPiece.shape)) {
            gameOver();
            return false;
        }
        return true;
    }
    
    // 繪製下一個方塊預覽
    function drawNextPiece() {
        nextCtx.clearRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
        
        if (!nextPiece) return;
        
        const shape = nextPiece.shape;
        const color = nextPiece.color;
        const blockSize = 15;
        const offsetX = (nextPieceCanvas.width - shape[0].length * blockSize) / 2;
        const offsetY = (nextPieceCanvas.height - shape.length * blockSize) / 2;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    nextCtx.fillStyle = color;
                    nextCtx.fillRect(
                        offsetX + x * blockSize,
                        offsetY + y * blockSize,
                        blockSize - 1,
                        blockSize - 1
                    );
                    
                    nextCtx.strokeStyle = '#ffffff';
                    nextCtx.lineWidth = 1;
                    nextCtx.strokeRect(
                        offsetX + x * blockSize,
                        offsetY + y * blockSize,
                        blockSize - 1,
                        blockSize - 1
                    );
                }
            }
        }
    }
    
    // 繪製遊戲板
    function drawBoard() {
        ctx.clearRect(0, 0, gameBoard.width, gameBoard.height);
        
        // 繪製已固定的方塊
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                if (board[y][x]) {
                    ctx.fillStyle = board[y][x];
                    ctx.fillRect(
                        x * BLOCK_SIZE,
                        y * BLOCK_SIZE,
                        BLOCK_SIZE - 1,
                        BLOCK_SIZE - 1
                    );
                    
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(
                        x * BLOCK_SIZE,
                        y * BLOCK_SIZE,
                        BLOCK_SIZE - 1,
                        BLOCK_SIZE - 1
                    );
                }
            }
        }
        
        // 繪製當前方塊
        if (currentPiece) {
            drawPiece(currentPiece);
        }
        
        // 繪製網格線
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 0.5;
        
        // 垂直線
        for (let x = 0; x <= BOARD_WIDTH; x++) {
            ctx.beginPath();
            ctx.moveTo(x * BLOCK_SIZE, 0);
            ctx.lineTo(x * BLOCK_SIZE, gameBoard.height);
            ctx.stroke();
        }
        
        // 水平線
        for (let y = 0; y <= BOARD_HEIGHT; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * BLOCK_SIZE);
            ctx.lineTo(gameBoard.width, y * BLOCK_SIZE);
            ctx.stroke();
        }
    }
    
    // 繪製方塊
    function drawPiece(piece) {
        const { shape, color, x, y } = piece;
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    ctx.fillStyle = color;
                    ctx.fillRect(
                        (x + col) * BLOCK_SIZE,
                        (y + row) * BLOCK_SIZE,
                        BLOCK_SIZE - 1,
                        BLOCK_SIZE - 1
                    );
                    
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(
                        (x + col) * BLOCK_SIZE,
                        (y + row) * BLOCK_SIZE,
                        BLOCK_SIZE - 1,
                        BLOCK_SIZE - 1
                    );
                }
            }
        }
    }
    
    // 碰撞檢測
    function checkCollision(x, y, shape) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;
                    
                    if (
                        newX < 0 ||
                        newX >= BOARD_WIDTH ||
                        newY >= BOARD_HEIGHT ||
                        (newY >= 0 && board[newY][newX])
                    ) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    // 固化方塊到遊戲板
    function mergePiece() {
        const { shape, color, x, y } = currentPiece;
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const boardY = y + row;
                    if (boardY >= 0) {
                        board[boardY][x + col] = color;
                    }
                }
            }
        }
    }
    
    // 檢查並清除完整的行
    function clearLines() {
        let linesCleared = 0;
        
        for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
            if (board[y].every(cell => cell !== 0)) {
                // 移除該行
                board.splice(y, 1);
                // 在頂部添加新行
                board.unshift(Array(BOARD_WIDTH).fill(0));
                linesCleared++;
                y++; // 重新檢查同一位置（因為行下移了）
            }
        }
        
        if (linesCleared > 0) {
            // 更新分數
            const linePoints = [40, 100, 300, 1200]; // 1,2,3,4 行的分數
            score += linePoints[linesCleared - 1] * level;
            lines += linesCleared;
            
            // 每清除 10 行升一級
            level = Math.floor(lines / 10) + 1;
            
            // 更新速度
            dropInterval = Math.max(100, 1000 - (level - 1) * 100);
            
            updateStats();
        }
    }
    
    // 更新統計數據
    function updateStats() {
        scoreElement.textContent = score;
        levelElement.textContent = level;
        linesElement.textContent = lines;
    }
    
    // 移動方塊
    function movePiece(dx, dy) {
        if (!currentPiece || isPaused) return;
        
        if (!checkCollision(currentPiece.x + dx, currentPiece.y + dy, currentPiece.shape)) {
            currentPiece.x += dx;
            currentPiece.y += dy;
            drawBoard();
            return true;
        }
        
        // 如果是向下移動且碰撞，則固化方塊
        if (dy > 0) {
            mergePiece();
            clearLines();
            
            // 生成新方塊 (根據 PRD 需求：方塊落地後自動生成新方塊)
            if (!spawnPiece()) {
                return false;
            }
            drawBoard();
        }
        
        return false;
    }
    
    // 旋轉方塊
    function rotatePiece() {
        if (!currentPiece || isPaused) return;
        
        const originalShape = currentPiece.shape;
        const rows = originalShape.length;
        const cols = originalShape[0].length;
        
        // 創建旋轉後的形狀
        const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
        
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                rotated[x][rows - 1 - y] = originalShape[y][x];
            }
        }
        
        // 檢查旋轉後是否碰撞
        if (!checkCollision(currentPiece.x, currentPiece.y, rotated)) {
            currentPiece.shape = rotated;
            drawBoard();
        }
    }
    
    // 硬掉落 (直接落到底部)
    function hardDrop() {
        if (!currentPiece || isPaused) return;
        
        while (movePiece(0, 1)) {
            // 持續向下移動直到碰撞
        }
    }
    
    // 遊戲主循環
    function gameLoop(time) {
        if (!isGameRunning || isPaused) return;
        
        dropCounter += time;
        
        if (dropCounter > dropInterval) {
            movePiece(0, 1);
            dropCounter = 0;
        }
        
        drawBoard();
        requestAnimationFrame(gameLoop);
    }
    
    // 開始遊戲
    function startGame() {
        // 重置遊戲狀態
        board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
        score = 0;
        level = 1;
        lines = 0;
        dropInterval = 1000;
        updateStats();
        
        // 生成初始方塊
        generateNextPiece();
        spawnPiece();
        
        // 隱藏模態框
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        pauseScreen.classList.add('hidden');
        
        // 開始遊戲循環
        isGameRunning = true;
        isPaused = false;
        dropCounter = 0;
        
        drawBoard();
        requestAnimationFrame(gameLoop);
    }
    
    // 遊戲結束
    function gameOver() {
        isGameRunning = false;
        gameOverScreen.classList.remove('hidden');
    }
    
    // 暫停/繼續遊戲
    function togglePause() {
        if (!isGameRunning) return;
        
        isPaused = !isPaused;
        
        if (isPaused) {
            pauseScreen.classList.remove('hidden');
        } else {
            pauseScreen.classList.add('hidden');
            requestAnimationFrame(gameLoop);
        }
    }
    
    // 鍵盤控制
    document.addEventListener('keydown', (e) => {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.code)) {
            e.preventDefault();
        }
        
        if (!isGameRunning) return;
        
        switch(e.code) {
            case 'ArrowLeft':
                movePiece(-1, 0);
                break;
            case 'ArrowRight':
                movePiece(1, 0);
                break;
            case 'ArrowDown':
                movePiece(0, 1);
                break;
            case 'ArrowUp':
                rotatePiece();
                break;
            case 'Space':
                if (e.target.tagName !== 'BUTTON') {
                    hardDrop();
                }
                break;
            case 'KeyP':
            case 'Escape':
                togglePause();
                break;
        }
    });
    
    // 移動端控制
    window.handleMobileInput = function(action) {
        if (!isGameRunning || isPaused) return;
        
        switch(action) {
            case 'left':
                movePiece(-1, 0);
                break;
            case 'right':
                movePiece(1, 0);
                break;
            case 'down':
                movePiece(0, 1);
                break;
            case 'rotate':
                rotatePiece();
                break;
            case 'hardDrop':
                hardDrop();
                break;
            case 'pause':
                togglePause();
                break;
        }
    };
    
    // 初始化遊戲
    drawBoard();
    generateNextPiece();
    
    // 公開函數供 HTML 調用
    window.startGame = startGame;
    window.togglePause = togglePause;
});