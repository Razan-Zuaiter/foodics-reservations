<template>
  <table class="branch-table margin-auto margin-bottom-1 shadow-md">
    <thead>
      <tr>
        <th>Name</th>
        <th>Reference</th>
        <th>Tables</th>
        <th>Duration (min)</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="branch in branches"
        :key="branch.id"
        class="branch-row"
        @click="$emit('edit', branch)"
      >
        <td>{{ branch.name }}</td>
        <td>{{ branch.reference }}</td>
        <td>
          {{
            branch.sections
              ? branch.sections
                  .flatMap((s) => s.tables || [])
                  .filter((t) => t.accepts_reservations).length
              : 0
          }}
        </td>
        <td>{{ branch.reservation_duration || 'N/A' }}</td>
        <td>
          <button class="edit-btn" @click.stop="$emit('edit', branch)">Edit Settings</button>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script>
export default {
  props: {
    branches: {
      type: Array,
      required: true,
      default: () => [],
    },
  },
  emits: ['edit'],
};
</script>