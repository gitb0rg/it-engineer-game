// src/main.js

import Phaser from 'phaser';
import MainScene from './scenes/MainScene';
import './styles/main.css';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1000 },
            debug: false
        }
    },
    scene: [MainScene]
};

const game = new Phaser.Game(config);