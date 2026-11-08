import React, { useCallback, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { Rotate3d } from 'lucide-react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ExerciseDiagram from '@/components/ExerciseDiagram';
import {
  CLIP_CYCLE_SECONDS,
  EXERCISE_3D_MODEL,
  getClipKeyForExercise,
  is3DAnimationReady,
} from '@/constants/exercise3d';
import type { ExerciseCategory } from '@/types/fitness';

interface Exercise3DAnimationProps {
  /** English source name of the exercise (used for clip mapping). */
  exerciseName: string;
  category: ExerciseCategory;
  height?: number;
}

interface ViewerHtmlParams {
  riggedUrl: string;
  clipUrl: string;
  background: string;
  accent: string;
  textColor: string;
  loadingText: string;
  hasFront: boolean;
  frontAxis: string;
  upAxis: string;
  cycleSeconds: number;
}

/**
 * Builds the self-contained three.js viewer page.
 *
 * Guards against the classic generated-3D mistakes:
 * - renders the RIGGED GLB (the plain GLB has no skeleton — clips silently no-op);
 * - ONE AnimationMixer bound to the rigged scene, clips bound directly (never retargeted);
 * - skinned-aware bounds (Box3.setFromObject under-reports rigged GLBs ~100x);
 * - orientation correction derived from generation metadata, no guessed rotations;
 * - container → runtime → visual hierarchy, the loaded scene is never moved directly;
 * - capped pixel ratio, context-loss + timeout + error reporting to the host app.
 */
function buildViewerHtml(params: ViewerHtmlParams): string {
  const config = JSON.stringify({
    riggedUrl: params.riggedUrl,
    clipUrl: params.clipUrl,
    hasFront: params.hasFront,
    frontAxis: params.frontAxis,
    upAxis: params.upAxis,
    cycle: params.cycleSeconds,
  });

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: ${params.background}; }
  #c { width: 100%; height: 100%; display: block; touch-action: none; }
  #loader { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 10px; }
  .spin { width: 32px; height: 32px; border-radius: 50%; border: 3px solid ${params.accent}33; border-top-color: ${params.accent}; animation: r 0.9s linear infinite; }
  @keyframes r { to { transform: rotate(360deg); } }
  #msg { color: ${params.textColor}; font-family: -apple-system, system-ui, sans-serif; font-size: 12px; opacity: 0.7; }
</style>
</head>
<body>
<canvas id="c"></canvas>
<div id="loader"><div class="spin"></div><div id="msg">${params.loadingText}</div></div>
<script type="module">
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/+esm';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js/+esm';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js/+esm';

var CONFIG = ${config};
var failed = false;

function notify(payload) {
  try {
    var s = JSON.stringify(payload);
    if (window.ReactNativeWebView) { window.ReactNativeWebView.postMessage(s); }
    else if (window.parent && window.parent !== window) { window.parent.postMessage(s, '*'); }
  } catch (e) {}
}

function fail(message) {
  if (failed) return;
  failed = true;
  var spinner = document.querySelector('.spin');
  if (spinner) spinner.remove();
  var msg = document.getElementById('msg');
  if (msg) msg.textContent = 'Animation 3D indisponible';
  notify({ type: 'error', message: String(message || 'unknown') });
}

window.addEventListener('error', function (e) { fail(e && e.message ? e.message : 'script error'); });
var loadTimeout = setTimeout(function () { fail('timeout'); }, 25000);

var AXES = {
  positiveX: [1, 0, 0], negativeX: [-1, 0, 0],
  positiveY: [0, 1, 0], negativeY: [0, -1, 0],
  positiveZ: [0, 0, 1], negativeZ: [0, 0, -1]
};

function axisVector(name) {
  var a = AXES[name] || AXES.positiveZ;
  return new THREE.Vector3(a[0], a[1], a[2]);
}

function basisQuaternion(front, up) {
  var f = front.clone().normalize();
  var r = new THREE.Vector3().crossVectors(up, f).normalize();
  var u = new THREE.Vector3().crossVectors(f, r).normalize();
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(r, u, f));
}

function orientationCorrection(frontAxis, upAxis, desiredForward) {
  var local = basisQuaternion(axisVector(frontAxis), axisVector(upAxis));
  var world = basisQuaternion(desiredForward, new THREE.Vector3(0, 1, 0));
  return world.multiply(local.invert());
}

// Skinned-aware bounds: rigged GLBs ship an Armature scaled 0.01 while geometry
// is authored in meters — Box3.setFromObject reports ~1% of the rendered size.
function measureModel(object) {
  object.updateMatrixWorld(true);
  var inv = object.matrixWorld.clone().invert();
  var box = new THREE.Box3();
  var childBox = new THREE.Box3();
  var toRoot = new THREE.Matrix4();
  object.traverse(function (node) {
    if (!node.isMesh || !node.geometry) return;
    if (node.isSkinnedMesh) {
      node.skeleton.update();
      node.computeBoundingBox();
      childBox.copy(node.boundingBox);
    } else {
      if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
      childBox.copy(node.geometry.boundingBox);
    }
    toRoot.multiplyMatrices(inv, node.matrixWorld);
    box.union(childBox.clone().applyMatrix4(toRoot));
  });
  return box;
}

async function init() {
  var canvas = document.getElementById('c');
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 50);
  camera.position.set(1.1, 1.5, 2.7);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3f4a, 1.15));
  var key = new THREE.DirectionalLight(0xffffff, 2.0);
  key.position.set(2, 4, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 12;
  scene.add(key);
  var rim = new THREE.DirectionalLight(0x9bb8ff, 0.6);
  rim.position.set(-2, 2.5, -2);
  scene.add(rim);

  var floor = new THREE.Mesh(new THREE.CircleGeometry(2.2, 48), new THREE.ShadowMaterial({ opacity: 0.28 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Placement contract: container → runtime → visual → loaded scene.
  var container = new THREE.Group();
  var runtime = new THREE.Group();
  var visual = new THREE.Group();
  container.add(runtime);
  runtime.add(visual);
  scene.add(container);

  var loader = new GLTFLoader();
  var results = await Promise.all([loader.loadAsync(CONFIG.riggedUrl), loader.loadAsync(CONFIG.clipUrl)]);
  var modelGltf = results[0];
  var clipGltf = results[1];

  var model = modelGltf.scene;
  model.traverse(function (node) {
    if (node.isMesh) {
      node.castShadow = true;
      // Skinned bounds lag the animated pose — disable culling so the coach
      // never blinks out mid-clip at close camera angles.
      node.frustumCulled = false;
    }
  });
  visual.add(model);

  // Normalize ONCE on the visual group: scale to 1.7 m, face the camera side,
  // then center X/Z and ground Y from re-measured post-transform bounds.
  var raw = measureModel(visual);
  var rawHeight = Math.max(raw.max.y - raw.min.y, 1e-6);
  visual.scale.setScalar(1.7 / rawHeight);
  if (CONFIG.hasFront) {
    visual.quaternion.premultiply(orientationCorrection(CONFIG.frontAxis, CONFIG.upAxis, new THREE.Vector3(0, 0, 1)));
  }
  var fitted = measureModel(runtime);
  var center = fitted.getCenter(new THREE.Vector3());
  visual.position.x -= center.x;
  visual.position.z -= center.z;
  visual.position.y -= fitted.min.y;

  // ONE mixer bound to the rigged scene; the clip GLB shares its auto-rig
  // skeleton, so the clip binds directly (never retarget same-rig clips).
  var clip = clipGltf.animations && clipGltf.animations.length > 0 ? clipGltf.animations[0] : null;
  if (!clip) throw new Error('missing animation clip');
  var mixer = new THREE.AnimationMixer(model);
  var action = mixer.clipAction(clip);
  action.setLoop(THREE.LoopRepeat, Infinity);
  // Normalize every loop to CONFIG.cycle seconds (instructional tempo).
  action.timeScale = clip.duration > 0 ? clip.duration / CONFIG.cycle : 1;
  action.play();

  var controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.85, 0);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minPolarAngle = 0.7;
  controls.maxPolarAngle = 1.62;

  var clock = new THREE.Clock();
  renderer.setAnimationLoop(function () {
    mixer.update(clock.getDelta());
    controls.update();
    renderer.render(scene, camera);
  });

  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  canvas.addEventListener('webglcontextlost', function (e) {
    e.preventDefault();
    fail('webgl context lost');
  });

  clearTimeout(loadTimeout);
  var loaderEl = document.getElementById('loader');
  if (loaderEl) loaderEl.remove();
  notify({ type: 'ready' });
}

init().catch(function (e) { fail(e && e.message ? e.message : e); });
</script>
</body>
</html>`;
}

/**
 * 3D movement demonstration for an exercise. Renders the generated animated
 * coach inside an isolated WebGL surface, and gracefully falls back to the
 * legacy 2D diagram when the 3D assets are unavailable or fail to load.
 */
export default function Exercise3DAnimation({
  exerciseName,
  category,
  height = 320,
}: Exercise3DAnimationProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [failed, setFailed] = useState<boolean>(false);

  const clipKey = getClipKeyForExercise(exerciseName, category);
  const clipUrl = EXERCISE_3D_MODEL.clips[clipKey];
  const ready = is3DAnimationReady() && clipUrl.length > 0;

  const html = useMemo(() => {
    if (!ready) return '';
    return buildViewerHtml({
      riggedUrl: EXERCISE_3D_MODEL.riggedGlbUrl,
      clipUrl,
      background: theme.colors.surface,
      accent: theme.colors.primary,
      textColor: theme.colors.textSecondary,
      loadingText: t('exercise3d.loading'),
      hasFront: EXERCISE_3D_MODEL.hasIntrinsicFront,
      frontAxis: EXERCISE_3D_MODEL.localFrontAxis,
      upAxis: EXERCISE_3D_MODEL.localUpAxis,
      cycleSeconds: CLIP_CYCLE_SECONDS,
    });
  }, [ready, clipUrl, theme.colors.surface, theme.colors.primary, theme.colors.textSecondary, t]);

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as { type?: string };
      if (data.type === 'error') setFailed(true);
    } catch {
      // Ignore non-JSON messages.
    }
  }, []);

  const handleWebViewError = useCallback(() => setFailed(true), []);

  if (!ready || failed) {
    return (
      <View style={styles.fallbackContainer}>
        <ExerciseDiagram exerciseType={exerciseName} size={180} />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.viewerFrame,
          { height, backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        {Platform.OS === 'web' ? (
          React.createElement('iframe' as never, {
            srcDoc: html,
            sandbox: 'allow-scripts',
            style: { width: '100%', height: '100%', border: 'none', display: 'block' },
            title: 'Animation 3D du mouvement',
          })
        ) : (
          <WebView
            source={{ html }}
            originWhitelist={['*']}
            javaScriptEnabled
            domStorageEnabled
            scrollEnabled={false}
            overScrollMode="never"
            setSupportMultipleWindows={false}
            allowsFullscreenVideo={false}
            allowFileAccess={false}
            allowFileAccessFromFileURLs={false}
            allowUniversalAccessFromFileURLs={false}
            mediaPlaybackRequiresUserAction
            mixedContentMode="never"
            cacheEnabled={false}
            onShouldStartLoadWithRequest={(request) => {
              // The viewer is a fixed srcDoc page — block any navigation
              // attempt (MASWE-0035): only the initial page may load.
              return (
                request.url.startsWith('about:') ||
                request.url.startsWith('data:') ||
                request.mainDocumentURL === request.url
              );
            }}
            onMessage={handleMessage}
            onError={handleWebViewError}
            style={styles.webview}
          />
        )}
      </View>
      <View style={styles.hintRow}>
        <Rotate3d size={14} color={theme.colors.textSecondary} />
        <Text style={[styles.hintText, { color: theme.colors.textSecondary }]}>
          Boucle 3D de {CLIP_CYCLE_SECONDS} s · pivotez le coach avec le doigt
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  fallbackContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerFrame: {
    width: '100%',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  hintText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
});
