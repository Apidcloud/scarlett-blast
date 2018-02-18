'use strict';

import reindex from 'mesh-reindex';
import unindex from 'unindex-mesh';
import triangleCentroid from 'triangle-centroid';

const svgMesh3d = require('svg-mesh-3d');
const CustomShader = require('./shaders/customShader');
const xml2js = require('xml2js');
const promisify = require('util.promisify');
const xmlToJSAsync = promisify(xml2js.parseString);

const DISPLAY_WIDTH = 1920, HALF_DISPLAY_WIDTH = DISPLAY_WIDTH / 2;
const DISPLAY_HEIGHT = 500, HALF_DISPLAY_HEIGHT = DISPLAY_HEIGHT / 2;

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
      path: "assets/svg-entypo-social/google+.svg", alias: "logo" 
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

gameScene.initialize = async function() {

  let svgPath;

  try {
    const svg = await xmlToJSAsync(ContentLoader.getFile("logo").content);
    svgPath = svg.svg.path[0].$.d;
  }
  catch (err) {
    console.log('ERROR:', err);
    return;
  }

  let complex = svgMesh3d(svgPath, {
    scale: 10,
    simplify: 0.01
    // play with this value for different aesthetic
    // randomization: 500, 
  });

  // split mesh into separate triangles so no vertices are shared
  complex = reindex(unindex(complex.positions, complex.cells))

  // we will animate the triangles in the vertex shader
  const attributes = getAnimationAttributes(complex.positions, complex.cells)

  const directions = attributes.directions.reduce((a, b) => a.concat(b))

  const scarlettVertices = complex.positions.map(position => [position[0], position[1]]);
 

  // counter clock-wise triangle vertices, starting top
  var triangleVertices = [
    [0.5, 0.7],
    [-0.2, -0.2],
    [0.2, -0.2]
  ];

  basicMesh = new Geometry({
    shader: customShader,
    name: "Geometry",
    meshVertices: scarlettVertices,
    color: Color.fromRGBA(255, 255, 255, 1.0),
  });

  basicMesh.transform.setPosition(10, 10);

  gl = GameManager.renderContext.getContext();

  gl.useProgram(customShader.getProgram());

  directionBuffer = gl.createBuffer();

  gl.enableVertexAttribArray(customShader.attributes.aDirection);
  gl.bindBuffer(gl.ARRAY_BUFFER, directionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(directions), gl.STATIC_DRAW);
  gl.vertexAttribPointer(customShader.attributes.aDirection, 2, gl.FLOAT, false, 0, 0);

  //const cameraMatrix = GameManager.activeGame.getActiveCamera().getMatrix();
  //gl.uniformMatrix4fv(customShader.uniforms.uMatrix._location, false, cameraMatrix);
  //gl.uniformMatrix4fv(customShader.uniforms.uTransform._location, false, basicMesh.getMatrix());

  gl.uniform4fv(customShader.uniforms.uTest._location, [
    255,
    255,
    255,
    1.0
  ]);

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

gameScene.render = function(delta) {

  gl.useProgram(customShader.getProgram());
  const cameraMatrix = game.getActiveCamera().getMatrix();

  gl.bindBuffer(gl.ARRAY_BUFFER, directionBuffer);
  gl.vertexAttribPointer(customShader.attributes.aDirection, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(customShader.attributes.aDirection);

  //gl.uniformMatrix4fv(customShader.uniforms.uMatrix._location, false, cameraMatrix);
  //gl.uniformMatrix4fv(customShader.uniforms.uTransform._location, false, basicMesh.getMatrix());

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

    //const anim = [Math.random(), Math.random()];
    //directions.push(anim, anim)
  }
  for(let j = 0; j < positions.length; j++) {
    const anim = [Math.random(), Math.random()];
    directions.push(anim, anim)
  }

  return { directions, centroids }
}


