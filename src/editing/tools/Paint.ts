import { vec3 } from 'gl-matrix';
import Tablet from '../../misc/Tablet';
import SculptBase from './SculptBase';

class Paint extends SculptBase {

  protected _hardness = 0.75;
  protected _intensity = 0.75;
  protected _culling = false;
  protected _color = vec3.fromValues(1.0, 0.766, 0.336); // albedo
  protected _material = vec3.fromValues(0.3, 0.95, 0.0); // roughness/metallic/masking
  protected _pickColor = false; // color picking
  protected _pickCallback: Function | null = null; // callback function after picking a color
  protected _idAlpha = 0;

  protected _writeAlbedo = true;
  protected _writeRoughness = true;
  protected _writeMetalness = true;

  constructor(main) {
    super(main);
    this._lockPosition = false;
    this._radius = 50;

  }

  override end() {
    this._pickColor = false;
    super.end();
  }

  override pushState(force) {
    if (!this._pickColor || force)
      this._main.getStateManager().pushStateColorAndMaterial(this.getMesh());
  }

  override startSculpt() {
    if (this._pickColor)
      return this.pickColor(this._main.getPicking());
    super.startSculpt();
  }

  override update(contin) {
    if (this._pickColor === true)
      return this.updatePickColor();
    super.update(contin);
  }

  override updateContinuous() {
    if (this._pickColor === true)
      return this.updatePickColor();
    super.updateContinuous();
  }

  override updateMeshBuffers() {
    var mesh = this.getMesh();
    if (mesh.isDynamic) {
      mesh.updateBuffers();
    } else {
      mesh.updateColorBuffer();
      mesh.updateMaterialBuffer();
    }
  }

  updatePickColor() {
    var picking = this._main.getPicking();
    if (picking.intersectionMouseMesh())
      this.pickColor(picking);
  }

  setPickCallback(cb) {
    this._pickCallback = cb;
  }

  pickColor(picking) {
    var mesh = this.getMesh();
    var color = this._color;
    picking.polyLerp(mesh.getMaterials(), color);
    var roughness = color[0];
    var metallic = color[1];
    picking.polyLerp(mesh.getColors(), color);
    if (this._pickCallback != null) {
      this._pickCallback(color, roughness, metallic);
    }
  }

  override stroke(picking) {
    var iVertsInRadius = picking.getPickedVertices();
    var intensity = this._intensity * Tablet.getPressureIntensity();

    // undo-redo
    this._main.getStateManager().pushVertices(iVertsInRadius);
    iVertsInRadius = this.dynamicTopology(picking);

    if (this._culling)
      iVertsInRadius = this.getFrontVertices(iVertsInRadius, picking.getEyeDirection());

    picking.updateAlpha(this._lockPosition);
    picking.setIdAlpha(this._idAlpha);
    this.paint(iVertsInRadius, picking.getIntersectionPoint(), picking.getLocalRadius2(), intensity, this._hardness, picking);

    var mesh = this.getMesh();
    mesh.updateDuplicateColorsAndMaterials(iVertsInRadius);
    if (mesh.isUsingDrawArrays())
      mesh.updateDrawArrays(mesh.getFacesFromVertices(iVertsInRadius));
  }

  paint(iVerts, center, radiusSquared, intensity, hardness, picking) {
    var mesh = this.getMesh();
    var vAr = mesh.getVertices();
    var cAr = mesh.getColors();
    var mAr = mesh.getMaterials();
    var color = this._color;
    var roughness = this._material[0];
    var metallic = this._material[1];
    var radius = Math.sqrt(radiusSquared);
    var cr = color[0];
    var cg = color[1];
    var cb = color[2];
    var cx = center[0];
    var cy = center[1];
    var cz = center[2];
    var softness = 2 * (1 - hardness);
    for (var i = 0, l = iVerts.length; i < l; ++i) {
      var ind = iVerts[i] * 3;
      var vx = vAr[ind];
      var vy = vAr[ind + 1];
      var vz = vAr[ind + 2];
      var dx = vx - cx;
      var dy = vy - cy;
      var dz = vz - cz;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
      if (dist > 1) dist = 1.0;

      var fallOff = Math.pow(1 - dist, softness);
      fallOff *= intensity * mAr[ind + 2] * picking.getAlpha(vx, vy, vz);
      var fallOffCompl = 1.0 - fallOff;

      if (this._writeAlbedo) {
        cAr[ind] = cAr[ind] * fallOffCompl + cr * fallOff;
        cAr[ind + 1] = cAr[ind + 1] * fallOffCompl + cg * fallOff;
        cAr[ind + 2] = cAr[ind + 2] * fallOffCompl + cb * fallOff;
      }

      if (this._writeRoughness) {
        mAr[ind] = mAr[ind] * fallOffCompl + roughness * fallOff;
      }

      if (this._writeMetalness) {
        mAr[ind + 1] = mAr[ind + 1] * fallOffCompl + metallic * fallOff;
      }
    }
  }

  paintAll() {
    var mesh = this.getMesh();
    var iVerts = this.getUnmaskedVertices();
    if (iVerts.length === 0)
      return;

    this.pushState(true);
    this._main.getStateManager().pushVertices(iVerts);

    var cAr = mesh.getColors();
    var mAr = mesh.getMaterials();
    var color = this._color;
    var roughness = this._material[0];
    var metallic = this._material[1];
    var cr = color[0];
    var cg = color[1];
    var cb = color[2];
    for (var i = 0, nb = iVerts.length; i < nb; ++i) {
      var ind = iVerts[i] * 3;
      var fallOff = mAr[ind + 2];
      var fallOffCompl = 1.0 - fallOff;

      if (this._writeAlbedo) {
        cAr[ind] = cAr[ind] * fallOffCompl + cr * fallOff;
        cAr[ind + 1] = cAr[ind + 1] * fallOffCompl + cg * fallOff;
        cAr[ind + 2] = cAr[ind + 2] * fallOffCompl + cb * fallOff;
      }

      if (this._writeRoughness) {
        mAr[ind] = mAr[ind] * fallOffCompl + roughness * fallOff;
      }

      if (this._writeMetalness) {
        mAr[ind + 1] = mAr[ind + 1] * fallOffCompl + metallic * fallOff;
      }
    }

    mesh.updateDuplicateColorsAndMaterials();
    mesh.updateDrawArrays();
    this.updateRender();
  }
}

export default Paint;
