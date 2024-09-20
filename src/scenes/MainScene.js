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
        this.obstacles = this.physics.add.group();
        this.keys = this.physics.add.group();

        // Создание начальных платформ
        this.createInitialPlatforms();

        // Создание игрока
        this.player = this.physics.add.sprite(100, 450, 'player');
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);

        // Настройка коллизии
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.obstacles, this.platforms);
        this.physics.add.collider(this.player, this.obstacles, this.hitObstacle, null, this);
        this.physics.add.overlap(this.player, this.keys, this.collectKey, null, this);

        // Настройка камеры для следования за игроком
        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
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

        // Генерация препятствий и ключей
        this.spawnObstaclesAndKeys();

        // Добавление экранных кнопок для мобильных устройств
        this.createMobileButtons();
    }

    update() {
        if (this.gameOver) {
            return;
        }

        // Движение игрока
        let movingLeft = this.cursors.left.isDown || this.AKey.isDown || this.leftButton.isDown;
        let movingRight = this.cursors.right.isDown || this.DKey.isDown || this.rightButton.isDown;

        if (movingLeft) {
            this.player.setVelocityX(-300);
            this.player.flipX = true;
        }
        else if (movingRight) {
            this.player.setVelocityX(300);
            this.player.flipX = false;
        }
        else {
            this.player.setVelocityX(0);
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

        // Динамическое создание новых платформ, препятствий и ключей
        this.checkGeneration();
    }

    jump() {
        this.player.setVelocityY(-600);
        console.log('Jump triggered');
    }

    collectKey(player, key) {
        key.disableBody(true, true);

        this.score += 10;
        this.scoreText.setText('Счет: ' + this.score);

        // Воспроизведение звука сбора ключа
        this.sound.play('window_open');
    }

    hitObstacle(player, obstacle) {
        this.physics.pause();
        this.bgMusic.stop();
        player.setTint(0xff0000);
        this.gameOver = true;

        // Воспроизведение звука смерти
        this.sound.play('window_open');

        // Окно Game Over
        let bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.5);
        bg.fillRect(this.cameras.main.scrollX - this.cameras.main.width / 2, 0, this.cameras.main.width, this.cameras.main.height);

        let container = this.add.container(this.cameras.main.scrollX, this.cameras.main.height / 2);

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

    spawnObstaclesAndKeys() {
        // Пример размещения препятствий и ключей на платформах
        const obstacleData = [
            { platformX: 400, platformY: 568, hasKey: true },
            { platformX: 600, platformY: 400, hasKey: false },
            { platformX: 800, platformY: 300, hasKey: true },
            { platformX: 1000, platformY: 400, hasKey: false },
            { platformX: 1200, platformY: 500, hasKey: true },
            // Добавляйте дополнительные препятствия здесь
        ];

        obstacleData.forEach(data => {
            let obstacle = this.obstacles.create(data.platformX, data.platformY - 50, 'obstacle'); // Размещаем препятствие на платформе
            obstacle.setImmovable(true);
            obstacle.body.allowGravity = false;

            if (data.hasKey) {
                let key = this.keys.create(data.platformX, data.platformY - 100, 'key'); // Размещаем ключ над препятствием
                key.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
                key.setScale(0.5);
            }
        });
    }

    checkGeneration() {
        // Проверка необходимости создания новых платформ
        const cameraRightEdge = this.cameras.main.scrollX + this.cameras.main.width;
        const generationThreshold = cameraRightEdge + 600; // Расстояние от края камеры, при котором создаются новые платформы

        let lastPlatform = this.getLastPlatform();

        if (lastPlatform && lastPlatform.x < generationThreshold) {
            let nextX = lastPlatform.x + Phaser.Math.Between(200, 400);
            let nextY = Phaser.Math.Between(200, 500); // Диапазон высот для платформ

            this.platforms.create(nextX, nextY, 'platform').setScale(1.5).refreshBody();
            console.log(`New platform created at (${nextX}, ${nextY})`);

            // Добавление препятствия и ключа на новую платформу
            let hasKey = Phaser.Math.Between(0, 1) === 1; // С вероятностью 50% добавляем ключ
            let obstacle = this.obstacles.create(nextX, nextY - 50, 'obstacle');
            obstacle.setImmovable(true);
            obstacle.body.allowGravity = false;

            if (hasKey) {
                let key = this.keys.create(nextX, nextY - 100, 'key');
                key.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
                key.setScale(0.5);
            }
        }
    }

    getLastPlatform() {
        // Получение самой правой платформы
        let platforms = this.platforms.getChildren();
        if (platforms.length === 0) return null;

        platforms.sort((a, b) => b.x - a.x);
        return platforms[0];
    }

    createMobileButtons() {
        // Создание экранных кнопок для управления на мобильных устройствах

        // Кнопка Влево
        this.leftButton = this.add.image(60, this.scale.height - 60, 'platform') // Используйте подходящий спрайт или создайте свой
            .setInteractive()
            .setAlpha(0.5)
            .setDisplaySize(50, 50)
            .setTint(0x0000ff); // Синий цвет для кнопки влево

        this.leftButton.on('pointerdown', () => {
            this.player.setVelocityX(-300);
            this.player.flipX = true;
        });

        this.leftButton.on('pointerup', () => {
            if (!this.cursors.left.isDown && !this.AKey.isDown) {
                this.player.setVelocityX(0);
            }
        });

        // Кнопка Вправо
        this.rightButton = this.add.image(this.scale.width - 60, this.scale.height - 60, 'platform') // Используйте подходящий спрайт или создайте свой
            .setInteractive()
            .setAlpha(0.5)
            .setDisplaySize(50, 50)
            .setTint(0xff0000); // Красный цвет для кнопки вправо

        this.rightButton.on('pointerdown', () => {
            this.player.setVelocityX(300);
            this.player.flipX = false;
        });

        this.rightButton.on('pointerup', () => {
            if (!this.cursors.right.isDown && !this.DKey.isDown) {
                this.player.setVelocityX(0);
            }
        });
    }
}

export default MainScene;