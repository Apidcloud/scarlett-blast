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
    uniform float uScale;
 
    #define PI 3.14

	  void main()
	  {	
      // transform model-space position by explosion amount
      // barebone
      //vec2 tPos = aPos + aDirection * uAnimation;

      float theta = (uAnimation) * (1.5 * PI) * sign(aCentroid.x);
      mat2 rotMat = mat2(
        vec2(cos(theta), sin(theta)),
        vec2(-sin(theta), cos(theta))
      );
  
      // push outward
      vec2 offset = mix(vec2(0.0), aDirection * rotMat, uAnimation);

      // scale triangles to their centroids
      vec2 tPos = mix(aCentroid, aPos, 1.0 - uScale) + offset;

      // x and y, z and w
		  gl_Position = uMatrix * uTransform * vec4(tPos, 0.0, 1.0);
    }
    `
  ,
  fragment: `
    precision mediump float;
    uniform vec4 uColor;

	  void main()
	  {
	    gl_FragColor = uColor; 
	  }
    `
  ,
  uniforms: {
    uColor: [1.0, 1.0, 1.0, 1.0],
    uMatrix: { type: "mat4", value: new Float32Array(16) },
    uTransform: { type: "mat4", value: new Float32Array(16) },
    uAnimation: { type: "f", value: 1.0 },
    uScale: { type: "f", value: 0 }
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
