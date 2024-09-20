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
import resumeData from '../data/resumeData'; // Новый файл с резюме

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
        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;

        // Добавление фонового tileSprite для повторяющегося фона по горизонтали
        this.background = this.add.tileSprite(0, 0, gameWidth * 10, gameHeight, 'background').setOrigin(0, 0);
        this.background.setDepth(-1); // Убедитесь, что фон находится позади остальных элементов

        // Воспроизведение фоновой музыки
        this.bgMusic = this.sound.add('background_music', { loop: true, volume: 0.5 });
        this.bgMusic.play();

        // Создание групп
        this.platforms = this.physics.add.staticGroup();
        this.obstacles = this.physics.add.group();
        this.keys = this.physics.add.group();

        // Создание начальных платформ
        this.createInitialPlatforms(gameWidth, gameHeight);

        // Создание игрока
        this.player = this.physics.add.sprite(100, gameHeight - 150, 'player');
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true); // Предотвращает выход за границы мира

        // Настройка коллизии
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.obstacles, this.platforms);
        this.physics.add.collider(this.player, this.obstacles, this.hitObstacle, null, this);
        this.physics.add.overlap(this.player, this.keys, this.collectKey, null, this);

        // Настройка камеры для следования за игроком после достижения 60% экрана вправо
        this.cameraStartX = 0.6 * gameWidth;
        this.cameras.main.setBounds(0, 0, Number.MAX_SAFE_INTEGER, gameHeight);
        this.cameraFollowing = false; // Флаг для отслеживания состояния камеры

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
        this.DownKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN); // Клавиша вниз

        // Обработчик для мыши и касаний
        this.input.on('pointerdown', () => {
            if (this.player.body.onFloor()) {
                this.jump();
            }
        });

        // Генерация препятствий и ключей
        this.spawnObstaclesAndKeys();

        // Добавление экранных кнопок для мобильных устройств
        this.createMobileButtons();

        // Обработчик закрытия резюме по нажатию Enter
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.enterKey.on('down', () => {
            if (this.resumeContainer && this.resumeContainer.active) {
                this.closeResumeMessage();
            }
        });
    }

    update() {
        if (this.gameOver) {
            return;
        }

        // Движение игрока
        let movingLeft = this.cursors.left.isDown || this.AKey.isDown || (this.leftButton && this.leftButton.isDown);
        let movingRight = this.cursors.right.isDown || this.DKey.isDown || (this.rightButton && this.rightButton.isDown);

        if (movingLeft) {
            this.player.setVelocityX(-600); // Увеличена скорость движения влево
            this.player.flipX = true;
        }
        else if (movingRight) {
            this.player.setVelocityX(600); // Увеличена скорость движения вправо
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
            this.jump();
        }

        // Ускоренное приземление при нажатии вниз или 'S'
        if (Phaser.Input.Keyboard.JustDown(this.cursors.down) || Phaser.Input.Keyboard.JustDown(this.SKey)) {
            if (!this.player.body.onFloor()) {
                this.player.setVelocityY(400); // Увеличенная скорость приземления
            }
        }

        // Обновление фона для параллакса
        this.background.tilePositionX = this.cameras.main.scrollX * 0.5;

        // Управление камерой: начать следовать за игроком, когда он достигнет 60% экрана вправо
        if (!this.cameraFollowing && this.player.x > this.cameraStartX + this.cameras.main.scrollX) {
            this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
            this.cameraFollowing = true;
        }

        // Динамическое создание новых платформ, препятствий и ключей
        this.checkGeneration();

        // Удаление объектов, ушедших за левую границу экрана
        this.removeOffscreenObjects();
    }

    jump() {
        this.player.setVelocityY(-800); // Увеличена скорость прыжка для более быстрого приземления
    }

    collectKey(player, key) {
        key.disableBody(true, true);

        this.score += 10;
        this.scoreText.setText('Счет: ' + this.score);

        // Воспроизведение звука сбора ключа
        this.sound.play('window_open');

        // Остановка фоновой музыки при открытии окна резюме
        this.bgMusic.pause();

        // Отображение сообщения о резюме
        this.showResumeMessage();
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

        let container = this.add.container(this.cameras.main.scrollX + this.cameras.main.width / 2, this.cameras.main.height / 2);

        let windowRect = this.add.graphics();
        windowRect.fillStyle(0xffffff, 1);
        windowRect.fillRoundedRect(-200, -150, 400, 300, 20);
        container.add(windowRect);

        let infoText = this.add.text(0, -50, 'Game Over!\nНажмите чтобы перезапустить.', {
            fontSize: '24px',
            fill: '#000',
            align: 'center',
            wordWrap: { width: 380 }
        });
        infoText.setOrigin(0.5);
        container.add(infoText);

        let button = this.add.text(0, 100, 'Перезапустить', {
            fontSize: '20px',
            fill: '#ffffff',
            backgroundColor: '#ff0000',
            padding: { x: 20, y: 10 },
            align: 'center'
        });
        button.setOrigin(0.5);
        button.setInteractive({ useHandCursor: true });
        container.add(button);

        button.on('pointerdown', () => {
            this.sound.play('button_click');
            bg.destroy();
            container.destroy();
            this.scene.restart();
            this.bgMusic.play();
        });

        // Центрирование контейнера
        container.setPosition(this.cameras.main.scrollX + this.cameras.main.width / 2, this.cameras.main.height / 2);

        container.alpha = 0;
        this.tweens.add({
            targets: container,
            alpha: 1,
            duration: 500,
            ease: 'Power2'
        });
    }

    createInitialPlatforms(gameWidth, gameHeight) {
        // Создание начальных платформ
        const initialPlatforms = [
            { x: gameWidth / 2, y: gameHeight - 50, scale: 2 }, // Основная платформа внизу
            { x: gameWidth + 200, y: gameHeight - 150, scale: 1.5 },
            { x: gameWidth + 400, y: gameHeight - 250, scale: 1.5 },
            { x: gameWidth + 600, y: gameHeight - 150, scale: 1.5 },
            { x: gameWidth + 800, y: gameHeight - 50, scale: 1.5 },
            // Добавляйте дополнительные платформы здесь
        ];

        initialPlatforms.forEach(platform => {
            this.platforms.create(platform.x, platform.y, 'platform').setScale(platform.scale).refreshBody();
        });
    }

    spawnObstaclesAndKeys() {
        // Пример размещения препятствий и ключей на платформах
        const obstacleData = [
            { platformX: this.scale.width / 2, platformY: this.scale.height - 50, hasKey: true },
            { platformX: this.scale.width + 200, platformY: this.scale.height - 150, hasKey: false },
            { platformX: this.scale.width + 400, platformY: this.scale.height - 250, hasKey: true },
            { platformX: this.scale.width + 600, platformY: this.scale.height - 150, hasKey: false },
            { platformX: this.scale.width + 800, platformY: this.scale.height - 50, hasKey: true },
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
            let nextY = Phaser.Math.Between(this.scale.height - 300, this.scale.height - 50); // Диапазон высот для платформ

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
        this.leftButton = this.add.text(60, this.scale.height - 60, '←', {
            fontSize: '50px', // Увеличен размер шрифта
            fill: '#ffffff',
            backgroundColor: 'rgba(0, 0, 255, 0.8)', // Более яркий цвет
            padding: { x: 20, y: 20 }, // Увеличены отступы
            align: 'center'
        })
        .setInteractive({ useHandCursor: true })
        .setOrigin(0.5)
        .setDepth(1); // Убедитесь, что кнопки отображаются поверх других элементов

        this.leftButton.on('pointerdown', () => {
            this.player.setVelocityX(-600); // Увеличена скорость движения
            this.player.flipX = true;
        });

        this.leftButton.on('pointerup', () => {
            if (!this.cursors.left.isDown && !this.AKey.isDown && !this.leftButton.isDown) {
                this.player.setVelocityX(0);
            }
        });

        // Кнопка Вправо
        this.rightButton = this.add.text(this.scale.width - 60, this.scale.height - 60, '→', {
            fontSize: '50px', // Увеличен размер шрифта
            fill: '#ffffff',
            backgroundColor: 'rgba(255, 0, 0, 0.8)', // Более яркий цвет
            padding: { x: 20, y: 20 }, // Увеличены отступы
            align: 'center'
        })
        .setInteractive({ useHandCursor: true })
        .setOrigin(0.5)
        .setDepth(1); // Убедитесь, что кнопки отображаются поверх других элементов

        this.rightButton.on('pointerdown', () => {
            this.player.setVelocityX(600); // Увеличена скорость движения
            this.player.flipX = false;
        });

        this.rightButton.on('pointerup', () => {
            if (!this.cursors.right.isDown && !this.DKey.isDown && !this.rightButton.isDown) {
                this.player.setVelocityX(0);
            }
        });
    }

    showResumeMessage() {
        // Проверяем, существует ли уже сообщение о резюме
        if (this.resumeContainer) return;

        const gameWidth = this.scale.width;
        const gameHeight = this.scale.height;

        // Создание контейнера для сообщения о резюме
        this.resumeContainer = this.add.container(this.cameras.main.scrollX + gameWidth / 2, this.cameras.main.scrollY + gameHeight / 2);

        // Затемнённый фон
        let bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.7);
        bg.fillRect(-gameWidth / 2, -gameHeight / 2, gameWidth, gameHeight);
        this.resumeContainer.add(bg);

        // Окно резюме
        let windowRect = this.add.graphics();
        windowRect.fillStyle(0xffffff, 1);
        windowRect.fillRoundedRect(-300, -200, 600, 400, 20);
        this.resumeContainer.add(windowRect);

        // Заголовок
        let resumeText = this.add.text(0, -150, 'Мое Резюме', {
            fontSize: '32px',
            fill: '#000',
            align: 'center'
        });
        resumeText.setOrigin(0.5);
        this.resumeContainer.add(resumeText);

        // Детали резюме
        let currentResumeIndex = 0;
        this.displayResumeDetails = () => {
            if (currentResumeIndex >= resumeData.length) {
                currentResumeIndex = 0; // Сбросить индекс, если все резюме показаны
            }

            // Удалить предыдущие детали
            if (this.resumeDetails) {
                this.resumeDetails.destroy();
            }

            this.resumeDetails = this.add.text(0, -50, resumeData[currentResumeIndex], {
                fontSize: '24px',
                fill: '#000',
                align: 'center',
                wordWrap: { width: 550 }
            });
            this.resumeDetails.setOrigin(0.5);
            this.resumeContainer.add(this.resumeDetails);

            currentResumeIndex++;
        };

        this.displayResumeDetails();

        // Кнопка Продолжить Игру
        let button = this.add.text(0, 150, 'Продолжить Игру', {
            fontSize: '20px',
            fill: '#ffffff',
            backgroundColor: '#ff0000',
            padding: { x: 20, y: 10 },
            align: 'center'
        });
        button.setOrigin(0.5);
        button.setInteractive({ useHandCursor: true });
        this.resumeContainer.add(button);

        button.on('pointerdown', () => {
            this.sound.play('button_click');
            this.closeResumeMessage();
        });

        // Добавляем слушатель на клавишу Enter для закрытия сообщения
        this.enterKey.once('down', () => {
            this.closeResumeMessage();
        });

        // Остановка фоновой музыки при открытии окна
        this.bgMusic.pause();

        // Анимация появления сообщения
        this.resumeContainer.alpha = 0;
        this.tweens.add({
            targets: this.resumeContainer,
            alpha: 1,
            duration: 500,
            ease: 'Power2'
        });
    }

    closeResumeMessage() {
        if (!this.resumeContainer) return;

        // Анимация исчезновения сообщения
        this.tweens.add({
            targets: this.resumeContainer,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                this.resumeContainer.destroy();
                this.resumeContainer = null;
                // Возобновление фоновой музыки
                if (this.bgMusic.paused) {
                    this.bgMusic.resume();
                }
            }
        });
    }

    removeOffscreenObjects() {
        // Удаление платформ, ушедших за экран слева
        this.platforms.children.iterate(child => {
            if (child.x < this.cameras.main.scrollX - 400) { // 400 - запас
                child.destroy();
            }
        });

        // Удаление препятствий, ушедших за экран слева
        this.obstacles.children.iterate(child => {
            if (child.x < this.cameras.main.scrollX - 400) {
                child.destroy();
            }
        });

        // Удаление ключей, ушедших за экран слева
        this.keys.children.iterate(child => {
            if (child.x < this.cameras.main.scrollX - 400) {
                child.destroy();
            }
        });
    }
}

export default MainScene;