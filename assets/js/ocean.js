/* ═══════════════════════════════════════════════════════════════
   深海潮汐 · WebGL 全屏海面着色器
   FBM 域扭曲海浪 + 月光高光 + 峰顶泡沫 + 颗粒暗角
   ═══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  var canvas = document.getElementById("ocean");
  if (!canvas || !window.WebGLRenderingContext) { document.body.classList.add("no-webgl"); return; }

  var gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance" })
        || canvas.getContext("experimental-webgl", { antialias: false, alpha: false });
  if (!gl) { document.body.classList.add("no-webgl"); return; }

  var VERT = [
    "attribute vec2 aPos;",
    "void main(){ gl_Position = vec4(aPos,0.0,1.0); }"
  ].join("\n");

  var FRAG = [
    "precision highp float;",
    "uniform vec2 uRes;",
    "uniform float uTime;",
    "uniform vec2 uMouse;",
    "uniform float uScroll;",
    "uniform float uAspect;",
    "",
    "float hash(vec2 p){ p = fract(p*vec2(234.34,435.345)); p += dot(p,p+34.23); return fract(p.x*p.y); }",
    "float noise(vec2 p){",
    "  vec2 i = floor(p), f = fract(p);",
    "  vec2 u = f*f*(3.0-2.0*f);",
    "  float a = hash(i), b = hash(i+vec2(1.0,0.0));",
    "  float c = hash(i+vec2(0.0,1.0)), d = hash(i+vec2(1.0,1.0));",
    "  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);",
    "}",
    "float fbm(vec2 p){",
    "  float v = 0.0, a = 0.5;",
    "  mat2 m = mat2(1.6,1.2,-1.2,1.6);",
    "  for(int i=0;i<5;i++){ v += a*noise(p); p = m*p; a *= 0.55; }",
    "  return v;",
    "}",
    "void main(){",
    "  vec2 uv = gl_FragCoord.xy / uRes;",
    "  vec2 p = vec2(uv.x*uAspect, uv.y);",
    "  float t = uTime*0.055;",
    "  vec2 st = p*1.35 + vec2(0.0, uScroll*0.55);",
    // 域扭曲，制造涌浪的流动感
    "  vec2 q = vec2(fbm(st + vec2(t*1.1, -t*0.7)), fbm(st + vec2(-t*0.8, t*1.3)));",
    "  vec2 r = vec2(fbm(st + 1.7*q + vec2(1.7, 9.2) + t*0.35), fbm(st + 1.7*q + vec2(8.3, 2.8) - t*0.28));",
    "  float h = fbm(st + 1.9*r);",
    // 法线（分析梯度）
    "  float e = 0.012;",
    "  float hx = fbm(st + 1.9*r + vec2(e,0.0));",
    "  float hy = fbm(st + 1.9*r + vec2(0.0,e));",
    "  vec3 n = normalize(vec3(h-hx, h-hy, 0.06));",
    // 灯光随鼠标偏移（月光）
    "  vec3 L = normalize(vec3(uMouse.x*0.85, 0.55 + uMouse.y*0.3, 1.0));",
    "  float diff = clamp(dot(n, L), 0.0, 1.0);",
    "  float spec = pow(clamp(dot(reflect(-L, n), vec3(0.0,0.0,1.0)), 0.0, 1.0), 42.0);",
    // 波峰泡沫
    "  float crest = smoothstep(0.62, 0.86, h);",
    "  float foam = crest * (0.55 + 0.45*noise(st*6.0 + t*2.0));",
    "  float sparkle = pow(noise(st*34.0 + vec2(t*3.0)), 24.0) * crest;",
    // 深水颜色渐变
    "  vec3 deep   = vec3(0.012, 0.043, 0.105);",
    "  vec3 mid    = vec3(0.024, 0.145, 0.235);",
    "  vec3 crestC = vec3(0.48, 0.86, 0.92);",
    "  vec3 col = mix(deep, mid, smoothstep(0.18, 0.62, h));",
    "  col = mix(col, crestC, foam*0.85);",
    // 月光
    "  col += diff * vec3(0.05, 0.16, 0.22) * (0.4 + 0.6*h);",
    "  col += spec * vec3(0.85, 0.95, 1.0) * (0.35 + crest);",
    "  col += sparkle * vec3(0.9, 1.0, 1.0);",
    // 深水光晕（画面下半）
    "  col *= 1.0 - 0.32*smoothstep(0.55, 1.25, uv.y);",
    "  col += vec3(0.02, 0.10, 0.14) * smoothstep(0.62, 1.2, uv.y);",
    // 顶部天光
    "  col += vec3(0.10, 0.22, 0.30) * pow(max(1.0-uv.y, 0.0), 2.6) * 0.35;",
    // 暗角
    "  float vig = smoothstep(1.35, 0.45, length((uv-0.5)*vec2(uAspect,1.0)*0.92));",
    "  col *= mix(0.72, 1.0, vig);",
    // 颗粒与抖动（防色带）
    "  col += (hash(gl_FragCoord.xy + uTime) - 0.5) * 0.022;",
    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n");

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { throw new Error(gl.getShaderInfoLog(s)); }
    return s;
  }
  var prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { throw new Error(gl.getProgramInfoLog(prog)); }
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var uRes = gl.getUniformLocation(prog, "uRes"),
      uTime = gl.getUniformLocation(prog, "uTime"),
      uMouse = gl.getUniformLocation(prog, "uMouse"),
      uScroll = gl.getUniformLocation(prog, "uScroll"),
      uAspect = gl.getUniformLocation(prog, "uAspect");

  var mouse = { x: 0.18, y: 0.32 }, mx = mouse.x, my = mouse.y;
  var scrollT = 0, targetScroll = 0, dpr = Math.min(window.devicePixelRatio || 1, 1.6);
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var visible = true, running = true;

  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener("resize", resize);

  window.addEventListener("pointermove", function (e) {
    mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  var hero = document.getElementById("hero");
  var io = new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
  }, { threshold: 0 });
  io.observe(hero);

  document.addEventListener("visibilitychange", function () {
    running = !document.hidden;
    if (running && !reduced) requestAnimationFrame(loop);
  });

  var last = performance.now();
  function loop(now) {
    if (!running) return;
    var dt = Math.min((now - last) / 1000, 0.1); last = now;
    mx += (mouse.x - mx) * Math.min(dt * 4, 0.12);
    my += (mouse.y - my) * Math.min(dt * 4, 0.12);
    targetScroll = window.scrollY / Math.max(window.innerHeight, 1);
    scrollT += (targetScroll - scrollT) * Math.min(dt * 5, 0.15);

    if (visible && !reduced) {
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, now / 1000);
      gl.uniform2f(uMouse, mx, my);
      gl.uniform1f(uScroll, scrollT);
      gl.uniform1f(uAspect, canvas.width / Math.max(canvas.height, 1));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    requestAnimationFrame(loop);
  }
  if (!reduced) requestAnimationFrame(loop);
  else {
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, 4.0); gl.uniform2f(uMouse, mx, my);
    gl.uniform1f(uScroll, 0); gl.uniform1f(uAspect, canvas.width / canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
})();
