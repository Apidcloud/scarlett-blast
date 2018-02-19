'use strict';

import reindex from 'mesh-reindex';
import unindex from 'unindex-mesh';
import triangleCentroid from 'triangle-centroid';
import CustomShader from './shaders/customShader';
import shuffle from 'array-shuffle';

const svgMesh3d = require('svg-mesh-3d');
const xml2js = require('xml2js');
const promisify = require('util.promisify');
const xmlToJSAsync = promisify(xml2js.parseString);

const DISPLAY_WIDTH = 1920;
const DISPLAY_HEIGHT = 1080;

const backgroundColor = "#E3ACABFF";
const foregroundColor = "#111734FF";

const canvas = document.querySelector('canvas');
canvas.addEventListener('touchstart', (ev) => ev.preventDefault());
canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());

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
  backgroundColor: Color.fromHex(backgroundColor)
});

GameManager.activeProjectPath = "/demo/";

ContentLoader.loadAll({
  files: [
    { 
      path: "assets/svg-entypo-social/twitter.svg", alias: "logo" 
    }
  ]
}).then(async function(result) {
  // needs to come before initializeTexDependencies
  game.changeScene(gameScene);
  game.setVirtualResolution(DISPLAY_WIDTH, DISPLAY_HEIGHT);
});

var gl = null;
var customShader = new CustomShader();
var directionBuffer = null;
var centroidBuffer = null;

let svgs = [];
let counter = 0;

gameScene.initialize = async function() {

  try {
    const svg = await xmlToJSAsync(ContentLoader.getFile("logo").content);
    svgs.push(svg.svg.path[0].$.d);
  }
  catch (err) {
    console.log('ERROR:', err);
    return;
  }

  let complex = svgMesh3d(svgs[0], {
    scale: 10,
    simplify: 0.01,
    // play with this value for different aesthetic
    randomization: 750
  });

  // split mesh into separate triangles so no vertices are shared
  complex = reindex(unindex(complex.positions, complex.cells))

  // we will animate the triangles in the vertex shader
  const attributes = getAnimationAttributes(complex.positions, complex.cells)

  const directions = attributes.directions.reduce((a, b) => a.concat(b))
  const centroids = attributes.centroids.reduce((a, b) => a.concat(b));

  // multiplied by -1 because the y camera coordinate is inverted.
  const scarlettVertices = complex.positions.map(position => [position[0], -1*position[1]]);

  basicMesh = new Geometry({
    shader: customShader,
    name: "Geometry 1",
    meshVertices: scarlettVertices,
    color: Color.fromHex(foregroundColor),
  });

  basicMesh.transform.setPosition(0, 0);

  gl = GameManager.renderContext.getContext();

  gl.useProgram(customShader.getProgram());

  directionBuffer = gl.createBuffer();

  gl.enableVertexAttribArray(customShader.attributes.aDirection);
  gl.bindBuffer(gl.ARRAY_BUFFER, directionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(directions), gl.STATIC_DRAW);
  gl.vertexAttribPointer(customShader.attributes.aDirection, 2, gl.FLOAT, false, 0, 0);

  centroidBuffer = gl.createBuffer();

  gl.enableVertexAttribArray(customShader.attributes.aCentroid);
  gl.bindBuffer(gl.ARRAY_BUFFER, centroidBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(centroids), gl.STATIC_DRAW);
  gl.vertexAttribPointer(customShader.attributes.aCentroid, 2, gl.FLOAT, false, 0, 0);

  gl.uniform1f(customShader.uniforms.uAnimation._location, 0.0);
  gl.uniform1f(customShader.uniforms.uScale._location, 0.0);

  this._camera.x = 0.0;
  this._camera.y = 0.0;
  this._camera.zoom = 0.01;

  //gameScene.addGameObject(new Geometry());
  gameScene.addGameObject(basicMesh);
};

gameScene.lateUpdate = function(delta) {
  if (Keyboard.isKeyDown(Keys.Add)) {
    this._camera.zoom -= 0.01;
  } else if (Keyboard.isKeyDown(Keys.Subtract)) {
    this._camera.zoom += 0.01;
  }
};

const duration = 1.5;
const delay = 0.3;

let explosionAnimationValue = 0.0;
let scaleAnimationValue = 0.0;

let explosionTime = 0.0;
let scaleTime = 0.0;


let flip = false;
let flipScale = false;

gameScene.update = delta => {
  explosionTime += delta;
  scaleTime += delta;
  
  explosionAnimationValue = explosionTime / duration;
  explosionAnimationValue = flip ? (1.0 - explosionAnimationValue) : explosionAnimationValue;

  if (explosionTime > duration + delay){
    explosionTime = 0.0;
    flip = !flip;
  } 

  explosionAnimationValue = MathHelper.clamp(explosionAnimationValue, 0.0, 1.0);
  scaleAnimationValue = MathHelper.clamp(explosionAnimationValue, 0.0, 1.0);
};

gameScene.render = function(delta) {
  gl.useProgram(customShader.getProgram());

  gl.bindBuffer(gl.ARRAY_BUFFER, directionBuffer);
  gl.vertexAttribPointer(customShader.attributes.aDirection, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(customShader.attributes.aDirection);

  gl.bindBuffer(gl.ARRAY_BUFFER, centroidBuffer);
  gl.vertexAttribPointer(customShader.attributes.aCentroid, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(customShader.attributes.aCentroid);

  gl.uniform1f(customShader.uniforms.uAnimation._location, explosionAnimationValue);
  gl.uniform1f(customShader.uniforms.uScale._location, scaleAnimationValue);
  
  gl.uniformMatrix4fv(customShader.uniforms.uMatrix._location, false, this._camera.getMatrix());
  gl.uniformMatrix4fv(customShader.uniforms.uTransform._location, false, basicMesh.getMatrix());

  basicMesh.render(delta, this._spriteBatch);
};

function getAnimationAttributes (positions, cells) {
  const directions = []
  const centroids = []
  for (let i = 0; i < cells.length; i++) {
    const [ f0, f1, f2 ] = cells[i]
    const triangle = [ positions[f0], positions[f1], positions[f2] ]
    const center = triangleCentroid(triangle)
    const dir = [center[0], center[1]];
    centroids.push(dir, dir);
    centroids.push(dir, dir);
    centroids.push(dir, dir);
    const anim = [Math.random(), Math.random()];
    directions.push(anim, anim);
    directions.push(anim, anim);
    directions.push(anim, anim);
  }
  /*
  for (let j = 0; j < positions.length; j++) {
    const anim = [Math.random(), Math.random()];
    directions.push(anim, anim)
  }*/

  return { directions, centroids }
}


