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
  </v-app>
</template>

<script setup>
import { ref } from 'vue'
const drawer = ref(false)
</script>
