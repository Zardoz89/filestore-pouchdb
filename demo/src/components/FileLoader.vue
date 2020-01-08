/**
 * FileLoader.vue
 * Load file data from the user to a JS array
 */
<template>
  <div>
    <input id="file"
           type="file"
           multiple
           style="display: none"
           @change="handleFiles"
    />
    {{ files }}
    <div v-if="isEmpty"
         class="filelist filelist__empty"
         @click="openFileDialog"
         @dragenter.stop.prevent
         @dragover.stop.prevent="dragFilesOver"
         @drop.stop.prevent="dragFiles" >
      {{ noFilesMessage }}
    </div>
    <div v-else
         class="filelist"
         @dragenter.stop.prevent
         @dragover.stop.prevent="dragFilesOver"
         @drop.stop.prevent="dragFiles" >
      <ul>
        <li v-for="file in files">
          {{ file }}
          <button @click="openFileDialog">Add files</button>
        </li>
      </ul>
      <button @click="openFileDialog">Add files</button>
      <!--
      <v-list two-line subheader >
        <v-subheader>Files</v-subheader>
        <v-list-item v-for="(file, index) in fileList"
                     :key="index"
                     :class="{ fileitem__loading: file.data.length == 0 }"
        >
          <v-list-item-avatar>
            <v-icon >audiotrack</v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>{{ file.name }}</v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
            <v-list-item-action-text v-if="file.data.length > 0">{{ file.data.length | prettyFileSize }}</v-list-item-action-text>
            <v-menu offset-y @click.stop >
              <template v-slot:activator="{ on }">
                <v-btn icon
                       ripple
                       v-on="on" >
                  <v-icon>menu</v-icon>
                </v-btn>
              </template>
              <v-list>
                <v-list-item @click.stop="playFile(index)">
                  <v-list-item-action>
                    <v-icon>play_circle_outline</v-icon>
                  </v-list-item-action>
                  <v-list-item-title>Play</v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <v-list-item-action>
                    <v-icon>settings</v-icon>
                  </v-list-item-action>
                  <v-list-item-title>Global settings</v-list-item-title>
                </v-list-item>
                <v-divider inset></v-divider>
                <v-list-item @click.stop="removeFile(index)" >
                  <v-list-item-action>
                    <v-icon>delete_forever</v-icon>
                  </v-list-item-action>
                  <v-list-item-title>Remove</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-list-item-action>
        </v-list-item>

      </v-list> -->
    </div><!-- v-else -->
  </div>
</template>

<script>
// import { mapState } from 'vuex'
// import { Howl } from 'howler'

export default {
  name: 'FileLoader',
  filters: {
    prettyFileSize(sizeOnBytes) {
      if (typeof sizeOnBytes === 'undefined') {
        return '0 Bytes'
      }
      if (sizeOnBytes < 1024) {
        return `${sizeOnBytes} Bytes`
      }
      sizeOnBytes = sizeOnBytes / 1024
      if (sizeOnBytes < 1024) {
        return `${sizeOnBytes.toFixed(2)} KiB`
      }
      sizeOnBytes = sizeOnBytes / 1024
      return `${sizeOnBytes.toFixed(2)} MiB`
    }
  },

  props: {
    noFilesMessage: {type: String, default: 'Drop files here'}
  },

  data() {
    return {
      files: []
    }
  },

  computed: {
    getFileCount() {
      return this.files.length //this.$store.getters.getFileCount
    },
    isEmpty() {
      return this.files.length <= 0 //this.$store.getters.getFileCount <= 0
    },
    /*...mapState([
      'fileList'
    ])*/
  },

  methods: {
    handleFiles(evt) {
      const files = evt.target.files
      if (!files.length) {
        return
      }
      for (const file of files) {
        this.uploadFile(file)
      }
    },
    uploadFile(file) {
      let entry = {name: file.name, data: []}
      let reader = new FileReader()
      reader.onload = (evt) => {
        entry.data = evt.target.result
        console.log("file loaded")
        this.files.push(file.name)
      }
      reader.readAsDataURL(file)
    },
    dragFiles(evt) {
      const dt = evt.dataTransfer
      const files = dt.files
      if (!files.length) {
        return
      }
      for (const file of files) {
        this.uploadFile(file)
      }
    },
    dragFilesOver(evt) {
      evt.dataTransfer.dropEffect = 'copy'
    },
    removeFile(index) {
      console.log("file deleted")
      this.files.delete(index)
    },
    openFileDialog() {
      document.getElementById('file').click()
    },
  }
}
</script>

<style scoped lang="scss">
.filelist {
  .fileitem__loading {
    color: #bbb;
  }
  &.filelist__empty {
    border: #603 dotted;
    padding: 0.5em;
    margin: 0.5em 1em;
    text-align: center;
  }
}

</style>
<!-- vim: set backupcopy=yes :-->
