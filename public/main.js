// public/main.js
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

let player;
let cursors;
let spacebar;
let wKey;
let keysCollected = 0;
let resumeInfoText;

const game = new Phaser.Game(config);

function preload() {
    this.load.image('player', 'assets/sprites/player.png');
    this.load.image('computer', 'assets/sprites/computer.png');
    this.load.image('server', 'assets/sprites/server.png');
    this.load.image('key', 'assets/sprites/key.png');
    this.load.image('background', 'assets/sprites/background.png');
    this.load.audio('bgm', 'assets/audio/background-music.mp3');
}

function create() {
    console.log('Создание сцены');

    // Добавление фона
    const background = this.add.image(0, 0, 'background')
        .setOrigin(0)
        .setDisplaySize(this.scale.width, this.scale.height)
        .setName('background');

    // Добавление игрока
    player = this.physics.add.sprite(this.scale.width / 2, this.scale.height - 150, 'player');
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);
    player.setScale(1);

    // Платформы
    const platforms = this.physics.add.staticGroup();
    platforms.create(this.scale.width / 2, this.scale.height - 50, 'computer')
        .setScale(3)
        .refreshBody();
    platforms.create(this.scale.width - 150, this.scale.height - 200, 'server')
        .setScale(1)
        .refreshBody();
    platforms.create(150, this.scale.height - 300, 'computer')
        .setScale(1)
        .refreshBody();
    platforms.create(this.scale.width - 150, this.scale.height - 400, 'server')
        .setScale(1)
        .refreshBody();

    this.physics.add.collider(player, platforms);

    // Сбор ключей
    const keys = this.physics.add.group({
        key: 'key',
        repeat: 10,
        setXY: { x: 50, y: 0, stepX: 100 }
    });

    keys.children.iterate(function (child) {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        child.setScale(0.5);
    });

    this.physics.add.collider(keys, platforms);
    this.physics.add.overlap(player, keys, collectKey, null, this);

    // Управление
    cursors = this.input.keyboard.createCursorKeys();
    spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);

    // Обработчик тапов для прыжка
    this.input.on('pointerdown', function (pointer) {
        if (player.body.touching.down) {
            player.setVelocityY(-500);
            console.log('Тап: Прыжок');
        }
    }, this);

    // Фоновые звуки
    const music = this.sound.add('bgm', { loop: true });
    music.play();

    // Добавление текста для отображения информации о резюме
    resumeInfoText = this.add.text(16, 16, 'Ключи собраны: 0', { fontSize: '24px', fill: '#ffffff' })
        .setScrollFactor(0);

    // Обработка изменения размера экрана
    this.scale.on('resize', resize, this);
}

function update() {
    if (cursors.left.isDown) {
        player.setVelocityX(-300);
        player.flipX = true;
    }
    else if (cursors.right.isDown) {
        player.setVelocityX(300);
        player.flipX = false;
    }
    else {
        player.setVelocityX(0);
    }

    // Прыжок при нажатии стрелки вверх, пробела или W
    if ((cursors.up.isDown || spacebar.isDown || wKey.isDown) && player.body.touching.down) {
        player.setVelocityY(-500);
        console.log('Прыжок: Стрелка вверх, пробел или W');
    }
}

function collectKey(player, key) {
    key.disableBody(true, true);
    keysCollected += 1;
    console.log(`Ключ ${keysCollected} собран.`);
    displayResumeInfo(keysCollected);
}

function displayResumeInfo(keyNumber) {
    // Обновление текста на экране
    resumeInfoText.setText(`Ключи собраны: ${keyNumber}`);
    // Добавьте вашу логику для отображения информации о резюме
}

function resize(gameSize, baseSize, displaySize, resolution) {
    const width = gameSize.width;
    const height = gameSize.height;

    // Обновление фона
    const background = this.children.getByName('background');
    if (background) {
        background.setDisplaySize(width, height);
    }

    // Перемещение игрока на новое положение
    if (player) {
        player.setPosition(width / 2, height - 150);
    }

    // Обновление платформ
    // Добавьте логику для динамического обновления позиций платформ при изменении размера экрана
}