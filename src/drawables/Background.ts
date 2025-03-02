import Buffer from '../render/Buffer';
import { ShaderBackground } from '../render/shaders';

/**
 * Handles drawing a background for a 3D scene
 */
class Background {

  /** WebGL Context */
  _gl;
  /** Owning scene */
  _main;
  /** VertexBuffer */
  _vertexBuffer;
  /** Texture coordinates buffer */
  _texCoordBuffer;
  /** Should canvas be filled by background @type {boolean} */
  _fill;
  /** One pixel texture used as background if no other is supplied */
  _monoTex;
  /** Background texture ( if one is provided ) */
  _texture;
  /** Height of the texture */
  _texWidth;
  /** Width of the texture */
  _texHeight;
  /** Texture type,  0: fixed grey, 1 env spec, 2 env ambient */
  _type;
  /** Should the texture be blurred @type {boolean} */
  _blur;

  constructor(gl, main) {
    this._gl = gl;
    this._main = main;
    this._vertexBuffer = new Buffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
    this._texCoordBuffer = new Buffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
    this._fill = true;
    this._monoTex = null;
    this._texture = null;
    this._texWidth = 1;
    this._texHeight = 1;
    this._type = 0;
    this._blur = 0.0;
    this.init();
  }

  init() {
    this._texCoordBuffer.update(new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0]));
    this._monoTex = this.createOnePixelTexture(50, 50, 50, 255);
    let element = document
      .getElementById('backgroundopen');
    if (element != null) {
      element.addEventListener('change', this.loadBackground.bind(this), false);
    } else {
      console.error('Could not find DOM element with id of "background"')
    }
  }

  loadBackground(event) {
    if (event.target.files.length === 0)
      return;

    var file = event.target.files[0];
    if (!file.type.match('image.*'))
      return;

    var self = this;
    var reader = new FileReader();
    reader.onload = function (evt) {
      var bg = new Image();
      if (evt.target != null && typeof evt.target.result === "string") {
        bg.src = evt.target.result;
      } else {
        console.error("Could not load image");
      }
      bg.onload = function () {

        var canvas = self._main.getCanvas();
        self.loadBackgroundTexture(bg);
        self.onResize(canvas.width, canvas.height);
        self.main.render();
      };
    };

    let element = <HTMLInputElement>document.getElementById('backgroundopen')
    if (element != null) {
      element.value = '';
    }
    reader.readAsDataURL(file);
  }

  get gl() {
    return this._gl;
  }

  get main() {
    return this._main;
  }

  get blur() {
    return this._blur;
  }

  get vertexBuffer() {
    return this._vertexBuffer;
  }

  get texCoordBuffer() {
    return this._texCoordBuffer;
  }

  release() {
    this.deleteTexture();
    this._vertexBuffer().release();
    this._texCoordBuffer().release();
  }

  get type() {
    return this._type;
  }

  set type(val) {
    this._type = val;
  }

  onResize(width, height) {
    var ratio = (width / height) / (this._texWidth / this._texHeight);
    var comp = this._fill || this._type !== 0 ? 1.0 / ratio : ratio;
    var x = comp < 1.0 ? 1.0 : 1.0 / ratio;
    var y = comp < 1.0 ? ratio : 1.0;
    this._vertexBuffer.update(new Float32Array([-x, -y, x, -y, -x, y, x, y]));
  }

  getTexture() {
    return this._texture ? this._texture : this._monoTex;
  }

  createOnePixelTexture(r, g, b, a) {
    var gl = this._gl;
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([r, g, b, a])
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return tex;
  }

  loadBackgroundTexture(tex) {
    var gl = this._gl;
    this.deleteTexture();

    this._texWidth = tex.width;
    this._texHeight = tex.height;
    this._texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, this._texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  deleteTexture() {
    if (this._texture) {
      this._texWidth = this._texHeight = 1;
      this._gl.deleteTexture(this._texture);
      this._texture = null;
    }
  }

  render() {
    ShaderBackground.getOrCreate(this._gl).draw(this);
  }
}

export default Background;
