// src/scenes/MainScene.js

import Phaser from 'phaser';
import playerImg from '../assets/images/player.png';
import platformImg from '../assets/images/platform.png';
import keyImg from '../assets/images/key.png';
import backgroundImg from '../assets/images/background.png';
import obstacleImg from '../assets/images/obstacle.png';
import windowOpenAudio from '../assets/audio/window_open.mp3';
import buttonClickAudio from '../assets/audio/button_click.mp3';
import backgroundMusic from '../assets/audio/background-music.mp3';

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        // Загрузка ассетов
        this.load.image('player', playerImg);
        this.load.image('platform', platformImg);
        this.load.image('key', keyImg);
        this.load.image('background', backgroundImg);
        this.load.image('obstacle', obstacleImg);
        this.load.audio('window_open', windowOpenAudio);
        this.load.audio('button_click', buttonClickAudio);
        this.load.audio('background_music', backgroundMusic);
    }

    create() {
        // Добавление фонового изображения как tileSprite для параллакса
        this.background = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'background').setOrigin(0, 0);
        this.background.setScrollFactor(0); // Фиксированный фон

        // Воспроизведение фоновой музыки
        this.bgMusic = this.sound.add('background_music', { loop: true, volume: 0.5 });
        this.bgMusic.play();

        // Создание групп
        this.platforms = this.physics.add.staticGroup();
        this.keys = this.physics.add.group();
        this.obstacles = this.physics.add.group();

        // Создание начальных платформ
        this.createInitialPlatforms();

        // Создание игрока
        this.player = this.physics.add.sprite(100, 450, 'player');
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);

        // Настройка коллизии
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.keys, this.platforms);
        this.physics.add.collider(this.obstacles, this.platforms);
        this.physics.add.collider(this.player, this.obstacles, this.hitObstacle, null, this);
        this.physics.add.overlap(this.player, this.keys, this.collectKey, null, this);

        // Настройка камеры для следования за игроком
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, Number.MAX_SAFE_INTEGER, this.scale.height);

        // Счетчик очков
        this.score = 0;
        this.scoreText = this.add.text(16, 16, 'Счет: 0', { fontSize: '32px', fill: '#000' });
        this.scoreText.setScrollFactor(0); // Фиксированный счетчик

        // Настройка ввода
        this.cursors = this.input.keyboard.createCursorKeys();
        this.WKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.AKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.SKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.DKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.SpaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE); // Добавление пробела

        // Обработчик для мыши и касаний
        this.input.on('pointerdown', () => {
            if (this.player.body.onFloor()) { // Используем onFloor() вместо body.touching.down
                console.log('Jump via pointer');
                this.jump();
            }
        });

        // Таймеры для спавна препятствий и ключей
        this.time.addEvent({
            delay: 7000, // каждые 7 секунд
            callback: this.spawnObstacle,
            callbackScope: this,
            loop: true
        });

        this.time.addEvent({
            delay: 5000, // каждые 5 секунд
            callback: this.spawnKey,
            callbackScope: this,
            loop: true
        });
    }

    update() {
        if (this.gameOver) {
            return;
        }

        // Движение игрока
        let movingLeft = this.cursors.left.isDown || this.AKey.isDown;
        let movingRight = this.cursors.right.isDown || this.DKey.isDown;

        if (movingLeft) {
            this.player.setVelocityX(-300);
            this.player.flipX = true;
        }
        else if (movingRight) {
            this.player.setVelocityX(300);
            this.player.flipX = false;
        }
        else {
            // Автоматическое движение вправо
            this.player.setVelocityX(200);
        }

        // Прыжок
        if (
            (Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
            Phaser.Input.Keyboard.JustDown(this.WKey) ||
            Phaser.Input.Keyboard.JustDown(this.SpaceKey)) &&
            this.player.body.onFloor()
        ) {
            console.log('Jump via keyboard');
            this.jump();
        }

        // Обновление фона для параллакса
        this.background.tilePositionX = this.cameras.main.scrollX * 0.5;

        // Удаление ключей, ушедших за экран
        this.keys.children.iterate(child => {
            if (child.x < this.cameras.main.scrollX - 100) {
                child.destroy();
            }
        });

        // Удаление препятствий, ушедших за экран
        this.obstacles.children.iterate(child => {
            if (child.x < this.cameras.main.scrollX - 100) {
                child.destroy();
            }
        });

        // Динамическое создание новых платформ впереди игрока
        this.checkPlatformGeneration();
    }

    jump() {
        this.player.setVelocityY(-600);
        console.log('Jump triggered');
    }

    collectKey(player, key) {
        key.disableBody(true, true);

        this.score += 10;
        this.scoreText.setText('Счет: ' + this.score);
    }

    hitObstacle(player, obstacle) {
        this.physics.pause();
        this.bgMusic.stop();
        player.setTint(0xff0000);
        this.gameOver = true;

        // Окно Game Over
        let bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.5);
        bg.fillRect(this.cameras.main.scrollX, 0, this.cameras.main.width, this.cameras.main.height);

        let container = this.add.container(this.cameras.main.scrollX + this.cameras.main.width / 2, this.cameras.main.height / 2);

        let windowRect = this.add.graphics();
        windowRect.fillStyle(0xffffff, 1);
        windowRect.fillRoundedRect(-200, -150, 400, 300, 20);

        let infoText = this.add.text(0, -50, 'Game Over!\nНажмите чтобы перезапустить.', {
            fontSize: '24px',
            fill: '#000',
            align: 'center'
        });
        infoText.setOrigin(0.5);

        let button = this.add.text(0, 100, 'Перезапустить', {
            fontSize: '20px',
            fill: '#ffffff',
            backgroundColor: '#ff0000',
            padding: { x: 20, y: 10 }
        });
        button.setOrigin(0.5);
        button.setInteractive({ useHandCursor: true });

        button.on('pointerdown', () => {
            this.sound.play('button_click');
            bg.destroy();
            container.destroy();
            this.scene.restart();
            this.bgMusic.play();
        });

        container.add([windowRect, infoText, button]);
        container.alpha = 0;
        this.tweens.add({
            targets: container,
            alpha: 1,
            duration: 500,
            ease: 'Power2'
        });
    }

    spawnObstacle() {
        let obstacleX = this.player.x + Phaser.Math.Between(600, 800);
        let obstacleY = 500; // Убедитесь, что препятствие находится на уровне платформы
        let obstacle = this.obstacles.create(obstacleX, obstacleY, 'obstacle');
        obstacle.setImmovable(true);
        obstacle.body.allowGravity = false;
    }

    spawnKey() {
        let keyX = this.player.x + Phaser.Math.Between(600, 800);
        let keyY = 400; // Убедитесь, что ключ находится на платформе или выше
        let key = this.keys.create(keyX, keyY, 'key');
        key.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        key.setScale(0.5);
    }

    createInitialPlatforms() {
        // Создание начальных платформ
        const initialPlatforms = [
            { x: 400, y: 568, scale: 1.5 },
            { x: 600, y: 400, scale: 1.5 },
            { x: 800, y: 300, scale: 1.5 },
            { x: 1000, y: 400, scale: 1.5 },
            { x: 1200, y: 500, scale: 1.5 },
            // Добавляйте дополнительные платформы здесь
        ];

        initialPlatforms.forEach(platform => {
            this.platforms.create(platform.x, platform.y, 'platform').setScale(platform.scale).refreshBody();
        });
    }

    checkPlatformGeneration() {
        // Генерация новых платформ впереди игрока
        const cameraRightEdge = this.cameras.main.scrollX + this.cameras.main.width;
        const generationThreshold = cameraRightEdge + 400; // Расстояние от края камеры, при котором создаются новые платформы

        let lastPlatform = this.getLastPlatform();

        if (lastPlatform && lastPlatform.x < generationThreshold) {
            let nextX = lastPlatform.x + Phaser.Math.Between(200, 400);
            let nextY = Phaser.Math.Between(200, 500); // Диапазон высот для платформ

            this.platforms.create(nextX, nextY, 'platform').setScale(1.5).refreshBody();
            console.log(`New platform created at (${nextX}, ${nextY})`);
        }
    }

    getLastPlatform() {
        // Получение самой правой платформы
        let platforms = this.platforms.getChildren();
        if (platforms.length === 0) return null;

        platforms.sort((a, b) => b.x - a.x);
        return platforms[0];
    }
}

export default MainScene;