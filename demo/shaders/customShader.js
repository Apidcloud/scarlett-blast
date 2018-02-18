//const frag = require("./customFx.frag");

const shaderContent = {
  vertex: `
    precision mediump float; // set float point precision to medium. Not as high quality but faster
	  attribute vec2 aPos; // set entry attribute

	  void main()
	  {	
      // x and y, z and w
		  gl_Position = vec4(aPos, 0.0, 1.0); // webgl position is a vector 4, but we are only sending a vector 2.
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
    uTest: [1.0, 1.0, 1.0, 1.0]
  },
  attributes: {
    aPos: 0
  }
};

class CustomShader extends SC.Shader {
  constructor() {
    super(shaderContent.vertex, shaderContent.fragment, shaderContent.uniforms, shaderContent.attributes);
  }
}

module.exports = CustomShader;
