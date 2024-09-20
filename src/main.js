// src/main.js

import Phaser from 'phaser';
import MainScene from './scenes/MainScene';
import './styles/main.css'; // Убедитесь, что этот файл существует и настроен

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container', // Убедитесь, что в вашем index.html есть элемент с этим id
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 }, // Лёгкая гравитация, похожая на лунную
            debug: false // Отключение режима отладки после завершения отладки
        }
    },
    scene: [MainScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

const game = new Phaser.Game(config);

// Обработчик изменения размера окна
window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});