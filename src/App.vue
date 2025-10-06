<template>
  <div class="w-full h-full body-bg min-h-screen">
    <div class="bg-white p-5 shadow-md flex justify-between items-center">
      <h1 class="text-2xl font-normal text-gray-800">Reservations</h1>
      
      <button
        class="bg-purple-600 text-white hover:bg-purple-700 px-4 py-2 rounded-lg transition duration-150 shadow-md"
        @click="disableAllReservations"
        :disabled="!branches.length"
      >
        Disable All Reservations
      </button>
    </div>

    <div class="p-6">
      <div class="max-w-7xl mx-auto">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex justify-end mb-4">
            <button
              class="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition duration-150"
              @click="showAddBranches = true"
              :disabled="!disabledBranches.length"
            >
              Add Branches
            </button>
          </div>
          
          <div v-if="!branches.length" class="text-center p-10 text-gray-500">
            No branches with reservations enabled. Click "Add Branches" to start.
          </div>
          
          <BranchTable 
            v-else 
            :branches="branches" 
            @edit="openEditModal" 
          />
        </div>
      </div>
    </div>
    
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
      @disable="disableSingleBranch(editingBranch)"
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

    const disableSingleBranch = async (branch) => {
        if (!confirm(`Are you sure you want to disable reservations for branch: ${branch.name}?`)) return;

        try {
            // Simulate API call to disable reservations for a single branch
            // await api.put(`/branches/${branch.id}`, { accepts_reservations: false }); 
            alert(`Reservations disabled for branch: ${branch.name}.`);
            editingBranch.value = null; // Close the modal
            await fetchBranches();
        } catch (error) {
            console.error("Error disabling reservation for branch:", error);
            alert("Failed to disable reservations for the branch. Please try again.");
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
      disableSingleBranch,
      disabledBranches,
    };
  },
};
</script>