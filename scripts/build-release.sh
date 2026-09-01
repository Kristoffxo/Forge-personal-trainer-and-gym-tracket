#!/bin/bash
# ---------------------------------------------------------------
#  Builds what Google Play needs, and what you need to sideload.
#
#    scripts/build-release.sh
#
#  Reads the keystore password from the file beside the keystore.
#  Everything it produces lands in ~/Desktop/reppo.
# ---------------------------------------------------------------
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$HOME/Desktop/reppo"
KS="$OUT/keystore/reppo-upload.jks"
PWFILE="$OUT/keystore/password.txt"

[ -f "$KS" ] || { echo "No keystore at $KS"; exit 1; }
[ -f "$PWFILE" ] || { echo "No password at $PWFILE"; exit 1; }

export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"

export REPPO_STORE_FILE="$KS"
export REPPO_STORE_PASSWORD="$(cat "$PWFILE")"
export REPPO_KEY_ALIAS="reppo-upload"
export REPPO_KEY_PASSWORD="$REPPO_STORE_PASSWORD"

cd "$ROOT"
echo "→ web build (the JS both platforms run)"
npm run build:web >/dev/null

echo "→ native project"
npx expo prebuild --platform android --clean >/dev/null 2>&1

#  The signing block cannot live in app/build.gradle: prebuild --clean
#  rewrites that file every time. It is patched in here instead, from
#  the environment, so no password is ever written to disk in the repo.
python3 - "$ROOT" <<'PY'
import pathlib, sys, re
p = pathlib.Path(sys.argv[1]) / 'android/app/build.gradle'
s = p.read_text()
s = s.replace("""        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }""",
"""        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            storeFile file(System.getenv("REPPO_STORE_FILE"))
            storePassword System.getenv("REPPO_STORE_PASSWORD")
            keyAlias System.getenv("REPPO_KEY_ALIAS")
            keyPassword System.getenv("REPPO_KEY_PASSWORD")
        }""", 1)
s = s.replace("""            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug""",
"""            signingConfig signingConfigs.release""", 1)
assert 'signingConfigs.release' in s and 'REPPO_STORE_FILE' in s, 'signing patch did not apply'
p.write_text(s)
print('   signing config patched in')
PY

cd android
echo "→ .aab for Play (every architecture, Google splits it per device)"
./gradlew bundleRelease --no-daemon -q
echo "→ .apk for sideloading (arm64 only, half the size)"
./gradlew assembleRelease --no-daemon -q -PreactNativeArchitectures=arm64-v8a

mkdir -p "$OUT"
cp app/build/outputs/bundle/release/app-release.aab "$OUT/reppo.aab"
cp app/build/outputs/apk/release/app-release.apk "$OUT/reppo.apk"

echo
echo "Done:"
ls -lh "$OUT"/reppo.aab "$OUT"/reppo.apk | awk '{print "  "$9"  "$5}'
