<template>
  <div>
    {{message}}
    <FileLoader no-files-message="Drop here" />
  </div>
</template>

<script>
import FileLoader from './components/FileLoader.vue'

export default {
  'name': 'app',
  components: {
    FileLoader
  },
  data() {
    return {
      message: "Hello"
    }
  }
}
</script>

<!-- vim: set backupcopy=yes :-->
