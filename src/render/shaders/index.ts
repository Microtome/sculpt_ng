import type Attribute from '../Attribute';

export { default as ShaderPBR } from './ShaderPBR';
export { default as ShaderMatcap } from './ShaderMatcap';
export { default as ShaderNormal } from './ShaderNormal';
export { default as ShaderUV } from './ShaderUV';
export { default as ShaderWireframe } from './ShaderWireframe';
export { default as ShaderFlat } from './ShaderFlat';
export { default as ShaderSelection } from './ShaderSelection';

export { default as ShaderBackground } from './ShaderBackground';
export { default as ShaderMerge } from './ShaderMerge';
export { default as ShaderFxaa } from './ShaderFxaa';
export { default as ShaderContour } from './ShaderContour';

export { default as ShaderPaintUV } from './ShaderPaintUV';
export { default as ShaderBlur } from './ShaderBlur';

export interface IShaderBase {
    vertexName: string;
    fragmentName: string;
    program: any;
    vertex: any;
    fragment: any;
    uniforms: {
        [name: string]: WebGLUniformLocation;
    };
    texture0: WebGLTexture;
    _dummyTex: WebGLTexture | null;
    attributes: {
        aVertex?: Attribute;
        aNormal?: Attribute;
        aMaterial?: Attribute;
        aColor?: Attribute;
        aTexCoord?: Attribute;
    };
    activeAttributes: {
        vertex?: boolean;
        normal?: boolean;
        material?: boolean;
        color?: boolean;
    };
    showSymmetryLine: any;
    darkenUnselected: any;
    uniformNames: string[];
    commonUniforms: string[];
    strings: {
        colorSpaceGLSL: string;
        vertUniforms: string;
        fragColorUniforms: string;
        fragColorFunction: string;
    };
    draw: (mesh, main?, optional?) => void;
    getOrCreateTexture0: (gl: WebGLRenderingContext, texPath?: string, main?: any) => WebGLTexture | false
    getOrCreate: (gl: WebGLRenderingContext) => IShaderBase;
    initUniforms: (gl: WebGLRenderingContext) => void;
    updateUniforms: (mesh: any, main?: any) => void;
    // draw: IDraw;
    drawBuffer: (mesh: any) => void;
    setTextureParameters: (gl: WebGLRenderingContext, tex: HTMLImageElement) => void;
    onLoadTexture0: (gl: WebGLRenderingContext, tex: HTMLImageElement, main: any) => void;
    getDummyTexture: (gl: WebGLRenderingContext) => WebGLTexture;
    // getOrCreateTexture0: IGetOrCreateTexture0;
    initAttributes: (gl: WebGLRenderingContext) => void;
    bindAttributes: (mesh: any) => void;
    unbindAttributes: () => void;
    getCopy: () => IShaderBase;
}


interface IGetOrCreateTexture0 {
    (gl: WebGLRenderingContext): false | WebGLTexture;
    (gl: WebGLRenderingContext, texPath: string): false | WebGLTexture;
    (gl: WebGLRenderingContext, texPath: string, main: any): false | WebGLTexture;
}

interface IDraw {
    (mesh: any, main: any): void;
    (mesh: any, main: any): void;
    (mesh: any, main: any, other: any | null): void;
}