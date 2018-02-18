//const frag = require("./customFx.frag");
//import Game from "../src/core/game";

const shaderContent = {
  vertex: `
    precision mediump float; // set float point precision to medium. Not as high quality but faster
	  attribute vec2 aPos; // set entry attribute
    attribute vec2 aDirection;
    attribute vec2 aCentroid;
    uniform mat4 uMatrix;
    uniform mat4 uTransform;
    uniform float uAnimation;
 
	  void main()
	  {	
      // transform model-space position by explosion amount
      vec2 tPos = aPos + aDirection * uAnimation;

      // x and y, z and w
		  gl_Position = uMatrix * uTransform * vec4(tPos, 0.0, 1.0); // webgl position is a vector 4, but we are only sending a vector 2.
    }
    `
  ,
  fragment: `
    precision mediump float;
    uniform vec4 uTest;

	  void main()
	  {
	    gl_FragColor = uTest; // fragment color set to red color
	  }
    `
  ,
  uniforms: {
    uTest: [1.0, 1.0, 1.0, 1.0],
    uMatrix: { type: "mat4", value: new Float32Array(16) },
    uTransform: { type: "mat4", value: new Float32Array(16) },
    uAnimation: { type: "f", value: 0 },
  },
  attributes: {
    aPos: 0,
    aDirection: 0,
    aCentroid: 0
  }
};

export default class CustomShader extends SC.Shader {
  constructor() {
    super(shaderContent.vertex, shaderContent.fragment, shaderContent.uniforms, shaderContent.attributes);
    //this.xpto = new Game();
  }
}
