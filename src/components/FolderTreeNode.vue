<template>
  <div class="folder-tree-node">
    <div
      class="flex items-center space-x-1 py-1 px-2 rounded hover:bg-gray-200 cursor-pointer"
      :class="{ 'bg-blue-100 text-blue-700': isCurrentPath }"
      @click="handleClick"
    >
      <button
        v-if="hasChildren"
        @click.stop="toggleExpanded"
        class="w-4 h-4 flex items-center justify-center text-xs"
      >
        {{ isExpanded ? '▼' : '▶' }}
      </button>
      <span v-else class="w-4"></span>

      <span class="text-sm">{{ getFolderIcon(folder.name) }}</span>
      <span class="text-sm truncate flex-1" :title="folder.name">{{ folder.name }}</span>
    </div>

    <div v-if="isExpanded && hasChildren" class="ml-4 space-y-1">
      <FolderTreeNode
        v-for="child in children"
        :key="child.id"
        :folder="child"
        :current-path="currentPath"
        :all-folders="allFolders"
        :expanded-folders="expandedFolders"
        @navigate="$emit('navigate', $event)"
        @toggle-expanded="$emit('toggle-expanded', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { type Folder, getFolderIcon } from '@/utils/files-api'

interface Props {
  folder: Folder
  currentPath: string
  allFolders: Folder[]
  expandedFolders: Set<number>
}

interface Emits {
  (e: 'navigate', path: string): void
  (e: 'toggle-expanded', folderId: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isExpanded = computed(() => {
  return props.expandedFolders.has(props.folder.id)
})

const children = computed(() => {
  return props.allFolders.filter((f) => f.parent_id === props.folder.id)
})

const hasChildren = computed(() => {
  return children.value.length > 0
})

const isCurrentPath = computed(() => {
  return props.currentPath === `/folder/${props.folder.id}`
})

function handleClick() {
  emit('navigate', `/folder/${props.folder.id}`)
}

function toggleExpanded() {
  emit('toggle-expanded', props.folder.id)
}
</script>
