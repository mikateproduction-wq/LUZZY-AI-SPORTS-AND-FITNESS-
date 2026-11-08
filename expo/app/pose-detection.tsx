import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { ArrowLeft, Zap } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { logger } from '@/utils/logger';

const POSE_HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; base-uri 'none'; form-action 'none'; object-src 'none'; frame-ancestors 'none'; script-src 'unsafe-inline' https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.3/dist/pose-detection.min.js; style-src 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; worker-src blob:;">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;overflow:hidden;width:100vw;height:100vh;font-family:system-ui,-apple-system,sans-serif}
#container{position:relative;width:100vw;height:100vh;display:flex;align-items:center;justify-content:center}
video{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;transform:scaleX(-1);display:none}
canvas{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;transform:scaleX(-1);pointer-events:none;display:none}
#start-screen{position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;z-index:20;background:linear-gradient(135deg,#0a0a1a 0%,#0f172a 100%)}
#start-icon{width:80px;height:80px;border-radius:24px;background:rgba(0,229,255,0.1);border:2px solid rgba(0,229,255,0.3);display:flex;align-items:center;justify-content:center;font-size:36px}
#start-title{color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px}
#start-sub{color:rgba(255,255,255,0.5);font-size:14px;text-align:center;padding:0 32px;line-height:1.5}
#start-btn{background:#00E5FF;color:#000;border:none;padding:16px 40px;border-radius:16px;font-size:16px;font-weight:800;cursor:pointer;letter-spacing:0.3px;opacity:0.4;pointer-events:none;transition:opacity 0.3s}
#start-btn.ready{opacity:1;pointer-events:auto}
#start-btn:active{opacity:0.8}
#lib-status{color:rgba(255,255,255,0.4);font-size:12px;text-align:center}
#ui{position:absolute;bottom:0;left:0;right:0;padding:16px 20px 40px;display:none;z-index:10;background:linear-gradient(transparent,rgba(0,0,0,0.7))}
#controls{display:flex;align-items:center;justify-content:center;gap:16px}
#flip-btn{width:52px;height:52px;border-radius:16px;background:rgba(255,255,255,0.15);border:none;cursor:pointer;font-size:22px;display:flex;align-items:center;justify-content:center}
#stop-btn{background:#FF3B5C;color:#fff;border:none;padding:14px 32px;border-radius:16px;font-size:15px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:8px}
#stop-btn:active,#flip-btn:active{opacity:0.7}
#info-row{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:12px}
#fps-badge{color:#00E5FF;font:bold 13px monospace;background:rgba(0,229,255,0.1);padding:4px 12px;border-radius:10px;border:1px solid rgba(0,229,255,0.2)}
#status-badge{color:#00E5FF;font:600 13px system-ui;background:rgba(0,229,255,0.1);padding:4px 14px;border-radius:10px;border:1px solid rgba(0,229,255,0.2);display:none}
#loading-overlay{position:absolute;top:0;left:0;right:0;bottom:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:14px;z-index:15;background:rgba(0,0,0,0.85)}
#loading-text{color:#fff;font-size:14px;font-weight:600;text-align:center;padding:0 24px}
.spinner{width:36px;height:36px;border:3px solid rgba(0,229,255,0.2);border-top:3px solid #00E5FF;border-radius:50%;animation:spin 0.9s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
#err-screen{position:absolute;top:0;left:0;right:0;bottom:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:32px;z-index:25;background:#0a0a1a}
#err-icon{font-size:48px}
#err-msg{color:rgba(255,255,255,0.8);font-size:15px;font-weight:600;text-align:center;line-height:1.6}
#retry-btn{background:rgba(255,255,255,0.1);color:#fff;border:1px solid rgba(255,255,255,0.2);padding:12px 28px;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer}
</style>
</head>
<body>
<div id="container">
  <video id="video" autoplay playsinline muted></video>
  <canvas id="canvas"></canvas>

  <div id="start-screen">
    <div id="start-icon">⚡</div>
    <div id="start-title">Détection de pose</div>
    <div id="start-sub">Analyse en temps réel de votre posture avec l'IA MoveNet</div>
    <button id="start-btn" onclick="startAll()">📷 Démarrer la caméra</button>
    <div id="lib-status">Chargement des bibliothèques IA...</div>
  </div>

  <div id="loading-overlay">
    <div class="spinner"></div>
    <div id="loading-text">Démarrage...</div>
  </div>

  <div id="err-screen">
    <div id="err-icon">⚠️</div>
    <div id="err-msg"></div>
    <button id="retry-btn" onclick="resetAll()">Réessayer</button>
  </div>

  <div id="ui">
    <div id="controls">
      <button id="flip-btn" onclick="flipCam()">🔄</button>
      <button id="stop-btn" onclick="stopAll()">⏹ Arrêter</button>
    </div>
    <div id="info-row">
      <span id="fps-badge" style="display:none">0 FPS</span>
      <span id="status-badge">Pose détectée</span>
    </div>
  </div>
</div>

<script>
// Polyfill for environments where navigator.mediaDevices might be undefined
if (typeof navigator !== 'undefined' && !navigator.mediaDevices) {
  navigator.mediaDevices = {};
}
if (typeof navigator !== 'undefined' && navigator.mediaDevices && !navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices.getUserMedia = function(constraints) {
    var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    if (!getUserMedia) {
      return Promise.reject(new Error('getUserMedia non supporté sur cet appareil'));
    }
    return new Promise(function(resolve, reject) {
      getUserMedia.call(navigator, constraints, resolve, reject);
    });
  };
}
</script>

<script>
var video = document.getElementById('video');
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var startScreen = document.getElementById('start-screen');
var loadingOverlay = document.getElementById('loading-overlay');
var loadingText = document.getElementById('loading-text');
var errScreen = document.getElementById('err-screen');
var errMsg = document.getElementById('err-msg');
var uiEl = document.getElementById('ui');
var fpsBadge = document.getElementById('fps-badge');
var statusBadge = document.getElementById('status-badge');
var startBtn = document.getElementById('start-btn');
var libStatus = document.getElementById('lib-status');

var SKEL = [[5,6],[5,7],[7,9],[6,8],[8,10],[5,11],[6,12],[11,12],[11,13],[13,15],[12,14],[14,16]];
var ANGLES = [[5,7,9],[6,8,10],[11,13,15],[12,14,16],[7,5,11],[8,6,12]];
var MIN_CONF = 0.3;

var stream = null;
var detector = null;
var rafId = null;
var facing = 'user';
var lastT = 0;
var fpsArr = [];
var running = false;
var tfReady = false;
var poseReady = false;

function checkLibsReady() {
  var tfOk = typeof tf !== 'undefined';
  var pdOk = typeof poseDetection !== 'undefined';
  if (tfOk && pdOk) {
    tfReady = true;
    poseReady = true;
    startBtn.classList.add('ready');
    libStatus.textContent = 'Prêt - appuyez pour démarrer';
    libStatus.style.color = 'rgba(0,229,255,0.7)';
  } else {
    var status = [];
    if (!tfOk) status.push('TF.js');
    if (!pdOk) status.push('MoveNet');
    libStatus.textContent = 'Chargement: ' + status.join(', ') + '...';
    setTimeout(checkLibsReady, 500);
  }
}

function showErr(msg) {
  loadingOverlay.style.display = 'none';
  errScreen.style.display = 'flex';
  errMsg.textContent = msg;
}

function resetAll() {
  errScreen.style.display = 'none';
  startScreen.style.display = 'flex';
}

function calcAngle(a, b, c) {
  var r = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  var d = Math.abs(r * 180 / Math.PI);
  return d > 180 ? Math.round(360 - d) : Math.round(d);
}

function setupCam(f) {
  return new Promise(function(resolve, reject) {
    if (stream) stream.getTracks().forEach(function(t) { t.stop(); });
    var constraints = {
      video: {
        facingMode: { ideal: f },
        width: { ideal: 640 },
        height: { ideal: 480 }
      },
      audio: false
    };
    navigator.mediaDevices.getUserMedia(constraints)
      .then(function(s) {
        stream = s;
        video.srcObject = stream;
        video.onloadedmetadata = function() {
          video.play()
            .then(function() { facing = f; resolve(); })
            .catch(reject);
        };
      })
      .catch(function(err) {
        // On echec de la contrainte facingMode, essayer sans contrainte
        if (f !== 'user') {
          navigator.mediaDevices.getUserMedia({ video: true, audio: false })
            .then(function(s) {
              stream = s;
              video.srcObject = stream;
              video.onloadedmetadata = function() {
                video.play()
                  .then(function() { facing = f; resolve(); })
                  .catch(reject);
              };
            })
            .catch(reject);
        } else {
          reject(err);
        }
      });
  });
}

function drawFrame(kps) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  SKEL.forEach(function(pair) {
    var i = pair[0], j = pair[1];
    var a = kps[i], b = kps[j];
    if ((a.score || 0) < MIN_CONF || (b.score || 0) < MIN_CONF) return;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00E5FF';
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;
  });
  kps.forEach(function(kp) {
    if ((kp.score || 0) < MIN_CONF) return;
    ctx.beginPath();
    ctx.arc(kp.x, kp.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#2979FF';
    ctx.shadowColor = '#2979FF';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(kp.x, kp.y, 7, 0, Math.PI * 2);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
  ANGLES.forEach(function(trio) {
    var ia = trio[0], ib = trio[1], ic = trio[2];
    var a = kps[ia], b = kps[ib], c = kps[ic];
    if ((a.score || 0) < MIN_CONF || (b.score || 0) < MIN_CONF || (c.score || 0) < MIN_CONF) return;
    var angle = calcAngle(a, b, c);
    var label = angle + '\u00b0';
    ctx.font = 'bold 13px monospace';
    var m = ctx.measureText(label);
    var pw = m.width + 8, ph = 18;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(b.x - pw / 2, b.y - ph - 12, pw, ph, 4);
    } else {
      ctx.rect(b.x - pw / 2, b.y - ph - 12, pw, ph);
    }
    ctx.fill();
    ctx.fillStyle = '#FF00FF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, b.x, b.y - 12 - ph / 2 + 1);
  });
}

function detect() {
  if (!running || !detector || video.readyState < 2) {
    if (running) rafId = requestAnimationFrame(detect);
    return;
  }
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  detector.estimatePoses(video, { flipHorizontal: false })
    .then(function(poses) {
      if (poses.length > 0 && poses[0].keypoints) {
        var kps = poses[0].keypoints;
        var valid = kps.filter(function(k) { return (k.score || 0) >= MIN_CONF; });
        if (valid.length >= 5) statusBadge.style.display = 'inline-block';
        else statusBadge.style.display = 'none';
        drawFrame(kps);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        statusBadge.style.display = 'none';
      }
      var now = performance.now();
      if (lastT > 0) {
        fpsArr.push(1000 / (now - lastT));
        if (fpsArr.length > 15) fpsArr.shift();
        var avg = fpsArr.reduce(function(s, v) { return s + v; }, 0) / fpsArr.length;
        fpsBadge.textContent = Math.round(avg) + ' FPS';
        fpsBadge.style.display = 'inline-block';
      }
      lastT = now;
    })
    .catch(function() { /* ignore frame errors */ })
    .finally(function() {
      if (running) rafId = requestAnimationFrame(detect);
    });
}

function startAll() {
  if (!tfReady || !poseReady) {
    libStatus.textContent = 'Bibliothèques encore en cours de chargement, veuillez patienter...';
    return;
  }
  startScreen.style.display = 'none';
  loadingOverlay.style.display = 'flex';

  loadingText.textContent = 'Accès caméra...';
  setupCam(facing)
    .then(function() {
      video.style.display = 'block';
      canvas.style.display = 'block';
      loadingText.textContent = 'Initialisation TF.js...';
      return tf.setBackend('webgl').catch(function() {
        // CPU fallback when WebGL is unavailable.
        return tf.setBackend('cpu');
      });
    })
    .then(function() {
      return tf.ready();
    })
    .then(function() {
      loadingText.textContent = 'Chargement du modèle MoveNet...';
      return poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
      );
    })
    .then(function(det) {
      detector = det;
      loadingOverlay.style.display = 'none';
      uiEl.style.display = 'block';
      running = true;
      rafId = requestAnimationFrame(detect);
    })
    .catch(function(e) {
      // Keep camera errors user-friendly; do not expose internals.
      var name = (e && e.name) || '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        showErr('Accès caméra refusé.\nVeuillez autoriser la caméra dans les réglages de votre appareil, puis réessayez.');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        showErr('Aucune caméra détectée sur cet appareil.');
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        showErr('La caméra est utilisée par une autre application.\nFermez-la et réessayez.');
      } else {
        showErr('Erreur interne. Fermez puis rouvrez cet écran.');
      }
    });
}

function flipCam() {
  var next = facing === 'user' ? 'environment' : 'user';
  setupCam(next).catch(function() { showErr('Impossible de changer de caméra.'); });
}

function stopAll() {
  running = false;
  if (rafId) cancelAnimationFrame(rafId);
  if (stream) stream.getTracks().forEach(function(t) { t.stop(); });
  stream = null;
  video.srcObject = null;
  video.style.display = 'none';
  canvas.style.display = 'none';
  uiEl.style.display = 'none';
  startScreen.style.display = 'flex';
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  fpsArr = [];
  lastT = 0;
  fpsBadge.style.display = 'none';
  statusBadge.style.display = 'none';
}

// Start checking for libraries immediately
checkLibsReady();
</script>

<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js" integrity="sha384-R4iglwC8w7UAyfRq7VUmXEPjrvYnoXIqhsbTUN07o6o8yKYeiTY0/Z6DzbsKgWZ3" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.3/dist/pose-detection.min.js" integrity="sha384-pjg3ZYfXdbqsHl42YTyNHeHMzvrwQUvEuQ7tTn6+tDmoUkSD3ItK1sBa73y1l0H3" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
</body>
</html>`;

export default function PoseDetectionScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const containerRef = useRef<View>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const tryInject = () => {
      const container = containerRef.current as unknown as HTMLDivElement | null;
      if (!container) {
        setTimeout(tryInject, 80);
        return;
      }
      if (iframeRef.current) return;

      const blob = new Blob([POSE_HTML], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);

      const iframe = document.createElement('iframe');
      iframe.src = blobUrl;
      iframe.allow = 'camera; autoplay';
      iframe.sandbox.add('allow-scripts', 'allow-same-origin', 'allow-modals');
      iframe.referrerPolicy = 'no-referrer';
      iframe.setAttribute('allowfullscreen', '');
      iframe.style.cssText =
        'border:none;width:100%;height:100%;position:absolute;top:0;left:0;';
      container.appendChild(iframe);
      iframeRef.current = iframe;

      (iframeRef as React.MutableRefObject<HTMLIFrameElement & { _blobUrl?: string } | null>).current!._blobUrl = blobUrl;
    };

    tryInject();

    return () => {
      if (iframeRef.current) {
        const blobUrl = (iframeRef.current as HTMLIFrameElement & { _blobUrl?: string })._blobUrl;
        if (blobUrl) URL.revokeObjectURL(blobUrl);
        iframeRef.current.remove();
        iframeRef.current = null;
      }
    };
  }, []);

  const renderNative = useCallback(() => {
    const WebView = require('react-native-webview').default;
    return (
      <WebView
        source={{ html: POSE_HTML, baseUrl: 'https://localhost' }}
        style={styles.webview}
        originWhitelist={['https://localhost']}
        javaScriptEnabled
        domStorageEnabled={false}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction
        mediaCapturePermissionGrantType="prompt"
        allowsProtectedMedia={false}
        allowFileAccess={false}
        allowUniversalAccessFromFileURLs={false}
        allowFileAccessFromFileURLs={false}
        mixedContentMode="never"
        androidLayerType="hardware"
        setSupportMultipleWindows={false}
        onShouldStartLoadWithRequest={(request: { url: string }) => {
          const allowedUrls = new Set([
            'about:blank',
            'https://localhost/',
            'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js',
            'https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.3/dist/pose-detection.min.js',
          ]);
          return allowedUrls.has(request.url) || request.url.startsWith('data:text/html');
        }}
        onError={(e: any) => logger.error('[Pose] WebView error', e.nativeEvent)}
        onHttpError={(e: any) => logger.warn('[Pose] HTTP error', e.nativeEvent)}
        onMessage={(e: any) => logger.log('[Pose] msg', e.nativeEvent.data)}
        onLoadStart={() => logger.log('[Pose] WebView loading')}
        onLoad={() => logger.log('[Pose] WebView loaded')}
      />
    );
  }, []);

  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_bottom' }} />
      <View style={styles.fullScreen}>
        {Platform.OS === 'web' ? (
          <View ref={containerRef} style={styles.fullScreen} />
        ) : (
          renderNative()
        )}

        <View
          style={[styles.backOverlay, { paddingTop: insets.top + 8 }]}
          pointerEvents="box-none"
        >
          <View style={styles.topBar} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              testID="pose-detection.back"
            >
              <ArrowLeft color="#FFFFFF" size={22} />
            </TouchableOpacity>

            <View style={styles.titleRow}>
              <Animated.View
                style={{
                  opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
                }}
              >
                <Zap color="#00E5FF" size={16} />
              </Animated.View>
              <Text style={styles.titleText}>Squelette IA</Text>
            </View>

            <View style={styles.filler} />
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  backOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  topBar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  titleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  filler: {
    width: 40,
  },
});
