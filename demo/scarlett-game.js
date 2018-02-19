'use strict';

import reindex from 'mesh-reindex';
import unindex from 'unindex-mesh';
import triangleCentroid from 'triangle-centroid';
import CustomShader from './shaders/customShader';
import shuffle from 'array-shuffle';
import { first } from 'rxjs/operator/first';

const svgMesh3d = require('svg-mesh-3d');
const xml2js = require('xml2js');
const promisify = require('util.promisify');
const xmlToJSAsync = promisify(xml2js.parseString);

const DISPLAY_WIDTH = 1920;
const DISPLAY_HEIGHT = 1080;

const backgroundColor = "#E3ACABFF";
const foregroundColor = "#111734FF";

const svgs = [
  {
    path: "assets/svg-entypo-social/github.svg",
    alias: "githubLogo",
    link: "https://github.com/Apidcloud/"
  },
  {
    path: "assets/svg-entypo-social/twitter.svg",
    alias: "twitterLogo",
    link: "https://twitter.com/apidcloud"
  }
];

const canvas = document.querySelector('canvas');
canvas.addEventListener('touchstart', (ev) => ev.preventDefault());
canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());

const hoverElement = document.querySelector('#special');

let Game = SC.Game;
let GameScene = SC.GameScene;
let ContentLoader = SC.ContentLoader;
let GameManager = SC.GameManager;
let Sprite = SC.Sprite;
let WrapMode = SC.WrapMode;
let Texture2D = SC.Texture2D;
let Text = SC.Text;
let Color = SC.Color;
let Keyboard = SC.Keyboard;
let Keys = SC.Keys;
let Vector2 = SC.Vector2;
let MathHelper = SC.MathHelper;
let BMFontParser = SC.BMFontParser;
let FileContext = SC.FileContext;
let FontLoader = SC.FontLoader;
let Path = SC.Path;
let Geometry = SC.Geometry;

let game = new Game({ target: "canvas" });
game.init();

let basicMesh = null;
let svgStepCounter = 0;

var gameScene = new GameScene({
  name: "my game scene 1",
  game: game,
  backgroundColor: Color.fromHex(backgroundColor)
});

GameManager.activeProjectPath = "./demo/";

ContentLoader.loadAll({
  files: svgs
}).then(async function(result) {
  game.changeScene(gameScene);
  game.setVirtualResolution(DISPLAY_WIDTH, DISPLAY_HEIGHT);

  svgStepCounter = await stepAsync(svgStepCounter, svgs);
});

var gl = null;
var customShader = new CustomShader();
var directionBuffer = null;
var centroidBuffer = null;

gameScene.initialize = function() {
  this._camera.x = 0.0;
  this._camera.y = 0.0;
  this._camera.zoom = 0.01;
};

const duration = 1.5;
const delay = 0.3;

let explosionAnimationValue = 0.0;
let scaleAnimationValue = 0.0;

let explosionTime = 0.0;
let scaleTime = 0.0;

const startFadeIn = true;
let fadeIn = startFadeIn;

let times = 1;
let meshUpdatedOnce = false;
let renderedMeshOnce = false;

gameScene.update = delta => {
  if (!flag || !meshUpdatedOnce){
    meshUpdatedOnce = true;
    return;
  }

  explosionTime += delta;
  scaleTime += delta;
  
  explosionAnimationValue = explosionTime / duration;
  explosionAnimationValue = fadeIn ? (1.0 - explosionAnimationValue) : explosionAnimationValue;

  if (explosionTime > duration + delay){
    // reset
    explosionTime = 0.0; 

    // the 2nd animation stops when times === 3
    if (times % 2 === 0){
      // interrupt update while the next mesh isn't added to the scene
      flag = false;
      // make sure to reset values, so it renders correctly from the beginning
      meshUpdatedOnce = false;
      renderedMeshOnce = false;
      // prepare next step
      stepAsync(svgStepCounter, svgs).then(result => {
        svgStepCounter = result;
      });
    }
    times++;
    fadeIn = !fadeIn;
  } 

  explosionAnimationValue = MathHelper.clamp(explosionAnimationValue, 0.0, 1.0);
  scaleAnimationValue = explosionAnimationValue;
};

gameScene.render = function(delta) {
  if (!basicMesh || !flag){
    return;
  }

  gl.useProgram(customShader.getProgram());

  gl.bindBuffer(gl.ARRAY_BUFFER, directionBuffer);
  gl.vertexAttribPointer(customShader.attributes.aDirection, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(customShader.attributes.aDirection);

  gl.bindBuffer(gl.ARRAY_BUFFER, centroidBuffer);
  gl.vertexAttribPointer(customShader.attributes.aCentroid, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(customShader.attributes.aCentroid);

  // make sure to start exactly as we want it to, to prevent an initial wrong flash
  // e.g., wanting to fade-in but the full img being rendered for a split second
  if (!renderedMeshOnce) {
    gl.uniform1f(customShader.uniforms.uAnimation._location, startFadeIn ? 1.0 : 0.0);
    gl.uniform1f(customShader.uniforms.uScale._location, startFadeIn ? 1.0 : 0.0);
    renderedMeshOnce = true;
  } else {
    gl.uniform1f(customShader.uniforms.uAnimation._location, explosionAnimationValue);
    gl.uniform1f(customShader.uniforms.uScale._location, scaleAnimationValue);
  }
  
  gl.uniformMatrix4fv(customShader.uniforms.uMatrix._location, false, this._camera.getMatrix());
  gl.uniformMatrix4fv(customShader.uniforms.uTransform._location, false, basicMesh.getMatrix());

  basicMesh.render(delta, this._spriteBatch);
};

let flag = false;

async function stepAsync(number, svgs){
  let svgPath = null;

  try {
    const svg = await xmlToJSAsync(ContentLoader.getFile(svgs[number].alias).content);
    svgPath = svg.svg.path[0].$.d;
  }
  catch (err) {
    console.log('ERROR:', err);
    return;
  }

  let complex = svgMesh3d(svgPath, {
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

  // make sure to clean if it already exists
  if (basicMesh){
    gameScene.removeGameObject(basicMesh);
    basicMesh = null;
  }

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

  gl.uniform1f(customShader.uniforms.uAnimation._location, 1.0);
  gl.uniform1f(customShader.uniforms.uScale._location, 1.0);

  //gameScene.addGameObject(new Geometry());
  gameScene.addGameObject(basicMesh);

  hoverElement.href = svgs[number].link;
  flag = true;

  const nextStep = number + 1 >= svgs.length ? 0 : number + 1;

  return nextStep;
}

function getAnimationAttributes (positions, cells) {
  const directions = [];
  const centroids = [];
  for (let i = 0; i < cells.length; i++) {
    const [f0, f1, f2] = cells[i];
    const triangle = [positions[f0], positions[f1], positions[f2]];
    const center = triangleCentroid(triangle);
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


