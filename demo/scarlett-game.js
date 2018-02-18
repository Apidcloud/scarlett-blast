'use strict';

const svgMesh3d = require('svg-mesh-3d');
const CustomShader = require('./shaders/customShader');

const DISPLAY_WIDTH = 1920,
  HALF_DISPLAY_WIDTH = DISPLAY_WIDTH / 2;
const DISPLAY_HEIGHT = 500,
  HALF_DISPLAY_HEIGHT = DISPLAY_HEIGHT / 2;

var Game = SC.Game;
var GameScene = SC.GameScene;
var ContentLoader = SC.ContentLoader;
var GameManager = SC.GameManager;
var Sprite = SC.Sprite;
var WrapMode = SC.WrapMode;
var Texture2D = SC.Texture2D;
var Text = SC.Text;
var Color = SC.Color;
var Keyboard = SC.Keyboard;
var Keys = SC.Keys;
var Vector2 = SC.Vector2;
var MathHelper = SC.MathHelper;
var BMFontParser = SC.BMFontParser;
var FileContext = SC.FileContext;
var FontLoader = SC.FontLoader;
var Path = SC.Path;
var Geometry = SC.Geometry;

var game = new Game({ target: "canvas" });
game.init();
var basicMesh = null;

var gameScene = new GameScene({
  name: "my game scene 1",
  game: game,
  //backgroundColor: Color.fromHex("#403F63FF")
  backgroundColor: Color.fromHex("#8DAABAFF")
});

GameManager.activeProjectPath = "/";

ContentLoader.loadAll({
  files: [
    { 
      path: "assets/svg-entypo-social/vimeo.svg", alias: "logo" 
    }
  ]
}).then(async function(result) {

  console.log(result);

  // needs to come before initializeTexDependencies
  game.changeScene(gameScene);
  game.setVirtualResolution(DISPLAY_WIDTH, DISPLAY_HEIGHT);
});

var gl = null;
// counter clock-wise triangle vertices, starting top
var triangleVertices = [
  [0.5, 0.7],
  [-0.2, -0.2],
  [0.2, -0.2]
];

var customShader = new CustomShader();

gameScene.initialize = function() {

  var logo = ContentLoader.getFile("logo");
  console.log(logo);

  basicMesh = new Geometry({
    shader: customShader,
    name: "Geometry",
    meshVertices: triangleVertices,
    color: Color.fromRGBA(255, 255, 255, 1.0),
  });

  gl = GameManager.renderContext.getContext();

  gl.useProgram(customShader.getProgram());
  gl.uniform4fv(customShader.uniforms.uTest._location, [
    255,
    255,
    255,
    1.0
  ]);

  gameScene.addGameObject(new Geometry());
  gameScene.addGameObject(basicMesh);
};


gameScene.lateUpdate = function(delta) {
  if (Keyboard.isKeyDown(Keys.Add)) {
    this._camera.zoom -= 0.01;
  } else if (Keyboard.isKeyDown(Keys.Subtract)) {
    this._camera.zoom += 0.01;
  }
};

gameScene.render = function(delta, spriteBatch) {

};


