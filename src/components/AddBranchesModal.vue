<template>
  <div class="modal-overlay">
    <div class="modal w-96">
      <h2 class="modal-title">Enable Reservations</h2>

      <div class="modal-content">
        <div v-if="branches.length === 0" class="text-gray-500">
          All branches currently have reservations enabled.
        </div>
        <div v-else class="grid-container">
          <div v-for="branch in branches" :key="branch.id" class="branch-item">
            <label class="branch-label">
              <input type="checkbox" v-model="selected" :value="branch.id" class="form-checkbox h-5 w-5 text-blue-600"/>
              <span class="branch-text">{{ branch.name }} ({{ branch.reference }})</span>
            </label>
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button class="cancel-btn" @click="$emit('close')">Cancel</button>
        <button class="save-btn" @click="save" :disabled="selected.length === 0">
          Enable ({{ selected.length }})
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import api from "../api";
import { ref } from "vue";

export default {
  props: ["branches"],
  emits: ["close", "saved"],
  setup(props, { emit }) {
    const selected = ref([]);

    const save = async () => {
      if (selected.value.length === 0) return;

      try {
        await Promise.all(
          selected.value.map((id) =>
            api.put(`/branches/${id}`, { accepts_reservations: true })
          )
        );
        emit("saved");
      } catch (error) {
        console.error("Error enabling reservations:", error);
        alert("Failed to enable reservations for selected branches.");
      }
      emit("close");
    };

    return { selected, save };
  },
};
</script>