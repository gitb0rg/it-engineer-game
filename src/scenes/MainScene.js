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
        // Загрузка ассетов с помощью импортированных путей
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
        // Добавление фонового изображения как tileSprite для бесконечного фона с параллаксом
        this.background = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'background').setOrigin(0, 0);
        this.background.setScrollFactor(0); // Фиксированный фон

        // Воспроизведение фоновой музыки
        this.bgMusic = this.sound.add('background_music', { loop: true, volume: 0.5 });
        this.bgMusic.play();

        // Создание платформ
        this.platforms = this.physics.add.staticGroup();

        // Увеличение платформ на 50%
        const platformScale = 1.5;
        this.platforms.create(400, 568, 'platform').setScale(platformScale).refreshBody();
        this.platforms.create(600, 400, 'platform').setScale(platformScale).refreshBody();
        this.platforms.create(50, 250, 'platform').setScale(platformScale).refreshBody();
        this.platforms.create(750, 220, 'platform').setScale(platformScale).refreshBody();

        // Создание игрока
        this.player = this.physics.add.sprite(100, 450, 'player');
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);
        // Удаляем per-player gravity, используем глобальную
        // this.player.body.setGravityY(300); // Удалено

        // Настройка коллизии с платформами
        this.physics.add.collider(this.player, this.platforms);

        // Создание группы ключей
        this.keys = this.physics.add.group({
            key: 'key',
            repeat: 11,
            setXY: { x: 500, y: 0, stepX: 200 }
        });

        this.keys.children.iterate(function (child) {
            child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
            // Сделать ключи меньше
            child.setScale(0.5);
        });

        // Настройка коллизии ключей с платформами
        this.physics.add.collider(this.keys, this.platforms);

        // Настройка столкновения игрока с ключами
        this.physics.add.overlap(this.player, this.keys, this.collectKey, null, this);

        // Создание группы препятствий
        this.obstacles = this.physics.add.group();

        // Настройка коллизии препятствий с платформами и игроком
        this.physics.add.collider(this.obstacles, this.platforms);
        this.physics.add.collider(this.player, this.obstacles, this.hitObstacle, null, this);

        // Создание камеры, которая следует за игроком
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, Number.MAX_SAFE_INTEGER, 600);

        // Счетчик собранных ключей
        this.score = 0;
        this.scoreText = this.add.text(16, 16, 'Счет: 0', { fontSize: '32px', fill: '#000' });
        this.scoreText.setScrollFactor(0); // Фиксированный счетчик

        // Настройка ввода
        this.cursors = this.input.keyboard.createCursorKeys();
        this.WKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.AKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.SKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.DKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

        // Добавление обработчика касаний для мобильных устройств и мыши
        this.input.on('pointerdown', () => {
            if (this.player.body.touching.down) {
                this.jump();
            }
        });

        // Таймер для спавна препятствий и ключей
        this.time.addEvent({
            delay: 3000, // каждые 3 секунды
            callback: this.spawnObstacle,
            callbackScope: this,
            loop: true
        });

        this.time.addEvent({
            delay: 4000, // каждые 4 секунды
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
            this.player.setVelocityX(-300); // Увеличенная скорость движения
            this.player.flipX = true; // Отразить спрайт
        }
        else if (movingRight) {
            this.player.setVelocityX(300); // Увеличенная скорость движения
            this.player.flipX = false;
        }
        else {
            // Если никакие клавиши не нажаты, двигаться автоматически вправо
            this.player.setVelocityX(200);
        }

        // Прыжок
        if ((Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.WKey)) && this.player.body.touching.down) {
            this.jump();
        }

        // Обновление позиции фона для параллакса
        this.background.tilePositionX = this.cameras.main.scrollX * 0.5; // Параллакс эффект
    }

    jump() {
        this.player.setVelocityY(-600); // Увеличенная скорость прыжка
    }

    collectKey(player, key) {
        key.disableBody(true, true);

        // Увеличение счета
        this.score += 10;
        this.scoreText.setText('Счет: ' + this.score);
    }

    hitObstacle(player, obstacle) {
        // Остановить игру и показать окно Game Over
        this.physics.pause();
        this.bgMusic.stop();
        player.setTint(0xff0000);
        this.gameOver = true;

        // Отображение окна Game Over
        let bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.5);
        bg.fillRect(this.cameras.main.scrollX, 0, this.cameras.main.width, this.cameras.main.height);

        let container = this.add.container(this.cameras.main.scrollX + this.cameras.main.width / 2, this.cameras.main.height / 2);

        let window = this.add.graphics();
        window.fillStyle(0xffffff, 1);
        window.fillRoundedRect(-200, -150, 400, 300, 20);

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

        container.add([window, infoText, button]);
        container.alpha = 0;
        this.tweens.add({
            targets: container,
            alpha: 1,
            duration: 500,
            ease: 'Power2'
        });
    }

    spawnObstacle() {
        // Создайте препятствие на определённом расстоянии впереди игрока
        let obstacleX = this.player.x + 800;
        let obstacleY = 500; // Предположим, что препятствия находятся на уровне земли
        let obstacle = this.obstacles.create(obstacleX, obstacleY, 'obstacle');
        obstacle.setImmovable(true);
        obstacle.body.allowGravity = false;
    }

    spawnKey() {
        // Создайте ключ на определённом расстоянии впереди игрока
        let keyX = this.player.x + 600;
        let keyY = 400; // На платформе или немного выше
        let key = this.keys.create(keyX, keyY, 'key');
        key.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        key.setScale(0.5);
    }
}

export default MainScene;