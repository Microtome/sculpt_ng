import { mat3, mat4, vec3 } from 'gl-matrix';
import Buffer from '../render/Buffer';
import Enums from '../misc/Enums';
import { ShaderSelection } from '../render/shaders';



/** Handles rendering the selection tool */
class Selection {

  _gl;

  _circleBuffer;
  _dotBuffer;

  _cacheDotMVP = mat4.create();
  _cacheDotSymMVP = mat4.create();
  _cacheCircleMVP = mat4.create();
  _color = new Float32Array([0.8, 0.0, 0.0]);

  // TODO: These are scratch variables and the names should be fixed up
  _tmp_matpv = mat4.create();
  _tmp_mat = mat4.create();
  _tmp_mat3 = mat3.create();
  _tmp_vec = new Float32Array([0.0, 0.0, 0.0]);
  _tmp_axis = new Float32Array([0.0, 0.0, 0.0]);
  _base = new Float32Array([0.0, 0.0, 1.0]);

  _dot_radius = 50.0;

  /** horizontal offset (when editing the radius) */
  _offsetX = 0.0;
  _isEditMode = false;

  constructor(gl) {
    this._gl = gl;

    this._circleBuffer = new Buffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
    this._dotBuffer = new Buffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW);

    this.init();
  }

  getGL() {
    return this._gl;
  }

  getCircleBuffer() {
    return this._circleBuffer;
  }

  getDotBuffer() {
    return this._dotBuffer;
  }

  getCircleMVP() {
    return this._cacheCircleMVP;
  }

  getDotMVP() {
    return this._cacheDotMVP;
  }

  getDotSymmetryMVP() {
    return this._cacheDotSymMVP;
  }

  getColor() {
    return this._color;
  }

  setIsEditMode(bool) {
    this._isEditMode = bool;
  }

  getIsEditMode() {
    return this._isEditMode;
  }

  setOffsetX(offset) {
    this._offsetX = offset;
  }

  getOffsetX() {
    return this._offsetX;
  }

  init() {
    this.getCircleBuffer().update(this._getCircleVertices(1.0));
    this.getDotBuffer().update(this._getDotVertices(0.05, 10));
  }

  release() {
    this.getCircleBuffer().release();
    this.getDotBuffer().release();
  }

  _getCircleVertices(radius = 1.0, nbVertices = 50, full = false) {
    var arc = Math.PI * 2;

    var start = full ? 1 : 0;
    var end = full ? nbVertices + 2 : nbVertices;
    var vertices = new Float32Array(end * 3);
    for (var i = start; i < end; ++i) {
      var j = i * 3;
      var segment = (arc * i) / nbVertices;
      vertices[j] = Math.cos(segment) * radius;
      vertices[j + 1] = Math.sin(segment) * radius;
    }
    return vertices;
  }

  _getDotVertices(r, nb) {
    return this._getCircleVertices(r, nb, true);
  }

  _updateMatricesBackground(camera, main) {

    var screenRadius = main.getSculptManager().getCurrentTool().getScreenRadius();

    var w = camera._width * 0.5;
    var h = camera._height * 0.5;
    // no need to recompute the ortho proj each time though
    mat4.ortho(this._tmp_matpv, -w, w, -h, h, -10.0, 10.0);

    mat4.identity(this._tmp_mat);
    mat4.translate(
      this._tmp_mat,
      this._tmp_mat,
      vec3.set(this._tmp_vec, -w + main._mouseX + this._offsetX, h - main._mouseY, 0.0)
    );
    // circle mvp
    mat4.scale(
      this._cacheCircleMVP,
      this._tmp_mat,
      vec3.set(this._tmp_vec, screenRadius, screenRadius, screenRadius)
    );
    mat4.mul(this._cacheCircleMVP, this._tmp_matpv, this._cacheCircleMVP);
    // dot mvp
    mat4.scale(
      this._cacheDotMVP,
      this._tmp_mat,
      vec3.set(this._tmp_vec, this._dot_radius, this._dot_radius, this._dot_radius)
    );
    mat4.mul(this._cacheDotMVP, this._tmp_matpv, this._cacheDotMVP);
    // symmetry mvp
    mat4.scale(this._cacheDotSymMVP, this._cacheDotSymMVP, [0.0, 0.0, 0.0]);
  }

  _updateMatricesMesh(camera, main) {
    var picking = main.getPicking();
    var pickingSym = main.getPickingSymmetry();
    var worldRadius = Math.sqrt(picking.computeWorldRadius2(true));
    var screenRadius = main.getSculptManager().getCurrentTool().getScreenRadius();

    var mesh = picking.getMesh();
    var constRadius = this._dot_radius * (worldRadius / screenRadius);

    picking.polyLerp(mesh.getNormals(), this._tmp_axis);
    vec3.transformMat3(
      this._tmp_axis,
      this._tmp_axis,
      mat3.normalFromMat4(this._tmp_mat3, mesh.getMatrix())
    );
    vec3.normalize(this._tmp_axis, this._tmp_axis);
    var rad = Math.acos(vec3.dot(this._base, this._tmp_axis));
    vec3.cross(this._tmp_axis, this._base, this._tmp_axis);

    mat4.identity(this._tmp_mat);
    mat4.translate(
      this._tmp_mat,
      this._tmp_mat,
      vec3.transformMat4(this._tmp_vec, picking.getIntersectionPoint(), mesh.getMatrix())
    );
    mat4.rotate(this._tmp_mat, this._tmp_mat, rad, this._tmp_axis);

    mat4.mul(this._tmp_matpv, camera.getProjection(), camera.getView());

    // circle mvp
    mat4.scale(
      this._cacheCircleMVP,
      this._tmp_mat,
      vec3.set(this._tmp_vec, worldRadius, worldRadius, worldRadius)
    );
    mat4.mul(this._cacheCircleMVP, this._tmp_matpv, this._cacheCircleMVP);
    // dot mvp
    mat4.scale(
      this._cacheDotMVP,
      this._tmp_mat,
      vec3.set(this._tmp_vec, constRadius, constRadius, constRadius)
    );
    mat4.mul(this._cacheDotMVP, this._tmp_matpv, this._cacheDotMVP);
    // symmetry mvp
    vec3.transformMat4(this._tmp_vec, pickingSym.getIntersectionPoint(), mesh.getMatrix());
    mat4.identity(this._tmp_mat);
    mat4.translate(this._tmp_mat, this._tmp_mat, this._tmp_vec);
    mat4.rotate(this._tmp_mat, this._tmp_mat, rad, this._tmp_axis);

    mat4.scale(
      this._tmp_mat,
      this._tmp_mat,
      vec3.set(this._tmp_vec, constRadius, constRadius, constRadius)
    );
    mat4.mul(this._cacheDotSymMVP, this._tmp_matpv, this._tmp_mat);
  }

  render(main) {
    // if there's an offset then it means we are editing the tool radius
    var pickedMesh = main.getPicking().getMesh() && !this._isEditMode;
    if (pickedMesh) this._updateMatricesMesh(main.getCamera(), main);
    else this._updateMatricesBackground(main.getCamera(), main);

    var drawCircle = main._action === Enums.Action.NOTHING;
    vec3.set(this._color, 0.8, drawCircle && pickedMesh ? 0.0 : 0.4, 0.0);
    ShaderSelection
      .getOrCreate(this._gl)
      .draw(this, drawCircle, main.getSculptManager().getSymmetry());

    this._isEditMode = false;
  }
}

export default Selection;
