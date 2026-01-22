<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>⚡️ Kontador</v-toolbar-title>
      
    </v-app-bar>

    <v-navigation-drawer app v-model="drawer" temporary>
      <v-list nav dense>

        <v-list-item link :to="{ path: '/meter' }" @click="drawer = false">
          <div class="d-flex align-center gap-3">
            <v-icon>mdi-flash</v-icon>
            <span>Electric Meter Entry</span>
          </div>
        </v-list-item>

        <v-list-item link :to="{ path: '/setup' }" @click="drawer = false">
          <div class="d-flex align-center gap-3">
            <v-icon>mdi-home-edit</v-icon>
            <span>Apartment Setup</span>
          </div>
        </v-list-item>

        <v-list-item link :to="{ path: '/latest' }" @click="drawer = false">
          <div class="d-flex align-center gap-3">
            <v-icon>mdi-table</v-icon>
            <span>Latest Meter Entries</span>
          </div>
        </v-list-item>

        <v-list-item link :to="{ path: '/maintenance' }" @click="drawer = false">
          <div class="d-flex align-center gap-3">
            <v-icon>mdi-database</v-icon>
            <span>Database</span>
          </div>
        </v-list-item>

      </v-list>
    </v-navigation-drawer>

    <v-main>
      <router-view />
    </v-main>

    <v-slide-y-reverse-transition>
      
      <v-card
        v-if="(showInstallBanner || (isIOS && !isInstalled)) && !closeBanner"
        class="install-banner"
        elevation="8"
      >
        <div class="install-content">
          <div>
            <strong>Install Kontador</strong><br />
            <small v-if="!isIOS">Access faster, works offline ⚡</small>

            <small v-else>
              Tap
              <v-icon size="16" class="mx-1">mdi-export-variant</v-icon>
              then <b>Add to Home Screen</b>
            </small>
          </div>

          <div class="actions">
            <!-- Normal install button (Android / Desktop) -->
            <v-btn
              v-if="!isIOS"
              color="yellow-darken-2"
              prepend-icon="mdi-download"
              @click="installPWA"
            >
              Install
            </v-btn>

            <!-- iOS has no install button -->
            <v-btn
              icon
              variant="text"
              @click="dismissBanner"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
        </div>
      </v-card>

    </v-slide-y-reverse-transition>


  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const drawer = ref(false)


const deferredPrompt = ref(null)
const showInstallBanner = ref(false)
const closeBanner = ref(false);
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
console.log('is ios: ', isIOS);

onMounted(() => {
  // Already installed? Don’t show banner
  const isInstalled =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
    console.log('is installed: ', isInstalled);

  if (isInstalled) return

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt.value = e
    showInstallBanner.value = true
  })
})

const installPWA = async () => {
  if (!deferredPrompt.value) return

  deferredPrompt.value.prompt()
  const { outcome } = await deferredPrompt.value.userChoice

  deferredPrompt.value = null
  showInstallBanner.value = false

  if (outcome === 'accepted') {
    console.log('PWA installed')
  }
}

const dismissBanner = () => {
  showInstallBanner.value = false
  closeBanner.value = true;
}
</script>

<style>
.install-banner {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  max-width: 520px;
  border-radius: 16px;
  z-index: 9999;
}

.install-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>