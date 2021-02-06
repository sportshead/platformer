/// <reference path="global.d.ts"/>
/** @define {boolean} */
const DEBUG = true;

const LOG = DEBUG ? console.log : (() => { });

/**
 * @type {HTMLCanvasElement}
 */
const canvas = document.getElementById('main');
const ctx = canvas.getContext('2d');
const fpsDisplay = document.getElementById('fps');
const timer = document.getElementById('timer');

class Cutscene2D {
    /**
     * Creates a 2D Cutscene instance.
     * It is recommended to create a image to pass to this constructor and await the load of the image using promiseEventListener.
     * Otherwise the image may not have loaded properly and everything will break
     * @constructor
     * @param {String|HTMLImageElement} img Image object or string with image url
     * @param {String} text One or two lines of text. Seperate lines with `\n`
     * @memberof Cutscene2D
     */
    constructor(img, text) {
        if (img instanceof HTMLImageElement) {
            this.img = img;
        } else {
            const img_ = new Image();
            img_.src = img;
            this.img = img_;
        }
        this.text = text;
    }

    /**
     * Draws the cutscene
     * @param {CanvasRenderingContext2D} ctx
     * @memberof Cutscene2D
     */
    draw(ctx) {
        clearCanvas(ctx.canvas);

        ctx.drawImage(this.img, 0, 0);

        ctx.fillStyle = 'black';
        roundRect(ctx, 10, 400, canvas.width - 20, canvas.height - 410, 5, false, true);

        ctx.fillStyle = 'white';
        roundRect(ctx, 10, 400, canvas.width - 20, canvas.height - 410, 5, true, false);

        ctx.fillStyle = 'black';
        ctx.font = '20px PressStart2P';
        this.text.split("\n").forEach((v, i) => {
            if (i === 0) {
                ctx.fillText(v, 20, 440, canvas.width - 40);
            } else if (i === 1) {
                ctx.fillText(v, 20, 440 + 30, canvas.width - 40);
            }
        });
    }
}

class Particle2D {
    /**
     * Creates a 2D particle.
     * @constructor
     * @param {Number} x starting x coordinate of the particle.
     * @param {Number} y starting y coordinate of the particle.
     * @param {Number} direction angle of particle in radians
     * @param {Number} size size of the particle in pixels
     * @param {Number} speed speed in pixels per frame
     * @param {Number} lifespan lifespan of particle in ms
     * @param {String} [color] color of particle, default black
     * @memberof Particle2D
     */
    constructor(x, y, direction, size, speed, lifespan, color = "black") {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.size = size;
        this.speed = speed;
        this.birthtime = new Date().getTime();
        this.lifespan = lifespan;
        this.color = color;
        this.dead = false;
    }

    /**
     * Draw the particle
     * @param {CanvasRenderingContext2D} ctx
     * @memberof Particle2D
     */
    draw(ctx) {
        const now = new Date().getTime();
        if (this.dead || now - this.birthtime >= this.lifespan) {
            this.dead = true;
        } else {
            this.x += Math.cos(this.direction) * this.speed;
            this.y += Math.sin(this.direction) * this.speed;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.size, this.size, 0, 0, 2 * Math.PI, false);
            ctx.fill();
        }
    }
}

let gameStart = 0;
let levelStart = 0;
let elapsed = 0;
let frames = 0;

const floorHeight = 100;
let gpf = DEBUG ? 1 : 1;
let gravity = 0;
const speed = 5;

/**
 * @type {Point2D}
 */
const playerSize = { x: 50, y: 100 };

/**
 * @type {Point2D}
 */
const playerCoords = { x: 10, y: 5 };
let inAir = true;

const keysDown = [];
/**
 * @type {Particle2D[]}
 */
let particles = [];

/**
 * @type {Level[]}
 */
const levels = [{
    playerStart: { x: 10, y: 5 },
    playerStart0: { x: 10, y: 5 },
    cutScenes: [],
    goal: { x: 550, y: 250, width: 100, height: 50, radius: 5 },
    floors: [],
    lasers: [],
    checkpoints: [],
    checkpoints0: [],
    nextLevel: 1
}, {
    playerStart: { x: 10, y: 5 },
    playerStart0: { x: 10, y: 5 },
    cutScenes: [],
    goal: { x: 450, y: 125, width: 50, height: 75, radius: 5 },
    floors: [{ x: 160, y: 220, width: 380, height: 20 }, { x: 520, y: 0, width: 20, height: 220 }],
    lasers: [],
    checkpoints: [],
    checkpoints0: [],
    nextLevel: 2
}, {
    playerStart: { x: 10, y: 5 },
    playerStart0: { x: 10, y: 5 },
    cutScenes: [],
    goal: { x: 470, y: 280, width: 50, height: 100, radius: 5 },
    floors: [{ x: 150, y: 0, width: 20, height: 200 }, { x: 150, y: 310, width: 20, height: 200 }, { x: 440, y: 225, width: 20, height: 110 }, { x: 440, y: 225, width: 230, height: 20 }, { x: 270, y: 0, width: 20, height: 100 }, { x: 270, y: 215, width: 20, height: 200 }, { x: 340, y: 270, width: 100, height: 20 }, { x: 480, y: 100, width: 20, height: 130 }, { x: 550, y: 170, width: 20, height: 60 }, { x: 550, y: 0, width: 20, height: 80 }, { x: 620, y: 125, width: 20, height: 100 }, { x: 620, y: 0, width: 20, height: 30 }],
    lasers: [],
    checkpoints: [],
    checkpoints0: [],
    nextLevel: 3
}, {
    playerStart: { x: 10, y: 5 },
    playerStart0: { x: 10, y: 5 },
    cutScenes: [],
    goal: { x: 630, y: 110, width: 50, height: 50, radius: 5 },
    floors: [{ x: 440, y: 0, width: 20, height: 165 }, { x: 440, y: 285, width: 20, height: 400 }, { x: 180, y: 130, width: 100, height: 20 }, { x: 340, y: 330, width: 100, height: 20 }, { x: 90, y: 110, width: 20, height: 320 }],
    lasers: [{ x: 550, y: 0, width: 5, height: 300, radius: 5 }, { x: 360, y: 0, width: 5, height: 200, radius: 5 }, { x: 280, y: 360, width: 60, height: 5, radius: 5 }, { x: 270, y: 165, width: 5, height: 240, radius: 5 }, { x: 0, y: 395, width: 85, height: 5, radius: 5 }],
    checkpoints: [],
    checkpoints0: [],
    nextLevel: 4
}, {
    playerStart: { x: 10, y: 5 },
    playerStart0: { x: 10, y: 5 },
    cutScenes: [],
    goal: { x: 630, y: 110, width: 50, height: 50, radius: 5 },
    floors: [{ x: 210, y: 170, width: 100, height: 20 },],
    lasers: [{ x: 105, y: 0, width: 5, height: 110, radius: 5 }, { x: 105, y: 290, width: 5, height: 120, radius: 5 }, { x: 225, y: 0, width: 5, height: 60, radius: 5 }, { x: 220, y: 190, width: 5, height: 125, radius: 5 }, { x: 515, y: 0, width: 5, height: 290, radius: 5 }, { x: 250, y: 280, width: 165, height: 5, radius: 5 }, { x: 430, y: 85, width: 75, height: 5, radius: 5 },],
    checkpoints: [{ x: 150, y: 0, width: 10, height: 412, spawnPoint: { x: 120, y: 125 } }],
    checkpoints0: [{ x: 150, y: 0, width: 10, height: 412, spawnPoint: { x: 120, y: 125 } }],
    nextLevel: "end"
}];

// { x: 0, y: 0, width: 0, height: 0 },
// { x: 0, y: 0, width: 5, height: 0, radius: 5 },

const end = {
    /** @type {Cutscene2D[]} */ cutScenes: []
}
let level = DEBUG ? 4 : 0;
let cutscene = 0;
let clicked = false;

let die = false;

let clicktping;
if (DEBUG) {
    clicktping = false;
    Object.defineProperty(window, "kill", {
        get: () => {
            return die = true;
        },
        set: (v) => {
            return null;
        }
    });
    window.tp = (x, y) => {
        playerCoords.x = x;
        playerCoords.y = y;
    }
    Object.defineProperty(window, "clicktp", {
        get: () => {
            return clicktping = !clicktping;
        },
        set: (v) => {
            clicktping = v;
            return null;
        }
    });
    Object.defineProperty(window, "clicktp1", {
        get: () => {
            promiseEventListener(canvas, "mousedown").then(e => {
                window.tp(e.x, e.y);
            });
            return true;
        },
        set: (v) => {
            return null;
        }
    });
    Object.defineProperty(window, "skip", {
        get: () => {
            LOG("goal hit");
            level = levels[level].nextLevel;
            if (level !== "end") {
                playerCoords.x = levels[level].playerStart.x;
                playerCoords.y = levels[level].playerStart.y;
            }
            cutscene = 0;
            return level;
        },
        set: (v) => {
            return null;
        }
    });
    Object.defineProperty(window, "noGrav", {
        get: () => {
            gravity = 0;
            return gpf = gpf ? 0 : 1;
        },
        set: (v) => {
            gravity = 0;
            return gpf = v ? 1 : 0;
        }
    });
}

async function main() {
    const pressStart = new FontFace('PressStart2P', 'url("https://fonts.gstatic.com/s/pressstart2p/v8/e3t4euO8T-267oIAQAu6jDQyK3nVivNm4I81.woff2")');

    document.fonts.add(await pressStart.load());
    LOG('font loaded');

    await loadCutscenes();

    if (DEBUG) {
        canvas.addEventListener('mousedown', e => {
            LOG(`(${e.x},${e.y})`);
            if (clicktping) {
                window.tp(e.x, e.y);
            }
        });
    }

    await mainMenu();
}

async function mainMenu() {
    clearCanvas(ctx.canvas);
    ctx.fillStyle = 'blue';
    roundRect(ctx, 235, 175, 250, 100, 10, true, false);
    roundRect(ctx, 200, 300, 320, 100, 10, true, false);

    ctx.fillStyle = 'black';
    ctx.font = '55px PressStart2P';
    ctx.fillText('PLATFORMER', 80, 100);
    ctx.font = '50px PressStart2P';
    ctx.fillText('PLAY', 260, 250);
    ctx.font = '40px PressStart2P';
    ctx.fillText('OPTIONS', 220, 375);

    const pressed = await (new Promise((res, rej) => {
        canvas.addEventListener('click', function (e) {
            if (e.x >= 235 && e.x <= 235 + 250 && e.y >= 175 && e.y <= 175 + 100) {
                res('play');
            } else if (e.x >= 200 && e.x <= 200 + 320 && e.y >= 300 && e.y <= 300 + 100) {
                res('options');
            }
        });
    }));

    LOG(`pressed ${pressed}`)

    if (pressed === 'play') {
        await game();
    } else if (pressed === 'options') {
        await optionsMenu();
    } else {
        throw new TypeError('Unknown menu');
    }
}

/**
 * @enum {number}
 */
const GameMode = {
    NORMAL: 0,
    HARD: 1,
    HARDCORE: 2
};

/**
 * @type {PlatformerOptions}
 */
const options = {
    gameMode: DEBUG ? GameMode.HARDCORE : GameMode.NORMAL
};

async function optionsMenu() {
    clearCanvas(ctx.canvas);
    ctx.font = '50px PressStart2P';
    ctx.fillText('OPTIONS', 200, 100);

    //#region mode
    ctx.font = '30px PressStart2P';
    ctx.fillText('MODE:', 100, 200);

    ctx.fillStyle = options.gameMode === GameMode.NORMAL ? 'yellow' : (options.gameMode === GameMode.HARD) ? 'orange' : 'red';
    roundRect(ctx, 275, 150, 325, 65, 10, true, false);

    ctx.fillStyle = 'black';
    ctx.fillText(options.gameMode === GameMode.NORMAL ? 'NORMAL' : (options.gameMode === GameMode.HARD) ? 'HARD' : 'HARDCORE', 300, 200, 300);

    ctx.font = '13px PressStart2P'
    ctx.fillText('HARD: No checkpoints', 100, 240, 240);
    ctx.fillText('HARDCORE: No checkpoints, one life only', 100, 260, 460);
    //#endregion

    //#region back
    ctx.font = '40px PressStart2P';
    ctx.fillStyle = 'blue';
    roundRect(ctx, 280, 400, 200, 75, 5, true, false);

    ctx.fillStyle = 'black';
    ctx.fillText('BACK', 300, 460);
    //#endregion

    const e = await promiseEventListener(canvas, 'click');

    if (e.x >= 275 - 5 && e.y >= 150 - 5 && e.x <= 275 + 325 + 5 && e.y <= 150 + 65 + 5) {
        options.gameMode++;
        options.gameMode %= GameMode.HARDCORE + 1;
        LOG(options.gameMode);
    } else if (e.x >= 280 - 5 && e.y >= 400 - 5 && e.x <= 280 + 200 + 5 && e.y <= 400 + 75 + 5) {
        LOG('pressed back');
        return await mainMenu();
    }
    await optionsMenu();
}

/**
 * @type {CanvasPattern | null}
 */
let checkpointPattern;

async function loadCutscenes() {
    const checkpoint = new Image();
    checkpoint.src = "https://i.imgur.com/JkdBYPQ.png";
    await promiseEventListener(checkpoint, "load");
    LOG("checkpoint loaded");

    checkpointPattern = ctx.createPattern(checkpoint, "repeat");

    const cowboy = new Image();
    cowboy.src = "https://i.imgur.com/oUhfNPH.png";
    await promiseEventListener(cowboy, "load");
    LOG("cowboy loaded");

    levels[0].cutScenes[0] = new Cutscene2D(cowboy, "MUAHAHAHAHA!! You are now my prisoner!\nYou will NEVER escape! (Click to continue)")


    const directions = new Image();
    directions.src = "https://i.imgur.com/f9BT7uQ.png";
    await promiseEventListener(directions, "load");
    LOG("directions loaded");

    levels[0].cutScenes[1] = new Cutscene2D(directions, "Use the arrow keys or WASD to move.\nUse the spacebar to jump.")

    const startFrame = new Image();
    startFrame.src = "https://i.imgur.com/CWLzxMX.png";
    await promiseEventListener(startFrame, "load");
    LOG("startFrame loaded");

    levels[0].cutScenes[2] = new Cutscene2D(startFrame, "Control the red character to get to the green goal!")

    const portal = new Image();
    portal.src = "https://i.imgur.com/FOatu5m.png";
    await promiseEventListener(portal, "load");
    LOG("portal loaded");

    levels[1].cutScenes[0] = new Cutscene2D(portal, "You made it! We're in the goal portal right now. Since the cowboy has\na deep network of levels, you'll need to beat the next levels to escape.")

    const laserFrame = new Image();
    laserFrame.src = "https://i.imgur.com/azIlVBA.png";
    await promiseEventListener(laserFrame, "load");
    LOG("laserFrame loaded");

    levels[3].cutScenes[0] = new Cutscene2D(laserFrame, "Careful, this level has lasers! If you touch any\nof the lasers, you'll have to restart the level.")

    const checkpointFrame = new Image();
    checkpointFrame.src = "https://i.imgur.com/JyYlbTS.png";
    await promiseEventListener(checkpointFrame, "load");
    LOG("checkpointFrame loaded");

    levels[4].cutScenes[0] = new Cutscene2D(checkpointFrame, "Woah, this one's hard! I've installed\na checkpoint for you in case you die!")

    const gameOver = new Image();
    gameOver.src = "https://i.imgur.com/xXJm5Zi.png";
    await promiseEventListener(gameOver, "load");
    LOG("gameOver loaded");

    end.cutScenes[0] = new Cutscene2D(gameOver, "You successfully escaped the evil cowboy's base!\nReload the page or continue to play again.")
}

async function game() {
    if (options.gameMode >= GameMode.HARD) {
        levels.forEach((v, i) => {
            levels[i].checkpoints = [];
        });
        levels[4].cutScenes = [];
    }
    document.body.addEventListener('keydown', function (e) {
        if (e.repeat) { return }
        if (!keysDown.includes(e.code)) {
            keysDown.push(e.code);
        } else {
            DEBUG && console.warn(`Duplicate key '${e.code}'!`);
        }
    });
    document.body.addEventListener('keyup', function (e) {
        const index = keysDown.indexOf(e.code);
        if (index !== -1) {
            keysDown.splice(index, 1);
        } else {
            DEBUG && console.warn(`Missing key '${e.code}'!`);
        }
    });
    gameStart = new Date().getTime();
    frames = 0;
    window.requestAnimationFrame(draw);
}

let gameOverReloaded = false;
function gameOver() {
    clearCanvas(canvas);

    ctx.fillStyle = 'black';
    ctx.font = '50px PressStart2P';
    ctx.fillText('GAME OVER', 130, 115);

    ctx.font = '30px PressStart2P';
    ctx.fillText('YOU DIED!', 240, 170);

    ctx.font = '20px PressStart2P';
    ctx.fillStyle = 'green';
    ctx.fillText(`LEVELS COMPLETED: ${level}/${levels.length}`, 175, 220);

    ctx.font = '30px PressStart2P';
    ctx.fillStyle = 'blue';
    roundRect(ctx, 200, 285, 340, 80, 10, true, false);

    ctx.fillStyle = 'black';
    ctx.fillText('PLAY AGAIN', 220, 340);

    promiseEventListener(canvas, 'click').then(e => {
        if (!gameOverReloaded) {
            if (e.x >= 200 - 5 && e.y >= 285 - 5 && e.x <= 200 + 340 + 5 && e.y <= 285 + 80 + 5) {
                gameOverReloaded = true;
                window.location.reload();
                return;
            }
            gameOver();
        }
    });
}

function draw(timeNow) {
    if (gameStart === 0) {
        gameStart = timeNow;
    }

    if (keysDown.includes("KeyR")) {
        keysDown.splice(keysDown.indexOf("KeyR"), 1);
        die = true;
    }

    if (DEBUG) {
        if (keysDown.includes("Backspace")) {
            keysDown.splice(keysDown.indexOf("Backspace"), 1);
            window.skip;
        }
        if (keysDown.includes("KeyC")) {
            keysDown.splice(keysDown.indexOf("KeyC"), 1);
            window.clicktp;
        }
        if (keysDown.includes("KeyG")) {
            keysDown.splice(keysDown.indexOf("KeyG"), 1);
            window.noGrav;
        }
    }

    clearCanvas(ctx.canvas);

    if (die) {
        const currentLevel = levels[level];
        LOG("dead");
        let laser = {
            x: playerCoords.x,
            y: playerCoords.y,
            width: playerSize.x,
            height: playerSize.y
        };
        ["Space", "KeyW", "ArrowUp", "KeyS"].forEach(key => {
            if (keysDown.includes(key)) {
                keysDown.splice(keysDown.indexOf(key), 1);
            }
        });
        let i = 0;
        const vertical = laser.height > laser.width;
        const spawnX = vertical ? laser.x + (laser.width / 2) : playerCoords.x + (playerSize.x / 2);
        const spawnY = !vertical ? laser.y + (laser.height / 2) : playerCoords.y + (playerSize.y / 2);
        while (i < 100) {
            const direction = Math.random() * 2 * Math.PI;
            const size = Math.floor(Math.random() * 3) + 1;
            const speed = Math.random() + 0.2;
            const lifespan0 = Math.floor(Math.random() * (600 - speed * 100));
            const lifespan = lifespan0 + 500;
            const r = 0 + Math.floor(Math.random() * 3);
            const g = 0 + Math.floor(Math.random() * 3);
            const b = 255 - Math.floor(Math.random() * 3);
            particles.push(new Particle2D(spawnX, spawnY, direction, size, speed, lifespan, `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`))
            i++;
        }
        currentLevel.playerStart = currentLevel.playerStart0;
        playerCoords.x = currentLevel.playerStart.x;
        playerCoords.y = currentLevel.playerStart.y;
        die = false;
        levelStart = timeNow;
        if (options.gameMode < GameMode.HARD) {
            currentLevel.checkpoints = currentLevel.checkpoints0;
        }
    }


    if (clicked) {
        clicked = false;
        cutscene++;
    }

    const currentLevel = level === "end" ? end : levels[level];
    const inCutscene = cutscene <= currentLevel.cutScenes.length - 1;

    if (level === "end") {
        if (inCutscene) {
            end.cutScenes[cutscene].draw(ctx);
            if (!clicked) {
                promiseEventListener(canvas, "click").then(() => {
                    clicked = true;
                });
            }
        } else {
            return window.location.reload();
        }
    } else {
        if (inCutscene) {
            currentLevel.cutScenes[cutscene].draw(ctx);
            if (!clicked) {
                promiseEventListener(canvas, "click").then(() => {
                    clicked = true;
                });
            }
        } else {
            if (levelStart === 0) {
                levelStart = timeNow;
            }
            //#region floor
            ctx.fillStyle = 'black';
            ctx.fillRect(0, canvas.height - floorHeight, canvas.width, floorHeight);
            //#endregion

            //#region floors
            currentLevel.floors.forEach(floor => {
                ctx.fillRect(floor.x, floor.y, floor.width, floor.height);
            });
            //#endregion

            //#region particles
            particles = particles.filter(particle => !particle.dead);
            particles.forEach(/** @type {Particle2D} */ particle => particle.draw(ctx));
            //#endregion

            //#region lasers
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#0A00FD';
            ctx.fillStyle = 'blue';
            let hardcore = false;
            currentLevel.lasers.forEach(laser => {
                roundRect(ctx, laser.x, laser.y, laser.width, laser.height, laser.radius, true, false)
                if (detectRectCollision({
                    x: playerCoords.x,
                    y: playerCoords.y,
                    width: playerSize.x,
                    height: playerSize.y
                }, laser)) {
                    LOG("dead");
                    if (options.gameMode === GameMode.HARDCORE) {
                        hardcore = true;
                        return;
                    }
                    ["Space", "KeyW", "ArrowUp", "KeyS"].forEach(key => {
                        if (keysDown.includes(key)) {
                            keysDown.splice(keysDown.indexOf(key), 1);
                        }
                    });
                    let i = 0;
                    const vertical = laser.height > laser.width;
                    const spawnX = vertical ? laser.x + (laser.width / 2) : playerCoords.x + (playerSize.x / 2);
                    const spawnY = !vertical ? laser.y + (laser.height / 2) : playerCoords.y + (playerSize.y / 2);
                    while (i < 100) {
                        const direction = Math.random() * 2 * Math.PI;
                        const size = Math.floor(Math.random() * 3) + 1;
                        const speed = Math.random() + 0.2;
                        const lifespan0 = Math.floor(Math.random() * (600 - speed * 100));
                        const lifespan = lifespan0 + 500;
                        const r = 0 + Math.floor(Math.random() * 3);
                        const g = 0 + Math.floor(Math.random() * 3);
                        const b = 255 - Math.floor(Math.random() * 3);
                        particles.push(new Particle2D(spawnX, spawnY, direction, size, speed, lifespan, `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`))
                        i++;
                    }
                    playerCoords.x = currentLevel.playerStart.x;
                    playerCoords.y = currentLevel.playerStart.y;
                }
            });
            ctx.shadowBlur = 0;

            if (hardcore) {
                LOG('game over');
                return gameOver();
            }
            //#endregion

            //#region player
            const nextPos = { x: playerCoords.x, y: playerCoords.y };
            if (inAir && !(keysDown.some(e => ["KeyW", "ArrowUp", "Space"].includes(e)))) {
                //debugger;
                gravity += gpf;
                if (gravity > 10) {
                    gravity = 10;
                }
                nextPos.y = playerCoords.y + gravity;
            }


            keysDown.forEach(key => {
                switch (key) {
                    case "KeyW":
                    case "ArrowUp":
                    case "Space":
                        nextPos.y -= 15;
                        break;
                    case "KeyA":
                    case "ArrowLeft":
                        nextPos.x -= speed;
                        break;
                    case "KeyS":
                    case "ArrowDown":
                        nextPos.y += speed;
                        break;
                    case "KeyD":
                    case "ArrowRight":
                        nextPos.x += speed;
                        break;
                }
            });

            if (nextPos.y < 0) {
                nextPos.y = 0;
            }
            if (nextPos.y + playerSize.y > canvas.height) {
                nextPos.y = canvas.height - playerSize.y;
            }
            if (nextPos.x < 0) {
                nextPos.x = 0;
            }
            if (nextPos.x + playerSize.x > canvas.width) {
                nextPos.x = canvas.width - playerSize.x;
            }

            const nextBottomCoord = nextPos.y + playerSize.y;

            if (nextBottomCoord - 5 >= canvas.height - floorHeight) {
                //LOG('in floor');
                nextPos.y = canvas.height - floorHeight - playerSize.y;
                inAir = false;
                gravity = 0;
            }

            currentLevel.floors.forEach(floor => {
                /* if (detectRectCollision({ x: nextPos.x, y: nextPos.y, width: playerSize.x, height: playerSize.y }, floor)) {
                    LOG('in floor');
                    nextPos.y = canvas.height - floor.height;
                    inAir = false;
                    gravity = 0;
                } */
                const xColliding = detectXCollision({ x: nextPos.x, y: nextPos.y, width: playerSize.x, height: playerSize.y }, floor, -speed);
                const yColliding = detectYCollision({ x: nextPos.x, y: nextPos.y, width: playerSize.x, height: playerSize.y }, floor, -speed - 10);
                //const xCenter = nextPos.x + (playerSize.x / 2);

                if (nextPos.y + playerSize.y + 2 >= floor.y && nextPos.y + playerSize.y <= floor.y + (floor.height / 2) && xColliding) {
                    //LOG("top");
                    nextPos.y = floor.y - playerSize.y;
                } else if (nextPos.y - 2 <= floor.y + floor.height && nextPos.y + playerSize.y >= floor.y + (floor.height / 2) && xColliding) {
                    //LOG("bottom");
                    nextPos.y = floor.y + floor.height;
                } else if (nextPos.x + playerSize.x + 2 >= floor.x && nextPos.x + playerSize.x <= floor.x + (floor.width / 2) && yColliding) {
                    //LOG("left");
                    nextPos.x = floor.x - playerSize.x;
                } else if (nextPos.x - 2 <= floor.x + floor.width && nextPos.x >= floor.x + (floor.width / 2) && yColliding) {
                    //LOG("right");
                    nextPos.x = floor.x + floor.width;
                }
            });

            if (nextBottomCoord + 5 <= canvas.height - floorHeight) {
                //LOG('floating');
                inAir = true;
            }

            ctx.fillStyle = 'red';
            ctx.fillRect(nextPos.x, nextPos.y, playerSize.x, playerSize.y);

            playerCoords.x = nextPos.x;
            playerCoords.y = nextPos.y;
            //#endregion

            //#region checkpoints
            currentLevel.checkpoints = currentLevel.checkpoints.map((checkpoint, index) => {
                ctx.fillStyle = checkpointPattern;
                ctx.fillRect(checkpoint.x, checkpoint.y, checkpoint.width, checkpoint.height);
                if (detectRectCollision({
                    x: playerCoords.x,
                    y: playerCoords.y,
                    width: playerSize.x,
                    height: playerSize.y
                }, checkpoint, -5)) {
                    LOG(`checkpoint #${index} hit`);
                    currentLevel.playerStart = checkpoint.spawnPoint;
                    return null;
                }
                return checkpoint;
            }).filter(v => !!v);
            //#endregion

            //#region goal
            ctx.fillStyle = 'green';
            roundRect(ctx, currentLevel.goal.x, currentLevel.goal.y, currentLevel.goal.width, currentLevel.goal.height, currentLevel.goal.radius, true, false);

            if (detectRectCollision({
                x: playerCoords.x,
                y: playerCoords.y,
                width: playerSize.x,
                height: playerSize.y
            }, currentLevel.goal, -5)) {
                LOG("goal hit");
                level = currentLevel.nextLevel;
                if (level !== "end") {
                    playerCoords.x = levels[level].playerStart.x;
                    playerCoords.y = levels[level].playerStart.y;
                }
                cutscene = 0;
                elapsed += timeNow - levelStart;
                levelStart = 0;
            }

            //#endregion
        }
    }

    frames++;
    fpsDisplay.innerHTML = Math.round(frames / ((timeNow - gameStart) / 1000) * 100) / 100;
    const totalElapsed = elapsed + (inCutscene ? 0 : (timeNow - levelStart));
    timer.innerHTML = parseTime(totalElapsed);
    window.requestAnimationFrame(draw);
}

main().catch(console.error);

/**
 * Clears the canvas
 * @param {HTMLCanvasElement} canvas The canvas to clear
 */
function clearCanvas(canvas) {
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Draws a rounded rectangle using the current state of the canvas.
 * If you omit the last three params, it will draw a rectangle
 * outline with a 5 pixel border radius
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} width The width of the rectangle
 * @param {Number} height The height of the rectangle
 * @param {Number} [radius = 5] The corner radius; It can also be an object
 *                 to specify different radii for corners
 * @param {Number} [radius.tl = 0] Top left
 * @param {Number} [radius.tr = 0] Top right
 * @param {Number} [radius.br = 0] Bottom right
 * @param {Number} [radius.bl = 0] Bottom left
 * @param {Boolean} [fill = false] Whether to fill the rectangle.
 * @param {Boolean} [stroke = true] Whether to stroke the rectangle.
 */
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke === 'undefined') {
        stroke = true;
    }
    if (typeof radius === 'undefined') {
        radius = 5;
    }
    if (typeof radius === 'number') {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
        var defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
        for (var side in defaultRadius) {
            radius[side] = radius[side] || defaultRadius[side];
        }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) {
        ctx.fill();
    }
    if (stroke) {
        ctx.stroke();
    }

}

/**
 * Detects if two rectangles are colliding.
 * @param {Rect2D} rect1 First rectangle
 * @param {Rect2D} rect2 Second rectangle
 * @param {Number} [margin] Margin for hitbox, can be negative
 * @returns {Boolean} Whether or not the rectangles are colliding.
 */
function detectRectCollision(rect1, rect2, margin = 0) {
    /* return rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y; */
    return detectXCollision(rect1, rect2, margin) && detectYCollision(rect1, rect2, margin);
}

/**
 * Detects if two rectangles are colliding on the x axis.
 * @param {Object} rect1 First rectangle
 * @param {Number} rect1.x x coordinate of rect1
 * @param {Number} rect1.width width of rect1
 * @param {Object} rect2 Second rectangle
 * @param {Number} rect2.x x coordinate of rect2
 * @param {Number} rect2.width width of rect2
 * @param {Number} [margin] Margin for hitbox, can be negative
 * @returns {Boolean} Whether or not the rectangles are colliding on the x axis.
 */
function detectXCollision(rect1, rect2, margin = 0) {
    return rect1.x - margin < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x - margin;
}

/**
 * Detects if two rectangles are colliding on the y axis.
 * @param {Object} rect1 First rectangle
 * @param {Number} rect1.y y coordinate of rect1
 * @param {Number} rect1.height height of rect1
 * @param {Object} rect2 Second rectangle
 * @param {Number} rect2.y y coordinate of rect2
 * @param {Number} rect2.height height of rect2
 * @param {Number} [margin] Margin for hitbox, can be negative
 * @returns {Boolean} Whether or not the rectangles are colliding on the y axis.
 */
function detectYCollision(rect1, rect2, margin = 0) {
    return rect1.y - margin < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y - margin;
}

/**
 * Listens for an event, then resolves a promise with the Event
 * @param {Eventable} obj Object to listen for event
 * @param {String} event Event name
 * @returns {Promise<Event>} Promise that resolves to event object
 */
function promiseEventListener(obj, event) {
    return new Promise((res, rej) => {
        obj.addEventListener(event, function (e) {
            res(e);
        });
    });
}

/**
 * Converts milliseconds to H:MM:SS:III.CCC (where H is hours, M is minutes, S is seconds, I is milliseconds, and C is microseconds)
 * @param {Number} time milliseconds
 * @returns {String} parsed time
 */
function parseTime(time) {
    const hours = Math.floor(time / 3600000);
    const minutes = Math.floor(time / 60000) % 60;
    const seconds = Math.floor(time / 1000) % 60;
    const ms = Math.floor(time % 1000);
    const micro = time - Math.floor(time);
    return `${hours.toString()}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${ms.toString().padStart(3, '0')}.${[...micro.toFixed(3)].splice(2).join('')}`;
}