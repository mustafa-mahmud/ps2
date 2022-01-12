/// <reference path="../typings/phaser.d.ts" />

var gameSettings = {
  playerSpeed: 150,
};

var config = {
  width: 500,
  height: 531,
  backgroundColor: '#000',
  scene: [Scene1, Scene2],
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
};

var game = new Phaser.Game(config);
