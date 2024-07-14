import Enums from '../misc/Enums';
import {
    IShaderBase, ShaderBackground, ShaderBlur,
    ShaderContour, ShaderFlat, ShaderFxaa, ShaderMatcap,
    ShaderMerge, ShaderNormal, ShaderPaintUV, ShaderPBR,
    ShaderSelection, ShaderUV, ShaderWireframe
} from './shaders';


var ShaderLib: IShaderBase[] = [];

// 3D shaders
ShaderLib[Enums.Shader.PBR] = ShaderPBR;
ShaderLib[Enums.Shader.MATCAP] = ShaderMatcap;
ShaderLib[Enums.Shader.NORMAL] = ShaderNormal;
ShaderLib[Enums.Shader.UV] = ShaderUV;
ShaderLib[Enums.Shader.WIREFRAME] = ShaderWireframe;
ShaderLib[Enums.Shader.FLAT] = ShaderFlat;
ShaderLib[Enums.Shader.SELECTION] = ShaderSelection;

// 2D screen shaders
ShaderLib[Enums.Shader.BACKGROUND] = ShaderBackground;
ShaderLib[Enums.Shader.MERGE] = ShaderMerge;
ShaderLib[Enums.Shader.FXAA] = ShaderFxaa;
ShaderLib[Enums.Shader.CONTOUR] = ShaderContour;

// misc
ShaderLib[Enums.Shader.PAINTUV] = ShaderPaintUV;
ShaderLib[Enums.Shader.BLUR] = ShaderBlur;

export default ShaderLib;
