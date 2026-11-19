<script setup lang="ts">
import type { Perfil } from '../api/http';

defineProps<{ opcoes: { valor: Perfil; rotulo: string }[]; rotulo: string }>();
const perfil = defineModel<Perfil>({ required: true });
</script>

<template>
  <div class="perfis" role="radiogroup" :aria-label="rotulo">
    <span class="perfis-rotulo">{{ rotulo }}</span>
    <label v-for="o in opcoes" :key="o.valor">
      <input v-model="perfil" type="radio" name="perfil" :value="o.valor" />
      {{ o.rotulo }}
    </label>
  </div>
</template>
