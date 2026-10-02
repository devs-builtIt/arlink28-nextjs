"use client";

import { useEffect, useRef } from "react";

/**
 * Water on the hero photo. The photo is drawn through a small WebGL shader, and moving the pointer over the
 * hero card drops ripples that spread out, bend the picture as they pass, and fade away.
 *
 * The plain <img> underneath stays as the fallback: if WebGL is unavailable, the image can't load, or the
 * visitor prefers reduced motion or has data-saver on, nothing is drawn and the photo just sits there.
 * The animation loop only runs while a ripple is alive, so an idle page costs nothing.
 */

const MAX_DROPS = 24;
const LIFE = 5.5; // seconds a ripple lasts: long and slow, so the water settles gently

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform vec2 uImg;
uniform float uTime;
uniform vec3 uDrops[${MAX_DROPS}];

void main() {
  // Same framing as object-fit: cover with object-position 50% 55%.
  float ca = uRes.x / uRes.y;
  float ia = uImg.x / uImg.y;
  vec2 scale = ca > ia ? vec2(1.0, ia / ca) : vec2(ca / ia, 1.0);
  vec2 off = vec2((1.0 - scale.x) * 0.5, (1.0 - scale.y) * 0.45);

  vec2 p = vec2(vUv.x * ca, vUv.y);
  vec2 disp = vec2(0.0);
  float shine = 0.0;
  for (int i = 0; i < ${MAX_DROPS}; i++) {
    vec3 d = uDrops[i];
    float t = uTime - d.z;
    if (t < 0.0 || t > ${LIFE.toFixed(1)}) continue;
    vec2 q = p - vec2(d.x * ca, d.y);
    float x = length(q) - t * 0.19;
    float k = 1.0 - t / ${LIFE.toFixed(1)};
    float fade = k * k;
    float w = sin(x * 34.0) * exp(-x * x * 70.0) * fade;
    disp += normalize(q + 1e-5) * w * 0.0085;
    shine += w;
  }
  vec2 uv = vUv + vec2(disp.x / ca, disp.y);
  vec3 col = texture2D(uTex, uv * scale + off).rgb + shine * 0.04;
  gl_FragColor = vec4(col, 1.0);
}`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export default function HeroRipple({ src, smallSrc }: { src: string; smallSrc: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const card = canvas?.parentElement;
    if (!canvas || !card) return;

    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || saveData) return;

    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" });
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const program = gl.createProgram();
    if (!vs || !fs || !program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "uRes");
    const uImg = gl.getUniformLocation(program, "uImg");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uDrops = gl.getUniformLocation(program, "uDrops[0]");
    const uTex = gl.getUniformLocation(program, "uTex");

    // x, y (0 to 1, y up) and the time each ripple was born. A far-past birth means "unused".
    const drops = new Float32Array(MAX_DROPS * 3);
    for (let i = 0; i < MAX_DROPS; i++) drops[i * 3 + 2] = -1000;
    let next = 0;
    let lastDrop = -1000;
    const start = performance.now();
    const now = () => (performance.now() - start) / 1000;

    let ready = false;
    let running = false;
    let alive = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };

    const draw = (t: number) => {
      gl.uniform1f(uTime, t);
      gl.uniform3fv(uDrops, drops);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const frame = () => {
      if (!alive) return;
      const t = now();
      draw(t);
      if (t - lastDrop < LIFE + 0.1) requestAnimationFrame(frame);
      else running = false;
    };

    const kick = () => {
      if (!ready || running) return;
      running = true;
      requestAnimationFrame(frame);
    };

    const addDrop = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const t = now();
      drops[next * 3] = (clientX - rect.left) / rect.width;
      drops[next * 3 + 1] = 1 - (clientY - rect.top) / rect.height;
      drops[next * 3 + 2] = t;
      next = (next + 1) % MAX_DROPS;
      lastDrop = t;
      kick();
    };

    let lastX = -1000;
    let lastY = -1000;
    let lastAt = 0;
    const onMove = (e: PointerEvent) => {
      const t = performance.now();
      const far = Math.hypot(e.clientX - lastX, e.clientY - lastY) > 60;
      if (!far || t - lastAt < 160) return;
      lastX = e.clientX;
      lastY = e.clientY;
      lastAt = t;
      addDrop(e.clientX, e.clientY);
    };
    const onDown = (e: PointerEvent) => addDrop(e.clientX, e.clientY);

    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      if (!alive) return;
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1i(uTex, 0);
      gl.uniform2f(uImg, image.naturalWidth, image.naturalHeight);
      resize();
      ready = true;
      draw(now());
      canvas.dataset.ready = "true";
    };
    image.src = canvas.clientWidth > 1000 ? src : smallSrc;

    const observer = new ResizeObserver(() => {
      if (!ready) return;
      resize();
      draw(now());
    });
    observer.observe(canvas);
    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerdown", onDown);

    return () => {
      alive = false;
      observer.disconnect();
      card.removeEventListener("pointermove", onMove);
      card.removeEventListener("pointerdown", onDown);
    };
  }, [src, smallSrc]);

  return <canvas ref={canvasRef} className="hm-hero-ripple" aria-hidden="true" />;
}
