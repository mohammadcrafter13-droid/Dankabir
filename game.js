"use strict";


/* =========================================================
   EITAA WEB APP
========================================================= */

const eitaa =
    window.Eitaa &&
    window.Eitaa.WebApp
        ? window.Eitaa.WebApp
        : null;


if (eitaa) {

    // اعلام آماده بودن Mini App
    eitaa.ready();

    // تلاش برای باز شدن در حالت بزرگ‌تر
    if (
        typeof eitaa.expand === "function"
    ) {
        try {
            eitaa.expand();
        } catch (error) {
            console.log(
                "Eitaa expand unavailable"
            );
        }
    }

    // هماهنگ کردن رنگ‌های اصلی با Theme ایتا
    try {

        eitaa.setHeaderColor(
            "bg_color"
        );

        eitaa.setBackgroundColor(
            "bg_color"
        );

    } catch (error) {

        console.log(
            "Theme API unavailable"
        );
    }
}


/* =========================================================
   DOM
========================================================= */

const canvas =
    document.getElementById(
        "gameCanvas"
    );

const ctx =
    canvas.getContext("2d");


const scoreElement =
    document.getElementById(
        "score"
    );

const highScoreElement =
    document.getElementById(
        "highScore"
    );

const welcomeElement =
    document.getElementById(
        "welcome"
    );

const statusElement =
    document.getElementById(
        "status"
    );

const overlay =
    document.getElementById(
        "gameOverlay"
    );

const overlayEmoji =
    document.getElementById(
        "overlayEmoji"
    );

const overlayTitle =
    document.getElementById(
        "overlayTitle"
    );

const overlayMessage =
    document.getElementById(
        "overlayMessage"
    );

const startButton =
    document.getElementById(
        "startButton"
    );

const backButton =
    document.getElementById(
        "backButton"
    );


/* =========================================================
   GAME SETTINGS
========================================================= */

const GRID_SIZE = 20;

const INITIAL_SPEED = 130;

const MIN_SPEED = 55;

const SPEED_STEP = 2;


/* =========================================================
   GAME STATE
========================================================= */

let snake = [];

let food = {
    x: 10,
    y: 10
};

let direction = {
    x: 1,
    y: 0
};

let nextDirection = {
    x: 1,
    y: 0
};

let score = 0;

let highScore =
    Number(
        localStorage.getItem(
            "snake_high_score"
        )
    ) || 0;

let gameRunning = false;

let gameOver = false;

let lastTime = 0;

let accumulator = 0;

let gameSpeed =
    INITIAL_SPEED;


/* =========================================================
   USER / START PARAM
========================================================= */

function getEitaaUser() {

    if (!eitaa) {
        return null;
    }

    if (
        eitaa.initDataUnsafe &&
        eitaa.initDataUnsafe.user
    ) {
        return eitaa.initDataUnsafe.user;
    }

    return null;
}


function getStartParam() {

    if (!eitaa) {
        return null;
    }

    return (
        eitaa.initDataUnsafe &&
        eitaa.initDataUnsafe.start_param
    ) || null;
}


const eitaaUser =
    getEitaaUser();


const startParam =
    getStartParam();


if (eitaaUser) {

    welcomeElement.textContent =
        `سلام ${eitaaUser.first_name || ""} 👋`;

} else {

    welcomeElement.textContent =
        "نسخه مرورگر";
}


if (startParam) {

    console.log(
        "Eitaa start_param:",
        startParam
    );
}


highScoreElement.textContent =
    highScore;


/* =========================================================
   CANVAS
========================================================= */

function resizeCanvas() {

    const rect =
        canvas.getBoundingClientRect();

    const size =
        Math.min(
            rect.width,
            rect.height
        );

    const dpr =
        window.devicePixelRatio || 1;

    canvas.width =
        Math.floor(
            size * dpr
        );

    canvas.height =
        Math.floor(
            size * dpr
        );

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );
}


window.addEventListener(
    "resize",
    resizeCanvas
);


resizeCanvas();


/* =========================================================
   GAME INITIALIZATION
========================================================= */

function resetGame() {

    snake = [

        {
            x: 10,
            y: 10
        },

        {
            x: 9,
            y: 10
        },

        {
            x: 8,
            y: 10
        }

    ];


    direction = {
        x: 1,
        y: 0
    };


    nextDirection = {
        x: 1,
        y: 0
    };


    score = 0;

    gameSpeed =
        INITIAL_SPEED;

    accumulator = 0;

    gameOver = false;

    updateScore();

    generateFood();
}


/* =========================================================
   START
========================================================= */

function startGame() {

    resetGame();

    gameRunning = true;

    overlay.style.display =
        "none";

    statusElement.textContent =
        "در حال بازی 🎮";

    lastTime =
        performance.now();

    requestAnimationFrame(
        gameLoop
    );

    hapticImpact("medium");
}


/* =========================================================
   GAME LOOP
========================================================= */

function gameLoop(timestamp) {

    if (!gameRunning) {
        return;
    }


    const delta =
        timestamp - lastTime;

    lastTime =
        timestamp;

    accumulator += delta;


    while (
        accumulator >= gameSpeed
    ) {

        update();

        accumulator -=
            gameSpeed;
    }


    draw();

    requestAnimationFrame(
        gameLoop
    );
}


/* =========================================================
   UPDATE
========================================================= */

function update() {

    direction =
        nextDirection;


    const head =
        snake[0];


    const newHead = {

        x:
            head.x +
            direction.x,

        y:
            head.y +
            direction.y

    };


    /* Wall collision */

    if (

        newHead.x < 0 ||

        newHead.x >= GRID_SIZE ||

        newHead.y < 0 ||

        newHead.y >= GRID_SIZE

    ) {

        endGame();

        return;
    }


    /* Body collision */

    for (
        let i = 0;
        i < snake.length;
        i++
    ) {

        if (

            newHead.x === snake[i].x &&

            newHead.y === snake[i].y

        ) {

            endGame();

            return;
        }
    }


    snake.unshift(
        newHead
    );


    /* Food */

    if (

        newHead.x === food.x &&

        newHead.y === food.y

    ) {

        score++;

        updateScore();

        generateFood();

        increaseSpeed();

        hapticImpact("light");

    } else {

        snake.pop();
    }
}


/* =========================================================
   DRAW
========================================================= */

function draw() {

    const rect =
        canvas.getBoundingClientRect();

    const width =
        rect.width;

    const height =
        rect.height;

    const cellWidth =
        width / GRID_SIZE;

    const cellHeight =
        height / GRID_SIZE;


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    drawBackground(
        width,
        height,
        cellWidth,
        cellHeight
    );


    drawFood(
        cellWidth,
        cellHeight
    );


    drawSnake(
        cellWidth,
        cellHeight
    );
}


/* =========================================================
   BACKGROUND
========================================================= */

function drawBackground(
    width,
    height,
    cellWidth,
    cellHeight
) {

    const styles =
        getComputedStyle(
            document.documentElement
        );


    const secondary =
        styles.getPropertyValue(
            "--secondary-bg"
        ).trim();


    ctx.fillStyle =
        secondary || "#eeeeee";


    ctx.fillRect(
        0,
        0,
        width,
        height
    );


    ctx.strokeStyle =
        "rgba(128,128,128,0.08)";


    ctx.lineWidth = 1;


    for (
        let x = 0;
        x <= GRID_SIZE;
        x++
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x * cellWidth,
            0
        );

        ctx.lineTo(
            x * cellWidth,
            height
        );

        ctx.stroke();
    }


    for (
        let y = 0;
        y <= GRID_SIZE;
        y++
    ) {

        ctx.beginPath();

        ctx.moveTo(
            0,
            y * cellHeight
        );

        ctx.lineTo(
            width,
            y * cellHeight
        );

        ctx.stroke();
    }
}


/* =========================================================
   FOOD
========================================================= */

function drawFood(
    cellWidth,
    cellHeight
) {

    const centerX =
        food.x * cellWidth +
        cellWidth / 2;

    const centerY =
        food.y * cellHeight +
        cellHeight / 2;

    const radius =
        Math.min(
            cellWidth,
            cellHeight
        ) * 0.34;


    ctx.beginPath();

    ctx.arc(
        centerX,
        centerY,
        radius,
        0,
        Math.PI * 2
    );


    ctx.fillStyle =
        "#e53935";


    ctx.fill();


    /* برگ سیب */

    ctx.fillStyle =
        "#43a047";


    ctx.beginPath();

    ctx.ellipse(
        centerX + radius * 0.55,
        centerY - radius * 0.65,
        radius * 0.4,
        radius * 0.2,
        -0.5,
        0,
        Math.PI * 2
    );

    ctx.fill();
}


/* =========================================================
   SNAKE
========================================================= */

function drawSnake(
    cellWidth,
    cellHeight
) {

    snake.forEach(
        (part, index) => {

            const padding =
                index === 0
                    ? 1
                    : 2;


            const x =
                part.x *
                cellWidth +
                padding;

            const y =
                part.y *
                cellHeight +
                padding;


            const width =
                cellWidth -
                padding * 2;

            const height =
                cellHeight -
                padding * 2;


            ctx.fillStyle =
                index === 0
                    ? "#2e7d32"
                    : "#43a047";


            roundRect(
                ctx,
                x,
                y,
                width,
                height,
                Math.min(
                    7,
                    width / 4
                )
            );


            ctx.fill();


            /* چشم‌های سر مار */

            if (
                index === 0
            ) {

                drawSnakeEyes(
                    part,
                    cellWidth,
                    cellHeight
                );
            }

        }
    );
}


/* =========================================================
   SNAKE EYES
========================================================= */

function drawSnakeEyes(
    part,
    cellWidth,
    cellHeight
) {

    const centerX =
        part.x *
        cellWidth +
        cellWidth / 2;

    const centerY =
        part.y *
        cellHeight +
        cellHeight / 2;


    ctx.fillStyle =
        "#ffffff";


    const eyeSize =
        Math.max(
            2,
            cellWidth * 0.11
        );


    const offset =
        cellWidth * 0.18;


    let eye1;
    let eye2;


    if (
        direction.x === 1
    ) {

        eye1 = {
            x: centerX + offset,
            y: centerY - offset
        };

        eye2 = {
            x: centerX + offset,
            y: centerY + offset
        };

    } else if (
        direction.x === -1
    ) {

        eye1 = {
            x: centerX - offset,
            y: centerY - offset
        };

        eye2 = {
            x: centerX - offset,
            y: centerY + offset
        };

    } else if (
        direction.y === -1
    ) {

        eye1 = {
            x: centerX - offset,
            y: centerY - offset
        };

        eye2 = {
            x: centerX + offset,
            y: centerY - offset
        };

    } else {

        eye1 = {
            x: centerX - offset,
            y: centerY + offset
        };

        eye2 = {
            x: centerX + offset,
            y: centerY + offset
        };
    }


    ctx.beginPath();

    ctx.arc(
        eye1.x,
        eye1.y,
        eyeSize,
        0,
        Math.PI * 2
    );

    ctx.arc(
        eye2.x,
        eye2.y,
        eyeSize,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.fillStyle =
        "#111111";


    ctx.beginPath();

    ctx.arc(
        eye1.x,
        eye1.y,
        eyeSize * 0.45,
        0,
        Math.PI * 2
    );

    ctx.arc(
        eye2.x,
        eye2.y,
        eyeSize * 0.45,
        0,
        Math.PI * 2
    );

    ctx.fill();
}


/* =========================================================
   ROUNDED RECT
========================================================= */

function roundRect(
    context,
    x,
    y,
    width,
    height,
    radius
) {

    context.beginPath();

    context.moveTo(
        x + radius,
        y
    );

    context.lineTo(
        x + width - radius,
        y
    );

    context.quadraticCurveTo(
        x + width,
        y,
        x + width,
        y + radius
    );

    context.lineTo(
        x + width,
        y + height - radius
    );

    context.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius,
        y + height
    );

    context.lineTo(
        x + radius,
        y + height
    );

    context.quadraticCurveTo(
        x,
        y + height,
        x,
        y + height - radius
    );

    context.lineTo(
        x,
        y + radius
    );

    context.quadraticCurveTo(
        x,
        y,
        x + radius,
        y

    );

    context.closePath();
}


/* =========================================================
   FOOD GENERATION
========================================================= */

function generateFood() {

    let validPosition =
        false;


    while (!validPosition) {

        food = {

            x:
                Math.floor(
                    Math.random() *
                    GRID_SIZE
                ),

            y:
                Math.floor(
                    Math.random() *
                    GRID_SIZE
                )

        };


        validPosition =
            !snake.some(
                part =>
                    part.x === food.x &&
                    part.y === food.y
            );
    }
}


/* =========================================================
   SCORE
========================================================= */

function updateScore() {

    scoreElement.textContent =
        score;


    if (
        score > highScore
    ) {

        highScore =
            score;

        highScoreElement.textContent =
            highScore;

        localStorage.setItem(
            "snake_high_score",
            String(highScore)
        );
    }
}


/* =========================================================
   SPEED
========================================================= */

function increaseSpeed() {

    gameSpeed =
        Math.max(
            MIN_SPEED,
            INITIAL_SPEED -
                score *
                SPEED_STEP
        );
}


/* =========================================================
   GAME OVER
========================================================= */

function endGame() {

    gameRunning = false;

    gameOver = true;

    statusElement.textContent =
        "باختی 😅";


    overlayEmoji.textContent =
        "💥";


    overlayTitle.textContent =
        "بازی تمام شد";


    overlayMessage.textContent =
        `امتیاز شما: ${score}`;


    startButton.textContent =
        "دوباره بازی کن";


    overlay.style.display =
        "flex";


    hapticNotification(
        "error"
    );
}


/* =========================================================
   DIRECTION
========================================================= */

function changeDirection(
    newDirection
) {

    if (!gameRunning) {
        return;
    }


    /* جلوگیری از برگشت مستقیم */

    if (

        newDirection.x ===
            -direction.x &&

        newDirection.y ===
            -direction.y

    ) {

        return;
    }


    nextDirection =
        newDirection;


    hapticSelection();
}


/* =========================================================
   KEYBOARD
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        switch (
            event.key.toLowerCase()
        ) {

            case "arrowup":
            case "w":

                changeDirection({
                    x: 0,
                    y: -1
                });

                break;


            case "arrowdown":
            case "s":

                changeDirection({
                    x: 0,
                    y: 1
                });

                break;


            case "arrowleft":
            case "a":

                changeDirection({
                    x: -1,
                    y: 0
                });

                break;


            case "arrowright":
            case "d":

                changeDirection({
                    x: 1,
                    y: 0
                });

                break;
        }
    }
);


/* =========================================================
   MOBILE BUTTONS
========================================================= */

document
    .querySelectorAll(
        ".control"
    )
    .forEach(
        button => {

            button.addEventListener(
                "pointerdown",
                event => {

                    event.preventDefault();

                    const dir =
                        button.dataset.direction;


                    if (
                        dir === "up"
                    ) {

                        changeDirection({
                            x: 0,
                            y: -1
                        });

                    } else if (
                        dir === "down"
                    ) {

                        changeDirection({
                            x: 0,
                            y: 1
                        });

                    } else if (
                        dir === "left"
                    ) {

                        changeDirection({
                            x: -1,
                            y: 0
                        });

                    } else if (
                        dir === "right"
                    ) {

                        changeDirection({
                            x: 1,
                            y: 0
                        });
                    }
                }
            );
        }
    );


/* =========================================================
   SWIPE CONTROL
========================================================= */

let touchStartX = 0;

let touchStartY = 0;


canvas.addEventListener(
    "touchstart",
    event => {

        const touch =
            event.changedTouches[0];


        touchStartX =
            touch.clientX;

        touchStartY =
            touch.clientY;

    },
    {
        passive: true
    }
);


canvas.addEventListener(
    "touchend",
    event => {

        const touch =
            event.changedTouches[0];


        const dx =
            touch.clientX -
            touchStartX;

        const dy =
            touch.clientY -
            touchStartY;


        const threshold = 25;


        if (
            Math.abs(dx) < threshold &&
            Math.abs(dy) < threshold
        ) {
            return;
        }


        if (
            Math.abs(dx) >
            Math.abs(dy)
        ) {

            if (dx > 0) {

                changeDirection({
                    x: 1,
                    y: 0
                });

            } else {

                changeDirection({
                    x: -1,
                    y: 0
                });
            }

        } else {

            if (dy > 0) {

                changeDirection({
                    x: 0,
                    y: 1
                });

            } else {

                changeDirection({
                    x: 0,
                    y: -1
                });
            }
        }

    },
    {
        passive: true
    }
);


/* =========================================================
   START BUTTON
========================================================= */

startButton.addEventListener(
    "click",
    startGame
);


/* =========================================================
   EITAA BACK BUTTON
========================================================= */

backButton.addEventListener(
    "click",
    () => {

        if (eitaa) {

            try {

                eitaa.close();

                return;

            } catch (error) {

                console.log(
                    "Eitaa close unavailable"
                );
            }
        }


        window.history.back();
    }
);


if (eitaa) {

    try {

        eitaa.BackButton.show();

        eitaa.BackButton.onClick(
            () => {

                eitaa.close();

            }
        );

    } catch (error) {

        console.log(
            "Eitaa BackButton unavailable"
        );
    }
}


/* =========================================================
   HAPTIC FEEDBACK
========================================================= */

function hapticImpact(
    style
) {

    if (
        !eitaa ||
        !eitaa.HapticFeedback
    ) {
        return;
    }


    try {

        eitaa.HapticFeedback
            .impactOccurred(style);

    } catch (error) {

        console.log(
            "Haptic unavailable"
        );
    }
}


function hapticNotification(
    type
) {

    if (
        !eitaa ||
        !eitaa.HapticFeedback
    ) {
        return;
    }


    try {

        eitaa.HapticFeedback
            .notificationOccurred(type);

    } catch (error) {

        console.log(
            "Haptic unavailable"
        );
    }
}


function hapticSelection() {

    if (
        !eitaa ||
        !eitaa.HapticFeedback
    ) {
        return;
    }


    try {

        eitaa.HapticFeedback
            .selectionChanged();

    } catch (error) {

        console.log(
            "Haptic unavailable"
        );
    }
}


/* =========================================================
   INITIAL DRAW
========================================================= */

resetGame();

draw();
