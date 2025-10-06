<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold text-center mb-6">Branches Reservations Management</h1>
    
    <div class="display-flex space-between w-full max-w-4xl margin-auto mb-4">
      <button
        class="add-btn"
        @click="showAddBranches = true"
        :disabled="!disabledBranches.length"
      >
        Add Branches ({{ disabledBranches.length }})
      </button>
      <button
        class="disable-btn"
        @click="disableAllReservations"
        :disabled="!branches.length"
      >
        Disable All Reservations
      </button>
    </div>
    
    <div v-if="!branches.length" class="text-center p-10 border rounded-lg text-gray-500 max-w-4xl margin-auto">
        No branches with reservations enabled. Click "Add Branches" to start.
    </div>
    
    <BranchTable v-else :branches="branches" @edit="openEditModal" />
    
    <AddBranchesModal
      v-if="showAddBranches"
      :branches="disabledBranches"
      @close="showAddBranches = false"
      @saved="fetchBranches"
    />

    <ReservationModal
      v-if="editingBranch"
      :branch="editingBranch"
      @close="editingBranch = null"
      @saved="fetchBranches"
    />
  </div>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import api from "./api";
import BranchTable from "./components/BranchTable.vue";
import AddBranchesModal from "./components/AddBranchesModal.vue";
import ReservationModal from "./components/ReservationModal.vue";

export default {
  components: { BranchTable, AddBranchesModal, ReservationModal },
  setup() {
    const allBranches = ref([]); // Stores all branches
    const showAddBranches = ref(false);
    const editingBranch = ref(null);

    const fetchBranches = async () => {
      try {
        const res = await api.get(
          "/branches?include[0]=sections&include[1]=sections.tables"
        );
        allBranches.value = res.data.data;
      } catch (error) {
        console.error("Error fetching branches:", error);
        alert("Failed to load branches. Check console for details.");
      }
    };

    const openEditModal = (branch) => {
      // Find the latest data for the branch before opening the modal
      const latestBranch = allBranches.value.find(b => b.id === branch.id);
      if (latestBranch) {
        editingBranch.value = latestBranch;
      } else {
         console.error("Branch not found for editing:", branch);
         alert("Could not load branch details for editing.");
      }
    };

    const disableAllReservations = async () => {
      if (!confirm(`Are you sure you want to disable reservations for ALL ${branches.value.length} branches?`)) return;
      
      try {
        // Only disable for branches that currently accept reservations
        await Promise.all(
          branches.value.map((b) =>
            api.put(`/branches/${b.id}`, { accepts_reservations: false })
          )
        );
        alert("Reservations disabled for all branches.");
        await fetchBranches();
      } catch (error) {
        console.error("Error disabling all reservations:", error);
        alert("Failed to disable all reservations. Please try again.");
      }
    };

    // Branches currently accepting reservations (for the table)
    const branches = computed(() =>
      allBranches.value.filter((b) => b.accepts_reservations)
    );
    
    // Branches not accepting reservations (for the AddBranches modal)
    const disabledBranches = computed(() =>
      allBranches.value.filter((b) => !b.accepts_reservations)
    );

    onMounted(fetchBranches);

    return {
      branches,
      showAddBranches,
      editingBranch,
      fetchBranches,
      openEditModal,
      disableAllReservations,
      disabledBranches,
    };
  },
};
</script>