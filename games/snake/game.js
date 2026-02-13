// 貪食蛇遊戲邏輯
document.addEventListener('DOMContentLoaded', function() {
    // 遊戲設定
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('high-score');
    const finalScoreElement = document.getElementById('final-score');
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const pauseScreen = document.getElementById('pause-screen');

    // 根據容器大小調整畫布
    const gameContainer = document.getElementById('game-container');
    const updateCanvasSize = () => {
        const containerWidth = gameContainer.clientWidth;
        const containerHeight = gameContainer.clientHeight;
        const size = Math.min(containerWidth, containerHeight);
        canvas.width = size;
        canvas.height = size;
    };

    // 初始調整畫布大小
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const gridSize = 20; // 網格大小
    let tileCount; // 每行/列的格子數 (根據畫布大小計算)
    
    let score = 0;
    let highScore = localStorage.getItem('snakeHighScore') || 0;
    highScoreElement.textContent = highScore;

    let velocityX = 0;
    let velocityY = 0;
    let snake = [];
    let food = { x: 5, y: 5 };
    let gameInterval;
    let isGameRunning = false;
    let isPaused = false;
    let speed = 150; // 初始速度
    let nextVelocityX = 0;
    let nextVelocityY = 0;

    // 計算 tileCount
    const calculateTileCount = () => {
        tileCount = Math.floor(canvas.width / gridSize);
    };

    // 初始化遊戲
    function initGame() {
        calculateTileCount();
        snake = [
            { x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2) },
            { x: Math.floor(tileCount / 2) - 1, y: Math.floor(tileCount / 2) },
            { x: Math.floor(tileCount / 2) - 2, y: Math.floor(tileCount / 2) }
        ];
        score = 0;
        speed = 150;
        velocityX = 1; // 初始向右移動
        velocityY = 0;
        nextVelocityX = 1;
        nextVelocityY = 0;
        scoreElement.textContent = score;
        placeFood();
    }

    // 開始遊戲
    function startGame() {
        initGame();
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        pauseScreen.classList.add('hidden');
        isGameRunning = true;
        isPaused = false;
        
        if (gameInterval) clearInterval(gameInterval);
        gameLoop();
    }

    // 遊戲主迴圈
    function gameLoop() {
        if (!isGameRunning) return;

        update();
        draw();
        
        // 根據速度調整計時器
        if (gameInterval) clearTimeout(gameInterval);
        gameInterval = setTimeout(gameLoop, speed);
    }

    // 更新狀態
    function update() {
        if (isPaused) return;

        // 更新速度（防止同一幀內快速按兩次鍵導致反向撞死）
        velocityX = nextVelocityX;
        velocityY = nextVelocityY;

        // 計算新的頭部位置
        const head = { x: snake[0].x + velocityX, y: snake[0].y + velocityY };

        // 檢查碰撞（牆壁或身體）
        if (checkCollision(head)) {
            gameOver();
            return;
        }

        // 移動蛇：將新頭部加入陣列最前面
        snake.unshift(head);

        // 檢查是否吃到食物
        if (head.x === food.x && head.y === food.y) {
            score += 10;
            scoreElement.textContent = score;
            increaseSpeed();
            placeFood();
            // 吃到食物不移除尾巴，蛇變長
        } else {
            // 沒吃到食物，移除尾巴，維持長度
            snake.pop();
        }
    }

    // 繪圖
    function draw() {
        // 清除畫布
        ctx.fillStyle = '#16213e'; // 背景色
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 繪製食物
        ctx.fillStyle = '#4effef';
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#4effef";
        ctx.beginPath();
        ctx.arc(
            food.x * gridSize + gridSize / 2, 
            food.y * gridSize + gridSize / 2, 
            gridSize / 2 - 2, 
            0, 2 * Math.PI
        );
        ctx.fill();
        ctx.shadowBlur = 0; // 重置陰影

        // 繪製蛇
        snake.forEach((part, index) => {
            if (index === 0) {
                // 蛇頭
                ctx.fillStyle = '#e94560';
                ctx.shadowBlur = 10;
                ctx.shadowColor = "#e94560";
            } else {
                // 蛇身 (漸層色)
                const colorValue = Math.max(20, 255 - index * 10);
                ctx.fillStyle = `rgb(15, 52, ${colorValue})`;
                ctx.shadowBlur = 0;
            }

            ctx.fillRect(
                part.x * gridSize + 1, 
                part.y * gridSize + 1, 
                gridSize - 2, 
                gridSize - 2
            );
            
            // 繪製蛇眼睛 (僅在頭部)
            if (index === 0) {
                ctx.fillStyle = 'white';
                const eyeSize = Math.max(2, gridSize / 8);
                // 根據方向調整眼睛位置
                let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
                
                if (velocityX === 1) { // 向右
                    leftEyeX = part.x * gridSize + gridSize - eyeSize - 2;
                    leftEyeY = part.y * gridSize + gridSize / 3;
                    rightEyeX = part.x * gridSize + gridSize - eyeSize - 2;
                    rightEyeY = part.y * gridSize + 2 * gridSize / 3 - eyeSize;
                } else if (velocityX === -1) { // 向左
                    leftEyeX = part.x * gridSize + 2;
                    leftEyeY = part.y * gridSize + gridSize / 3;
                    rightEyeX = part.x * gridSize + 2;
                    rightEyeY = part.y * gridSize + 2 * gridSize / 3 - eyeSize;
                } else if (velocityY === 1) { // 向下
                    leftEyeX = part.x * gridSize + gridSize / 3;
                    leftEyeY = part.y * gridSize + gridSize - eyeSize - 2;
                    rightEyeX = part.x * gridSize + 2 * gridSize / 3 - eyeSize;
                    rightEyeY = part.y * gridSize + gridSize - eyeSize - 2;
                } else { // 向上
                    leftEyeX = part.x * gridSize + gridSize / 3;
                    leftEyeY = part.y * gridSize + 2;
                    rightEyeX = part.x * gridSize + 2 * gridSize / 3 - eyeSize;
                    rightEyeY = part.y * gridSize + 2;
                }
                
                ctx.fillRect(leftEyeX, leftEyeY, eyeSize, eyeSize);
                ctx.fillRect(rightEyeX, rightEyeY, eyeSize, eyeSize);
            }
        });
    }

    // 隨機放置食物
    function placeFood() {
        let validPosition = false;
        while (!validPosition) {
            food.x = Math.floor(Math.random() * tileCount);
            food.y = Math.floor(Math.random() * tileCount);

            // 確保食物不會生成在蛇身上
            validPosition = true;
            for (let part of snake) {
                if (part.x === food.x && part.y === food.y) {
                    validPosition = false;
                    break;
                }
            }
        }
    }

    // 碰撞檢測
    function checkCollision(head) {
        // 撞牆
        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
            return true;
        }
        // 撞自己 (從身體部分開始檢查)
        for (let i = 0; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                return true;
            }
        }
        return false;
    }

    // 遊戲結束
    function gameOver() {
        isGameRunning = false;
        finalScoreElement.textContent = score;
        
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('snakeHighScore', highScore);
            highScoreElement.textContent = highScore;
        }

        gameOverScreen.classList.remove('hidden');
    }

    // 增加速度 (難度)
    function increaseSpeed() {
        if (speed > 50) {
            speed -= 2; // 每次吃到食物減少 2ms 延遲
        }
    }

    // 暫停功能
    function togglePause() {
        if (!isGameRunning || gameOverScreen.classList.contains('hidden') === false) return;
        
        isPaused = !isPaused;
        if (isPaused) {
            pauseScreen.classList.remove('hidden');
        } else {
            pauseScreen.classList.add('hidden');
            // 立即執行一次更新以避免卡頓感
            gameLoop(); 
        }
    }

    // 鍵盤輸入處理
    document.addEventListener('keydown', (e) => {
        // 防止方向鍵滾動頁面
        if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].indexOf(e.code) > -1) {
            e.preventDefault();
        }

        if (e.code === 'Space') {
            togglePause();
            return;
        }

        if (!isGameRunning || isPaused) return;

        handleInput(e.key);
    });

    // 統一輸入處理 (鍵盤與虛擬按鍵)
    function handleInput(key) {
        // 邏輯：不能直接掉頭 (例如向右時不能直接向左)
        // 使用 nextVelocity 來緩衝輸入
        
        switch(key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                if (velocityY !== 1) {
                    nextVelocityX = 0;
                    nextVelocityY = -1;
                }
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                if (velocityY !== -1) {
                    nextVelocityX = 0;
                    nextVelocityY = 1;
                }
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                if (velocityX !== 1) {
                    nextVelocityX = -1;
                    nextVelocityY = 0;
                }
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                if (velocityX !== -1) {
                    nextVelocityX = 1;
                    nextVelocityY = 0;
                }
                break;
        }
    }

    // 處理手機虛擬按鈕
    function handleMobileInput(direction) {
        if (!isGameRunning) return;
        handleInput(direction);
    }

    // 頁面載入後先繪製一次背景
    calculateTileCount();
    draw();

    // 公開函數供 HTML 調用
    window.startGame = startGame;
    window.togglePause = togglePause;
    window.handleMobileInput = handleMobileInput;
});