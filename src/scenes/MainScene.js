// src/scenes/MainScene.js

import Phaser from 'phaser';

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        // Загрузка ассетов
        this.load.image('player', '../assets/images/player.png');
        this.load.image('platform', '../assets/images/platform.png');
        this.load.image('key', '../assets/images/key.png');
        this.load.audio('window_open', '../assets/audio/window_open.mp3');
        this.load.audio('button_click', '../assets/audio/button_click.mp3');
    }

    create() {
        // Создание платформ
        this.platforms = this.physics.add.staticGroup();
        this.platforms.create(400, 568, 'platform').setScale(2).refreshBody();
        this.platforms.create(600, 400, 'platform');
        this.platforms.create(50, 250, 'platform');
        this.platforms.create(750, 220, 'platform');

        // Создание игрока
        this.player = this.physics.add.sprite(100, 450, 'player');
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);
        this.player.body.setGravityY(300);

        // Настройка коллизии с платформами
        this.physics.add.collider(this.player, this.platforms);

        // Создание группы ключей
        this.keys = this.physics.add.group({
            key: 'key',
            repeat: 11,
            setXY: { x: 12, y: 0, stepX: 70 }
        });

        this.keys.children.iterate(function (child) {
            child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        });

        // Настройка коллизии ключей с платформами
        this.physics.add.collider(this.keys, this.platforms);

        // Настройка столкновения игрока с ключами
        this.physics.add.overlap(this.player, this.keys, this.collectKey, null, this);

        // Счетчик собранных ключей
        this.score = 0;
        this.scoreText = this.add.text(16, 16, 'Счет: 0', { fontSize: '32px', fill: '#000' });

        // Настройка ввода
        this.cursors = this.input.keyboard.createCursorKeys();

        // Добавление обработчика касаний для мобильных устройств
        this.input.on('pointerdown', () => {
            if (this.player.body.touching.down) {
                this.player.setVelocityY(-500);
            }
        });
    }

    update() {
        // Движение игрока
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
        }
        else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
        }
        else {
            this.player.setVelocityX(0);
        }

        // Прыжок
        if (this.cursors.up.isDown && this.player.body.touching.down) {
            this.player.setVelocityY(-500);
        }
    }

    collectKey(player, key) {
        key.disableBody(true, true);

        // Увеличение счета
        this.score += 10;
        this.scoreText.setText('Счет: ' + this.score);

        // Проверка, собраны ли все ключи
        if (this.keys.countActive(true) === 0) {
            this.showInfoWindow();
        }
    }

    showInfoWindow() {
        // Воспроизведение звука открытия окна
        this.sound.play('window_open');

        // Создание затемнённого фона
        let bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.5);
        bg.fillRect(0, 0, this.scale.width, this.scale.height);

        // Создание контейнера для окна
        let container = this.add.container(this.scale.width / 2, this.scale.height / 2);

        // Создание окна
        let window = this.add.graphics();
        window.fillStyle(0xffffff, 1);
        window.fillRoundedRect(-200, -150, 400, 300, 20); // Ширина:400, Высота:300

        // Добавление текста
        let infoText = this.add.text(0, -50, 'Поздравляем!\nВы собрали все ключи!', {
            fontSize: '24px',
            fill: '#000',
            align: 'center'
        });
        infoText.setOrigin(0.5);

        // Добавление кнопки
        let button = this.add.text(0, 100, 'Продолжить игру', {
            fontSize: '20px',
            fill: '#ffffff',
            backgroundColor: '#0000ff',
            padding: { x: 20, y: 10 }
        });
        button.setOrigin(0.5);
        button.setInteractive({ useHandCursor: true });

        // Обработчик нажатия на кнопку
        button.on('pointerdown', () => {
            // Воспроизведение звука нажатия кнопки
            this.sound.play('button_click');

            // Удаление информационного окна
            bg.destroy();
            container.destroy();

            // Перезапуск уровня или переход на другую сцену
            this.scene.restart();
        });

        // Добавление элементов в контейнер
        container.add([window, infoText, button]);

        // Добавление анимации появления
        container.alpha = 0;
        this.tweens.add({
            targets: container,
            alpha: 1,
            duration: 500,
            ease: 'Power2'
        });
    }
}

export default MainScene;