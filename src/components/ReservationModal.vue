<template>
  <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div class="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden">
      <!-- Header -->
      <div class="border-b border-gray-200 p-5">
        <h2 class="text-xl font-semibold text-gray-800">
          Edit {{ branch.name }} branch reservation settings
        </h2>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
        <!-- Working hours info -->
        <div class="bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-md text-sm">
          Branch working hours are 00:00 - 00:00
        </div>

        <!-- Reservation Duration -->
        <div>
          <label class="block text-gray-700 font-medium mb-1">
            Reservation Duration (minutes)
            <span class="text-red-500">*</span>
          </label>
          <input
            type="number"
            v-model.number="form.reservation_duration"
            min="1"
            required
            class="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
          />
        </div>

        <!-- Tables -->
        <div>
          <label class="block text-gray-700 font-medium mb-1">
            Tables <span class="text-red-500">*</span>
          </label>
          <div
            v-if="tablesOptions.length"
            class="flex flex-wrap gap-2 border border-gray-200 rounded-lg p-2 bg-gray-50"
          >
            <span
              v-for="table in selectedTablesLabels"
              :key="table"
              class="px-3 py-1 rounded-full border border-purple-400 bg-white text-purple-700 text-sm"
            >
              {{ table }}
            </span>
            <select
              v-model="form.tables"
              multiple
              class="flex-1 border-none bg-transparent text-gray-600 text-sm outline-none"
            >
              <option v-for="table in tablesOptions" :key="table.id" :value="table.id">
                {{ table.name }}
              </option>
            </select>
          </div>
          <div v-else class="text-red-500 text-sm mt-1">
            **Warning:** This branch has no available tables data.
          </div>
        </div>

        <!-- Days and time slots -->
        <div v-for="day in daysOfWeek" :key="day" class="border border-gray-200 bg-gray-50 rounded-lg p-4">
          <div class="flex justify-between items-center mb-3">
            <label class="font-semibold text-gray-700 capitalize">{{ day }}</label>
            <button
              v-if="day === 'saturday'"
              class="text-purple-600 hover:underline text-sm font-medium"
              @click="applySaturdayToAll"
            >
              Apply on all days
            </button>
          </div>

          <div v-for="(slot, idx) in form.reservation_times[day]" :key="idx" class="flex items-center gap-3 mb-2">
            <div class="flex items-center gap-2">
              <input
                type="time"
                v-model="form.reservation_times[day][idx][0]"
                class="border-2 border-purple-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none"
              />
              <span class="text-gray-500">-</span>
              <input
                type="time"
                v-model="form.reservation_times[day][idx][1]"
                class="border-2 border-purple-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none"
              />
            </div>
            <button
              class="bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-300 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold"
              @click="removeSlot(day, idx)"
            >
              ×
            </button>
          </div>

          <button
            class="flex items-center justify-center w-24 h-6 border border-purple-300 rounded-full text-purple-600 hover:bg-purple-100 transition"
            @click="addSlot(day)"
            :disabled="form.reservation_times[day].length >= 3"
          >
            Add slot
          </button>

          <p
            v-if="form.reservation_times[day].length >= 3"
            class="text-xs text-red-500 mt-1"
          >
            Maximum 3 slots per day.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t border-gray-200 p-5 flex items-center justify-between bg-gray-50">
        <button
          class="text-red-500 hover:text-red-600 font-medium text-sm"
          @click="$emit('disable')"
        >
          Disable Reservations
        </button>

        <div class="flex gap-3">
          <button
            class="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
            @click="$emit('close')"
          >
            Close
          </button>
          <button
            class="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium"
            @click="save"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, computed } from "vue";
import api from "../api";

export default {
  props: ["branch"],
  emits: ["close", "saved", "disable"],
  setup(props, { emit }) {
    const daysOfWeek = [
      "saturday",
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
    ];

    const tablesOptions = computed(() =>
      (props.branch.sections || []).flatMap((s) =>
        (s.tables || []).map((t) => ({ id: t.id, name: `${s.name} - ${t.name}` }))
      )
    );

    const initialReservationTimes = {};
    daysOfWeek.forEach(
      (day) =>
        (initialReservationTimes[day] =
          props.branch.reservation_times?.[day]?.map((slot) => [...slot]) || [])
    );

    const initialSelectedTables = (props.branch.sections || [])
      .flatMap((s) => s.tables || [])
      .filter((t) => t.accepts_reservations)
      .map((t) => t.id);

    const form = reactive({
      reservation_duration: props.branch.reservation_duration || 60,
      tables: initialSelectedTables,
      reservation_times: initialReservationTimes,
    });

    const selectedTablesLabels = computed(() =>
      tablesOptions.value
        .filter((t) => form.tables.includes(t.id))
        .map((t) => t.name)
    );

    const addSlot = (day) => {
      if (form.reservation_times[day].length < 3)
        form.reservation_times[day].push(["", ""]);
    };

    const removeSlot = (day, idx) => form.reservation_times[day].splice(idx, 1);

    const applySaturdayToAll = () => {
      const saturdaySlots = form.reservation_times["saturday"].map((slot) => [...slot]);
      daysOfWeek.forEach((day) => {
        if (day !== "saturday") {
          form.reservation_times[day] = saturdaySlots.map((slot) => [...slot]);
        }
      });
    };

    const validateForm = () => {
      if (!form.reservation_duration || form.reservation_duration <= 0) {
        alert("Please enter a valid reservation duration (greater than 0 minutes).");
        return false;
      }

      if (!form.tables || form.tables.length === 0) {
        alert("Please select at least one table for reservations.");
        return false;
      }

      for (const day of daysOfWeek) {
        for (const slot of form.reservation_times[day]) {
          if (!slot[0] && !slot[1]) continue;

          if (!slot[0] || !slot[1]) {
            alert(`Incomplete slot for ${day}.`);
            return false;
          }

          if (slot[0] >= slot[1]) {
            alert(`Invalid time slot for ${day}.`);
            return false;
          }
        }
      }
      return true;
    };

    const save = async () => {
      if (!validateForm()) return;
      try {
        const payloadReservationTimes = {};
        for (const day of daysOfWeek) {
          payloadReservationTimes[day] = form.reservation_times[day].filter(
            (slot) => slot[0] && slot[1]
          );
        }

        const payload = {
          reservation_duration: form.reservation_duration,
          tables: form.tables,
          reservation_times: payloadReservationTimes,
        };

        await api.put(`/branches/${props.branch.id}`, payload);
        emit("saved");
        emit("close");
      } catch (error) {
        console.error("Error saving:", error);
        alert("Failed to save reservation settings.");
      }
    };

    return {
      form,
      tablesOptions,
      daysOfWeek,
      selectedTablesLabels,
      addSlot,
      removeSlot,
      applySaturdayToAll,
      save,
    };
  },
};
</script>